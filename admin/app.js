/* ============================================================
   西游纪 Blood-West · 主持后台 — 主入口
   初始化 + 事件绑定，所有业务逻辑已拆分到 admin/js/ 模块
   ============================================================ */

// ----- 初始化 -----
function init() {
    // v3.0.41: 防御 Supabase CDN 加载失败导致整个系统不可用
    try {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase 客户端初始化成功');
        } else {
            console.error('❌ Supabase CDN 未加载（window.supabase 不存在），请检查网络连接');
            alert('系统初始化失败：Supabase 库加载失败。\n\n请检查网络连接后刷新页面。\n如果使用 file:// 协议打开，请确认能访问外网。');
        }
    } catch(e) {
        console.error('❌ Supabase 客户端创建失败:', e);
        state.supabase = null;
    }

    // 无论 Supabase 是否成功，都绑定事件（确保按钮可点击）
    bindEvents();
    setupRtDragAndDrop();
    setupSeatSwap();
    setupSeatClickHandler();

    // 仅当 Supabase 可用时才尝试恢复房间
    if (state.supabase) {
        restoreRoom();
    }
}

// ----- 事件绑定 -----
function bindEvents() {
    $('#btn-create-room').addEventListener('click', createRoom);
    $('#btn-phase-prev').addEventListener('click', togglePhaseBackward);
    $('#btn-phase-next').addEventListener('click', togglePhaseForward);
    $('#btn-show-qr').addEventListener('click', showQRCode);
    $('#btn-close-qr').addEventListener('click', () => {
        $('#qr-modal').style.display = 'none';
    });
    $('#btn-exit-room').addEventListener('click', exitRoom);

    // 阶段确认弹窗事件
    $('#btn-phase-confirm-cancel').addEventListener('click', hidePhaseConfirm);
    $('#btn-phase-confirm-ok').addEventListener('click', executePhaseSwitch);
    $('#phase-confirm-modal').addEventListener('click', (e) => {
        if (e.target === $('#phase-confirm-modal')) {
            hidePhaseConfirm();
        }
    });

    // 点击弹窗外部关闭
    $('#qr-modal').addEventListener('click', (e) => {
        if (e.target === $('#qr-modal')) {
            $('#qr-modal').style.display = 'none';
        }
    });

    // 消息回复
    $('#rt-btn-send-reply').addEventListener('click', replyToPlayer);
    $('#rt-reply-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') replyToPlayer();
    });

    // 快捷回复模板按钮
    document.querySelectorAll('.btn-quick-reply').forEach(btn => {
        btn.addEventListener('click', function() {
            sendQuickReply(this.getAttribute('data-reply'));
        });
    });

    // 版型配置
    $('#btn-board-config').addEventListener('click', openBoardPanel);
    $('#btn-close-board').addEventListener('click', closeBoardPanel);
    $('#btn-board-count-minus').addEventListener('click', () => adjustBoardCount(-1));
    $('#btn-board-count-plus').addEventListener('click', () => adjustBoardCount(1));
    $('#btn-board-refresh').addEventListener('click', refreshBoard);
    $('#btn-board-restore').addEventListener('click', restoreBoardPanel);
    $('#btn-board-confirm').addEventListener('click', confirmBoard);
    $('#board-modal').addEventListener('click', (e) => {
        if (e.target === $('#board-modal')) closeBoardPanel();
    });

    // 角色选择
    $('#rt-role-select').addEventListener('change', function() {
        onRoleSelected(this.value);
    });

    // 邪恶群聊
    $('#btn-evil-send').addEventListener('click', sendEvilMessage);
    $('#evil-reply-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendEvilMessage();
    });
}

// ============================================================
// 调试工具：仅 localhost/本地环境可见
// ============================================================
(function() {
    var host = window.location.hostname;
    var isLocal = (window.location.protocol === 'file:' || host === '' || host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.endsWith('.local'));
    if (!isLocal) {
        // 生产环境：隐藏调试按钮并覆盖调试函数
        var style = document.createElement('style');
        style.textContent = '#btn-debug-players { display: none !important; }';
        document.head.appendChild(style);
        var blocked = function() { console.warn('调试功能在生产环境已禁用'); };
        window.debugAddPlayers = blocked;
        window.debugAddTestPlayers = blocked;
        window.debugClearTestPlayers = blocked;
    }
})();

// ============================================================
// 调试工具：模拟玩家加入（浏览器控制台调用）
// 用法：debugAddTestPlayers(15) — 添加15名测试玩家
// ============================================================
const TEST_NICKNAMES = [
    '孙悟空', '猪八戒', '沙和尚', '唐三藏', '白龙马',
    '牛魔王', '铁扇公主', '红孩儿', '哪吒', '二郎神',
    '嫦娥', '观音', '如来', '玉皇大帝', '王母娘娘',
    '太白金星', '李靖', '金角大王', '银角大王', '蜘蛛精'
];

// UI 按钮调用：弹出输入框，默认15人
async function debugAddPlayers() {
    if (!state.room) {
        alert('请先创建房间');
        return;
    }

    // 检查是否已有玩家
    const existingCount = state.players.length;
    var defaultCount = Math.max(1, 15 - existingCount);
    var hint = existingCount > 0
        ? `（当前已有 ${existingCount} 名玩家，建议添加 ${defaultCount} 人凑满 15 人）`
        : '（默认 15 人）';

    var input = prompt('请输入要模拟加入的玩家人数：' + hint, defaultCount);
    if (input === null) return; // 用户取消

    var count = parseInt(input);
    if (isNaN(count) || count < 1) {
        alert('请输入有效的数字（1-20）');
        return;
    }
    if (count > 20) {
        alert('最多一次添加 20 人');
        return;
    }

    // 检查是否超过19个座位
    if (existingCount + count > 19) {
        alert(`圆桌只有 19 个座位，当前已有 ${existingCount} 人，最多还能加 ${19 - existingCount} 人`);
        return;
    }

    try {
        await debugAddTestPlayers(count);
    } catch (e) {
        showError('添加测试玩家', e);
    }
}

async function debugAddTestPlayers(count) {
    if (!state.room) {
        console.error('❌ 请先创建房间');
        return;
    }
    count = count || 15;

    console.log(`正在添加 ${count} 名测试玩家...`);

    var ts = Date.now();
    var players = [];
    for (var i = 0; i < count; i++) {
        players.push({
            room_id: state.room.id,
            openid: 'test_' + ts + '_' + i,
            nickname: TEST_NICKNAMES[i] || ('测试玩家' + (i + 1))
        });
    }

    var { data, error } = await state.supabase
        .from('players')
        .insert(players)
        .select();

    if (error) {
        console.error('❌ 添加失败：', error.message);
        throw error;
    }

    console.log(`✅ 成功添加 ${data.length} 名玩家（房间码：${state.room.code}）`);
    return data;
}

// 调试工具：清除所有测试玩家（软删除：标记为 kicked）
// RLS 策略禁止 anon key 执行 DELETE，故使用 UPDATE 替代
async function debugClearTestPlayers() {
    if (!state.room) {
        console.error('❌ 请先创建房间');
        return;
    }

    const { error } = await state.supabase
        .from('players')
        .update({ kicked: true })
        .eq('room_id', state.room.id)
        .like('openid', 'test_%');

    if (error) {
        console.error('❌ 清除失败：', error.message);
        return;
    }

    console.log('✅ 已标记清除所有测试玩家（kicked=true）');
}

// ============================================================
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', init);
