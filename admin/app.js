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
// 启动
// ============================================================
document.addEventListener('DOMContentLoaded', init);
