/* ============================================================
   西游纪 Blood-West · 核心状态与常量
   所有模块的基础依赖，必须最先加载
   ============================================================ */

// ----- Supabase 配置 -----
const SUPABASE_URL = 'https://uwshulmdtrdirskdkjdr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3c2h1bG1kdHJkaXJza2RramRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDc3NzYsImV4cCI6MjA5NTUyMzc3Nn0.ORY33jhiSHX3d5jX2UyGVmmUceG9aLDSAj6ldFBBaCc';

// ----- 固定座位槽位（pill 长圆桌周围 19 个位置，全周均匀分布）-----
const SEAT_SLOTS = 19;
// 预计算每个槽位的参数角度（弧度，0=顶部，顺时针）
const SLOT_ANGLES = Array.from({ length: SEAT_SLOTS }, (_, i) =>
    (i / SEAT_SLOTS) * 2 * Math.PI - Math.PI / 2
);

// 浮点数比较容差（解决 JS ↔ PostgreSQL JSON 序列化精度差异）
const ANGLE_EPSILON = 0.00001;

// 判断两个角度是否指向同一槽位
function angleEquals(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    return Math.abs(a - b) < ANGLE_EPSILON;
}

// 根据角度值查找对应槽位索引（-1 表示未匹配）
function angleToSlot(angle) {
    if (angle == null) return -1;
    for (let i = 0; i < SEAT_SLOTS; i++) {
        if (angleEquals(angle, SLOT_ANGLES[i])) return i;
    }
    return -1;
}

// ----- 全局状态 -----
const state = {
    supabase: null,
    room: null,             // { id, code, phase }
    players: [],            // [{ id, player_number, openid, ... }]
    selectedPlayer: null,   // 当前选中玩家
    messages: [],           // 当前显示的消息
    realtimeChannel: null,  // Supabase Realtime 频道
    newMsgPlayers: new Set(), // 有新消息未查看的玩家 ID 集合
    activeBoard: null,      // 当前版型 { playerCount, distribution, roles[] }
    evilMessages: [],       // 邪恶群聊消息
    msgTab: 'private',      // 当前消息面板 Tab：'private' | 'evil'
    evilUnread: false       // 邪恶群聊是否有未读消息
};

// 拖拽进行中标记（防止 Realtime 回调在拖拽期间重建 DOM）
let isDragging = false;

// ----- DOM 快捷引用 -----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ----- 微信订阅消息云函数 HTTP 地址（国内可达）-----
const WORKER_URL = 'https://cloudbase-d4g9rcvtd370cce65.service.tcloudbase.com/notify';
// HTTP 访问服务域名
// 订阅消息模板 ID（需在微信公众平台配置后替换）
const SUBSCRIBE_TEMPLATE_ID = 'ELYdEaBoZHItuthAfaj1l3upI8Z0yNGNMnFHC7QTUuI';

// ----- localStorage 键名 -----
const STORAGE_KEY = 'botc_room';

// ----- 通用工具函数 -----

// HTML 转义防止 XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
