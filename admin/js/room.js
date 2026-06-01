/* ============================================================
   西游纪 Blood-West · 房间管理模块
   房间创建/恢复/退出、二维码、Realtime 订阅、阶段切换
   依赖：state.js
   ============================================================ */

// ============================================================
// 1. 创建房间
// ============================================================
async function createRoom() {
    const code = generateRoomCode();

    const { data, error } = await state.supabase
        .from('rooms')
        .insert([{ code, phase: '首夜' }])
        .select()
        .single();

    if (error) {
        alert('创建房间失败：' + error.message);
        return;
    }

    state.room = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: data.id, code: data.code }));
    renderRoomInfo();
    subscribeToRoom(data.id);
    showRoomUI();
    updatePhaseButton(data.phase);
}

// 生成 6 位房间码（大写字母 + 数字，排除易混淆字符）
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// 恢复已保存的房间（页面刷新后）
async function restoreRoom() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    let parsed;
    try {
        parsed = JSON.parse(saved);
    } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    // 验证房间是否仍存在
    const { data, error } = await state.supabase
        .from('rooms')
        .select('*')
        .eq('id', parsed.id)
        .single();

    if (error || !data) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    state.room = data;

    // 拉取已有玩家列表
    const { data: players } = await state.supabase
        .from('players')
        .select('*')
        .eq('room_id', data.id)
        .order('player_number', { ascending: true });

    state.players = players || [];

    // 恢复 UI 和订阅
    renderRoomInfo();
    subscribeToRoom(data.id);
    showRoomUI();
    updatePhaseButton(data.phase);
    restoreBoard();
    renderRoundTable();
    updateEvilToolbarButton(); // 恢复后检查是否有邪恶玩家
}

// 显示房间 UI（创建/恢复房间后）
function showRoomUI() {
    $('#btn-create-room').style.display = 'none';
    $('#room-info').style.display = 'flex';
    $('#btn-evil-toolbar').style.display = 'none'; // 初始隐藏，等邪恶玩家出现再显示
    $('#phase-controls').style.display = 'flex';
    $('#btn-board-config').style.display = 'inline-block';
    $('#btn-exit-room').style.display = 'inline-block';
}

// 隐藏房间 UI
function hideRoomUI() {
    $('#btn-create-room').style.display = 'inline-block';
    $('#room-info').style.display = 'none';
    $('#btn-evil-toolbar').style.display = 'none';
    $('#phase-controls').style.display = 'none';
    $('#btn-board-config').style.display = 'none';
    $('#btn-exit-room').style.display = 'none';
    // 重置右侧消息面板
    $('#rt-reply-area').style.display = 'none';
    $('#rt-role-selector').style.display = 'none';
    $('#rt-message-list').innerHTML = '<div class="msg-placeholder">点击圆桌上的玩家查看私密消息</div>';
    $('#rt-msg-panel-title').textContent = '消息记录';
    // 重置邪恶群聊面板
    $('#evil-message-list').innerHTML = '<div class="msg-placeholder">邪恶阵营玩家可在此群聊</div>';
    $('#evil-members-bar').innerHTML = '';
    $('#evil-reply-input').value = '';
    // 重置 Tab
    switchMsgTab('private', true);
    // 重置圆桌
    $('#seats-container').innerHTML = '';
    $('#rt-player-list').innerHTML = '<li class="player-empty">暂无玩家</li>';
    $('#rt-player-count').textContent = '0';
}

// 退出房间
function exitRoom() {
    if (!confirm('确定要退出当前房间吗？退出后需要重新创建房间。')) return;

    // 取消 Realtime 订阅
    if (state.realtimeChannel) {
        state.realtimeChannel.unsubscribe();
        state.realtimeChannel = null;
    }

    // 清除持久化数据
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('botc_active_board');

    // 重置状态
    state.room = null;
    state.players = [];
    state.selectedPlayer = null;
    state.messages = [];
    state.newMsgPlayers.clear();
    state.activeBoard = null;
    state.evilMessages = [];
    state.msgTab = 'private';
    state.evilUnread = false;

    // 重置 UI
    hideRoomUI();
}

// ============================================================
// 2. 二维码生成
// ============================================================
function showQRCode() {
    if (!state.room) return;

    $('#qr-room-code').textContent = state.room.code;
    $('#qr-modal').style.display = 'flex';

    // 清除旧二维码
    const container = $('#qrcode-container');
    container.innerHTML = '';

    // 生成新二维码，内容格式：BOTC:房间码
    new QRCode(container, {
        text: 'BOTC:' + state.room.code,
        width: 220,
        height: 220,
        colorDark: '#1a1a2e',
        colorLight: '#ffffff'
    });
}

// ============================================================
// 3. Realtime 订阅
// ============================================================
function subscribeToRoom(roomId) {
    // 先取消之前的订阅
    if (state.realtimeChannel) {
        state.realtimeChannel.unsubscribe();
    }

    state.realtimeChannel = state.supabase
        .channel('room-' + roomId)

        // 监听新玩家加入
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'players',
            filter: 'room_id=eq.' + roomId
        }, (payload) => {
            state.players.push(payload.new);
            state.players.sort((a, b) => a.player_number - b.player_number);
            renderRoundTable();
        })

        // 监听玩家信息更新（昵称变更、座位交换等）
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'players',
            filter: 'room_id=eq.' + roomId
        }, (payload) => {
            const idx = state.players.findIndex(p => p.id === payload.new.id);
            if (idx !== -1) {
                const oldRole = state.players[idx].role;
                state.players[idx] = payload.new;
                // 拖拽进行中时不重建 DOM，避免正在拖拽的元素被销毁
                if (!isDragging) {
                    renderRoundTable();
                }
                // 如果当前选中的玩家昵称变了，更新消息面板标题并刷新消息显示
                if (state.selectedPlayer && state.selectedPlayer.id === payload.new.id) {
                    state.selectedPlayer = payload.new;
                    updateMessagePanelTitle();
                    renderMessages();
                }
                // 角色变更时更新邪恶群聊按钮和成员栏
                if (oldRole !== payload.new.role) {
                    updateEvilToolbarButton();
                    if (state.msgTab === 'evil') {
                        renderEvilMembers();
                    }
                }
            }
        })

        // 监听新消息
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: 'room_id=eq.' + roomId
        }, (payload) => {
            const msg = payload.new;

            if (state.selectedPlayer) {
                if (msg.player_id === state.selectedPlayer.id ||
                    (msg.direction === 'host_to_player' && msg.player_id === state.selectedPlayer.id)) {
                    state.messages.push(msg);
                    renderMessages();
                    scrollToBottom();
                } else if (msg.direction === 'player_to_host' && msg.player_id !== state.selectedPlayer.id) {
                    // 其他玩家的新消息，标记红点
                    state.newMsgPlayers.add(msg.player_id);
                    renderRoundTable();
                }
            } else {
                // 未选中任何玩家时，标记红点
                if (msg.direction === 'player_to_host') {
                    state.newMsgPlayers.add(msg.player_id);
                    renderRoundTable();
                }
            }
        })

        // 监听邪恶群聊新消息
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'evil_chat_messages',
            filter: 'room_id=eq.' + roomId
        }, (payload) => {
            const msg = payload.new;
            state.evilMessages.push(msg);
            if (state.msgTab === 'evil') {
                renderEvilMessages();
                scrollEvilToBottom();
            } else {
                state.evilUnread = true;
                updateEvilTabBadge();
                updateEvilToolbarButton();
            }
        })

        .subscribe();
}

// ============================================================
// 4. 阶段切换：首夜 → 第1天 → 第1夜 → 第2天 → 第2夜 → ...
// ============================================================
function getNextPhase(current) {
    if (current === '首夜') return '第1天';
    const match = current.match(/第(\d+)(天|夜)/);
    if (!match) return '第1天';
    const num = parseInt(match[1]);
    const type = match[2];
    if (type === '天') return `第${num}夜`;
    return `第${num + 1}天`;
}

function getPrevPhase(current) {
    if (current === '第1天') return '首夜';
    const match = current.match(/第(\d+)(天|夜)/);
    if (!match) return null; // 首夜，没有上一阶段
    const num = parseInt(match[1]);
    const type = match[2];
    if (type === '夜') return `第${num}天`;
    if (num === 1) return '首夜';
    return `第${num - 1}夜`;
}

function getPhaseType(phase) {
    return phase.includes('夜') ? 'night' : 'day';
}

function updatePhaseButton(phase) {
    const type = getPhaseType(phase);
    const btn = $('#btn-toggle-phase');
    btn.className = 'btn btn-phase ' + type;
    if (type === 'night') {
        $('#phase-icon').textContent = '🌙';
    } else {
        $('#phase-icon').textContent = '☀️';
    }
    $('#phase-text').textContent = phase;
    $('#next-phase-hint').textContent = '下一个：' + getNextPhase(phase);

    // 后退按钮：首夜时隐藏，其他阶段显示
    const prevPhase = getPrevPhase(phase);
    const prevBtn = $('#btn-phase-prev');
    if (prevPhase) {
        prevBtn.style.display = 'block';
        prevBtn.title = '返回：' + prevPhase;
    } else {
        prevBtn.style.display = 'none';
    }
}

// 暂存待确认的阶段切换方向
let pendingPhaseDirection = 'forward'; // 'forward' | 'backward'

function showPhaseConfirm(targetPhase) {
    const modal = $('#phase-confirm-modal');
    const textEl = $('#phase-confirm-text');
    const currentPhase = state.room.phase;

    const icon = targetPhase.includes('夜') ? '🌙' : '☀️';
    textEl.innerHTML = `当前阶段：<strong>${escapeHtml(currentPhase)}</strong><br>确认切换至 <span class="phase-target">${icon} ${escapeHtml(targetPhase)}</span> ？`;

    modal.style.display = 'flex';
}

function hidePhaseConfirm() {
    $('#phase-confirm-modal').style.display = 'none';
}

async function executePhaseSwitch() {
    if (!state.room) return;

    const newPhase = pendingPhaseDirection === 'backward'
        ? getPrevPhase(state.room.phase)
        : getNextPhase(state.room.phase);

    if (!newPhase) return;

    const { error } = await state.supabase
        .from('rooms')
        .update({ phase: newPhase })
        .eq('id', state.room.id);

    if (error) {
        alert('切换失败：' + error.message);
        return;
    }

    state.room.phase = newPhase;
    updatePhaseButton(newPhase);
    updateRoundTablePhase(newPhase);
    hidePhaseConfirm();
}

async function togglePhase() {
    if (!state.room) return;

    const newPhase = getNextPhase(state.room.phase);
    pendingPhaseDirection = 'forward';
    showPhaseConfirm(newPhase);
}

async function togglePhaseBackward() {
    if (!state.room) return;

    const prevPhase = getPrevPhase(state.room.phase);
    if (!prevPhase) return;

    pendingPhaseDirection = 'backward';
    showPhaseConfirm(prevPhase);
}

// 更新圆桌中央阶段显示
function updateRoundTablePhase(phase) {
    const display = $('#table-phase-display');
    if (display) display.textContent = phase;
}

// 渲染房间信息
function renderRoomInfo() {
    if (!state.room) return;
    $('#room-code').textContent = state.room.code;
}
