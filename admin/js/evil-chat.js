/* ============================================================
   西游纪 Blood-West · 邪恶群聊模块
   Tab 切换、邪恶成员管理、群聊消息收发
   依赖：state.js, roles-ui.js
   ============================================================ */

// 切换消息面板 Tab
function switchMsgTab(tabName, silent) {
    state.msgTab = tabName;
    state.evilUnread = false;

    // 更新 Tab 按钮状态
    $('#tab-private').classList.toggle('active', tabName === 'private');
    $('#tab-evil').classList.toggle('active', tabName === 'evil');
    $('#tab-history').classList.toggle('active', tabName === 'history');

    // 切换内容区显示
    $('#private-chat-area').style.display = tabName === 'private' ? 'flex' : 'none';
    $('#evil-chat-area').style.display = tabName === 'evil' ? 'flex' : 'none';
    $('#history-area').style.display = tabName === 'history' ? 'flex' : 'none';

    // 更新标题
    if (tabName === 'evil') {
        $('#rt-msg-panel-title').textContent = '邪恶群聊';
        renderEvilMembers();
        if (!silent) loadEvilMessages();
    } else if (tabName === 'history') {
        $('#rt-msg-panel-title').textContent = '行动记录';
        if (!silent && typeof loadActionHistory === 'function') {
            loadActionHistory();
        }
    } else {
        const playerName = state.selectedPlayer
            ? (state.selectedPlayer.nickname || state.selectedPlayer.player_number + '号')
            : '';
        $('#rt-msg-panel-title').textContent = playerName ? '与 ' + playerName + ' 的对话' : '消息记录';
    }

    updateEvilTabBadge();
    updateEvilToolbarButton();
}

// 更新邪恶群聊 Tab 未读标记
function updateEvilTabBadge() {
    const tab = $('#tab-evil');
    if (state.evilUnread && state.msgTab !== 'evil') {
        tab.textContent = '邪恶群聊 ●';
        tab.style.color = '#e06050';
    } else {
        tab.textContent = '邪恶群聊';
        tab.style.color = '';
    }
}

// 工具栏恶魔按钮 → 切换到邪恶群聊 Tab
function switchToEvilTab() {
    switchMsgTab('evil', false);
    // 如果邪恶群聊未读，点击后清除未读状态
    state.evilUnread = false;
    updateEvilTabBadge();
    updateEvilToolbarButton();
}

// 工具栏恶魔按钮已移除，保留空函数防止调用报错
function updateEvilToolbarButton() {}

// 获取当前邪恶阵营玩家列表
function getEvilPlayers() {
    return state.players.filter(p => {
        if (!p.role) return false;
        const roleObj = getPlayerRoleObj(p);
        return roleObj && (roleObj.category === 'minion' || roleObj.category === 'demon');
    });
}

// 渲染邪恶阵营成员名牌栏
function renderEvilMembers() {
    updateEvilToolbarButton();
    const bar = $('#evil-members-bar');
    const evilPlayers = getEvilPlayers();

    if (evilPlayers.length === 0) {
        bar.innerHTML = '<span class="evil-members-empty">暂无邪恶阵营玩家（请先为玩家分配爪牙/恶魔角色）</span>';
        return;
    }

    bar.innerHTML = '<span class="evil-members-label">邪恶阵营 (' + evilPlayers.length + '人)：</span>' +
        evilPlayers.map(p => {
            const displayName = p.nickname || p.player_number + '号';
            const roleObj = getPlayerRoleObj(p);
            const roleName = roleObj ? roleObj.name : '未分配';
            const roleCat = roleObj ? roleObj.category : '';
            return '<span class="evil-member-chip">' +
                '<span class="evil-chip-dot ' + roleCat + '"></span>' +
                '<span class="evil-chip-name">' + displayName + '</span>' +
                '<span class="evil-chip-role ' + roleCat + '">' + roleName + '</span>' +
                '</span>';
        }).join('');
}

// 加载邪恶群聊历史消息
async function loadEvilMessages() {
    if (!state.room) return;

    const { data, error } = await state.supabase
        .from('evil_chat_messages')
        .select('*')
        .eq('room_id', state.room.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('加载邪恶群聊消息失败:', error);
        return;
    }

    state.evilMessages = data || [];
    renderEvilMessages();
    scrollEvilToBottom();
}

// 渲染邪恶群聊消息列表
function renderEvilMessages() {
    const list = $('#evil-message-list');
    const messages = state.evilMessages;

    if (!messages || messages.length === 0) {
        list.innerHTML = '<div class="msg-placeholder">邪恶阵营玩家可在此群聊</div>';
        return;
    }

    list.innerHTML = messages.map(msg => {
        if (msg.direction === 'host_to_group') {
            // 主持人消息
            return '<div class="evil-msg-row evil-msg-host">' +
                '<span class="evil-msg-sender evil-sender-host">📢 主持人</span>' +
                '<div class="evil-msg-bubble evil-bubble-host">' +
                escapeHtml(msg.content) +
                '</div></div>';
        } else {
            // 玩家消息 — 查找发送者信息
            const sender = state.players.find(p => p.id === msg.player_id);
            const senderName = sender
                ? (sender.nickname || sender.player_number + '号')
                : '未知玩家';
            const roleObj = sender ? getPlayerRoleObj(sender) : null;
            const roleName = roleObj ? roleObj.name : '';
            const roleCat = roleObj ? roleObj.category : '';
            const isSelf = state.selectedPlayer && state.selectedPlayer.id === msg.player_id;

            return '<div class="evil-msg-row ' + (isSelf ? 'evil-msg-self' : 'evil-msg-player') + '">' +
                '<span class="evil-msg-sender">' +
                (roleName ? '<span class="evil-sender-role ' + roleCat + '">' + roleName + '</span> ' : '') +
                '<span class="evil-sender-name">' + senderName + '</span>' +
                '</span>' +
                '<div class="evil-msg-bubble ' + (isSelf ? 'evil-bubble-self' : 'evil-bubble-player') + '">' +
                escapeHtml(msg.content) +
                '</div></div>';
        }
    }).join('');
}

// 发送消息到邪恶群聊
async function sendEvilMessage() {
    const input = $('#evil-reply-input');
    const content = input.value.trim();
    if (!content) return;
    if (!state.room) {
        alert('请先创建房间');
        return;
    }

    const { error } = await state.supabase
        .from('evil_chat_messages')
        .insert([{
            room_id: state.room.id,
            player_id: null,
            direction: 'host_to_group',
            content: content
        }]);

    if (error) {
        showError('发送邪恶群聊消息', error);
        return;
    }

    input.value = '';
    // Realtime 会自动推送消息
}

// 滚动邪恶群聊消息列表到底部
function scrollEvilToBottom() {
    const list = $('#evil-message-list');
    if (list) {
        setTimeout(() => { list.scrollTop = list.scrollHeight; }, 50);
    }
}
