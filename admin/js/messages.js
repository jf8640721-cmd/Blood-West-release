/* ============================================================
   西游纪 Blood-West · 消息面板模块
   选中玩家、消息渲染、回复、踢出、生死状态切换
   依赖：state.js, table.js, roles-ui.js
   ============================================================ */

// 更新消息面板标题
function updateMessagePanelTitle() {
    if (state.msgTab === 'evil') return;  // 邪恶群聊 Tab 有自己的标题
    const p = state.selectedPlayer;
    if (!p) return;
    const name = p.nickname || '未命名玩家';
    $('#rt-msg-panel-title').textContent = name + ' · 消息记录';
}

// 渲染消息列表
function renderMessages() {
    const container = $('#rt-message-list');

    if (state.messages.length === 0) {
        container.innerHTML = '<div class="msg-placeholder">暂无消息</div>';
        return;
    }

    container.innerHTML = state.messages.map(msg => {
        const time = new Date(msg.created_at).toLocaleTimeString('zh-CN', {
            hour: '2-digit', minute: '2-digit'
        });

        if (msg.direction === 'player_to_host') {
            const player = state.players.find(p => p.id === msg.player_id);
            const name = player
                ? (player.nickname || '未命名玩家')
                : '?';
            return `
                <div class="msg-row player-msg">
                    <div class="msg-meta">${msg.phase} · ${escapeHtml(name)}</div>
                    <div class="msg-bubble">${msg.phase} ${escapeHtml(name)}：${escapeHtml(msg.content)}</div>
                    <div class="msg-time">${time}</div>
                </div>`;
        } else {
            return `
                <div class="msg-row host-msg">
                    <div class="msg-meta">主持人回复</div>
                    <div class="msg-bubble">主持人：${escapeHtml(msg.content)}</div>
                    <div class="msg-time">${time}</div>
                </div>`;
        }
    }).join('');
}

// 消息列表滚动到底部
function scrollToBottom() {
    const container = $('#rt-message-list');
    container.scrollTop = container.scrollHeight;
}

// ============================================================
// 选中玩家 & 加载消息
// ============================================================

// 选中圆桌上的玩家
async function selectPlayer(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    // 如果当前在邪恶群聊 Tab，自动切换到私聊
    if (state.msgTab === 'evil') {
        switchMsgTab('private', true);
    }

    state.selectedPlayer = player;
    state.newMsgPlayers.delete(player.id);

    renderRoundTable();
    updateMessagePanelTitle();
    renderRoleSelector(player);
    $('#rt-reply-area').style.display = 'flex';

    const { data, error } = await state.supabase
        .from('messages')
        .select('*')
        .eq('room_id', state.room.id)
        .eq('player_id', player.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('加载消息失败:', error);
        return;
    }

    state.messages = data || [];
    renderMessages();
    scrollToBottom();
}

// 切换玩家生死状态（循环：alive → executed → killed_at_night → alive）
async function togglePlayerStatus(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    const cycle = ['alive', 'executed', 'killed_at_night'];
    const current = player.status || 'alive';
    const newStatus = cycle[(cycle.indexOf(current) + 1) % cycle.length];

    // 乐观更新本地状态
    player.status = newStatus;
    renderRoundTable();

    // 持久化到数据库
    const { error } = await state.supabase
        .from('players')
        .update({ status: newStatus })
        .eq('id', playerId);

    if (error) {
        // 回滚
        player.status = current;
        renderRoundTable();
        console.error('状态切换失败:', error);
    }
}

// ============================================================
// 回复玩家
// ============================================================
async function replyToPlayer() {
    const input = $('#rt-reply-input');
    const content = input.value.trim();

    if (!content) return;
    if (!state.selectedPlayer) {
        alert('请先选择一位玩家');
        return;
    }

    const { error } = await state.supabase
        .from('messages')
        .insert([{
            room_id: state.room.id,
            player_id: state.selectedPlayer.id,
            direction: 'host_to_player',
            content: content,
            phase: null
        }]);

    if (error) {
        alert('发送失败：' + error.message);
        return;
    }

    input.value = '';
    // 异步发送微信订阅通知（静默失败，不影响消息发送）
    sendSubscribeNotify(content);
    // Realtime 会自动推送消息，renderMessages 在 subscribe 回调中触发
}

// ============================================================
// 微信订阅消息通知（v1.8.18+）
// ============================================================
function sendSubscribeNotify(content) {
    if (!state.selectedPlayer) {
        console.log('[订阅通知] 跳过：无选中玩家');
        return;
    }
    if (!state.selectedPlayer.wechat_openid) {
        console.log('[订阅通知] 跳过：wechat_openid 为空, player:', state.selectedPlayer.player_number);
        return;
    }
    if (!SUBSCRIBE_TEMPLATE_ID || SUBSCRIBE_TEMPLATE_ID === 'SUBSCRIBE_TEMPLATE_ID') {
        console.log('[订阅通知] 跳过：TEMPLATE_ID 未配置');
        return;
    }

    var now = new Date();
    var timeStr = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);

    console.log('[订阅通知] 发送中... openid:', (state.selectedPlayer.wechat_openid || '').substring(0, 12) + '...');

    fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'send-notify',
            openid: state.selectedPlayer.wechat_openid,
            template_id: SUBSCRIBE_TEMPLATE_ID,
            page: '/pages/chat/chat',
            data: {
                thing3: { value: content.substring(0, 20) },
                thing9: { value: '说书人' },
                time2: { value: timeStr }
            }
        })
    }).then(function(res) {
        console.log('[订阅通知] 响应:', res.status);
    }).catch(function(err) {
        console.error('[订阅通知] 失败:', err);
    });
}

// 快捷回复（模板消息，不透露技能结果）
async function sendQuickReply(content) {
    if (!state.selectedPlayer) {
        alert('请先选择一位玩家');
        return;
    }

    const { error } = await state.supabase
        .from('messages')
        .insert([{
            room_id: state.room.id,
            player_id: state.selectedPlayer.id,
            direction: 'host_to_player',
            content: content,
            phase: null
        }]);

    if (error) {
        alert('发送失败：' + error.message);
        return;
    }

    // 异步发送微信订阅通知
    sendSubscribeNotify(content);
    // Realtime 会自动推送消息
}

// ============================================================
// 踢出玩家
// ============================================================
async function kickPlayer(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;

    const displayName = player.nickname || '未命名玩家';
    const confirmed = confirm(`确定要踢出玩家「${displayName}」吗？\n\n踢出后玩家将收到通知消息，无法继续参与游戏。`);

    if (!confirmed) return;

    // 1. 插入系统通知消息
    const kickMessage = '您已经被可怕的说书人请出房间，如果弄错了，请尽情吩咐说书人哈哈🐶';
    const { error: msgError } = await state.supabase
        .from('messages')
        .insert([{
            room_id: state.room.id,
            player_id: playerId,
            direction: 'host_to_player',
            content: kickMessage,
            phase: null
        }]);

    if (msgError) {
        alert('发送踢出通知失败：' + msgError.message);
        return;
    }

    // 2. 标记玩家为已踢出
    const { error: kickError } = await state.supabase
        .from('players')
        .update({ kicked: true })
        .eq('id', playerId);

    if (kickError) {
        alert('踢出失败：' + kickError.message);
        return;
    }

    // 3. 如果踢出的是当前选中的玩家，清空消息面板
    if (state.selectedPlayer && state.selectedPlayer.id === playerId) {
        state.selectedPlayer = null;
        state.messages = [];
        renderMessages();
        updateMessagePanelTitle();
        $('#rt-reply-area').style.display = 'none';
        $('#rt-role-selector').style.display = 'none';
    }

    // 4. 从本地状态移除玩家
    state.players = state.players.filter(p => p.id !== playerId);
    state.newMsgPlayers.delete(playerId);

    // 5. 重新渲染
    renderRoundTable();
}
