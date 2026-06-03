/* ============================================================
   西游纪 Blood-West · 主持后台 — 主入口
   初始化 + 事件绑定，所有业务逻辑已拆分到 admin/js/ 模块
   ============================================================ */

// ----- 初始化 -----
function init() {
    state.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    bindEvents();
    setupRtDragAndDrop();
    setupSeatSwap();
    setupSeatClickHandler();
    restoreRoom();
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
// 调试工具：模拟玩家加入（浏览器控制台调用）
// 用法：debugAddTestPlayers(15) — 添加15名测试玩家
// ============================================================
const TEST_NICKNAMES = [
    '孙悟空', '猪八戒', '沙和尚', '唐三藏', '白龙马',
    '牛魔王', '铁扇公主', '红孩儿', '哪吒', '二郎神',
    '嫦娥', '观音', '如来', '玉皇大帝', '王母娘娘',
    '太白金星', '李靖', '金角大王', '银角大王', '蜘蛛精'
];

async function debugAddTestPlayers(count) {
    if (!state.room) {
        console.error('❌ 请先创建房间');
        return;
    }
    count = count || 15;

    console.log(`正在添加 ${count} 名测试玩家...`);

    const players = [];
    for (let i = 0; i < count; i++) {
        players.push({
            room_id: state.room.id,
            openid: 'test_' + Date.now() + '_' + i,
            nickname: TEST_NICKNAMES[i] || ('测试玩家' + (i + 1))
        });
    }

    const { data, error } = await state.supabase
        .from('players')
        .insert(players)
        .select();

    if (error) {
        console.error('❌ 添加失败：', error.message);
        return;
    }

    console.log(`✅ 成功添加 ${data.length} 名玩家（房间码：${state.room.code}）`);
    console.log('玩家序号已自动分配，可通过小程序扫码或手动输入房间码加入');
    return data;
}

// 调试工具：清除所有测试玩家
async function debugClearTestPlayers() {
    if (!state.room) {
        console.error('❌ 请先创建房间');
        return;
    }

    const { error } = await state.supabase
        .from('players')
        .delete()
        .eq('room_id', state.room.id)
        .like('openid', 'test_%');

    if (error) {
        console.error('❌ 清除失败：', error.message);
        return;
    }

    console.log('✅ 已清除所有测试玩家');
}

// ============================================================
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', init);
