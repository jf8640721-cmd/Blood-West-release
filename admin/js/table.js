/* ============================================================
   西游纪 Blood-West · Canvas 铜镜圆桌模块
   8环敦煌铜镜星盘 + 经卷纸纹理 + 圆形座位布局
   依赖：state.js, data/roles.js
   ============================================================ */

// ---- Canvas 状态 ----
let _tableCtx = null;
let _tableCanvas = null;
let _tableTexImg = null;
let _tableTexLoaded = false;
let _tableSize = 560;
let _tableDPR = Math.min(window.devicePixelRatio || 1, 2);
let _tableCx = 0, _tableCy = 0, _tableR = 0;

// 当前阶段文字（由 room.js 设置）
window._tablePhase = window._tablePhase || '首夜';

// ---- 纹理加载 ----
(function initTexture() {
    _tableTexImg = new Image();
    _tableTexImg.onload = function() {
        _tableTexLoaded = true;
    };
    _tableTexImg.onerror = function() {
        console.warn('经卷纸纹理加载失败，将使用纯色渲染');
    };
    _tableTexImg.src = 'msg-bg-parchment.jpg';

    // 等两帧确保 CSS 布局完成后再绘制（解决缓存图片同步 onload 时 clientHeight=0 的问题）
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            drawRoundTable();
        });
    });

    // 兜底：window.onload 时再画一次（确保所有资源加载完毕）
    window.addEventListener('load', function() {
        setTimeout(function() { drawRoundTable(); }, 100);
    });
})();

// 辅助：在环形区域内叠加经卷纸纹理
function _texRing(rOuter, rInner, sx, sy, sw, sh, alpha) {
    if (!_tableTexLoaded || !_tableCtx) return;
    const ctx = _tableCtx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(_tableCx, _tableCy, rOuter, 0, Math.PI * 2);
    if (rInner > 0) ctx.arc(_tableCx, _tableCy, rInner, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.globalAlpha = alpha;
    const ts = rOuter * 2;
    ctx.drawImage(_tableTexImg, sx, sy, sw, sh, _tableCx - rOuter, _tableCy - rOuter, ts, ts);
    ctx.globalAlpha = 1;
    ctx.restore();
}

// ---- Canvas 圆桌绘制 ----
function drawRoundTable() {
    const canvas = document.getElementById('table-canvas');
    if (!canvas) return;
    _tableCanvas = canvas;
    _tableCtx = canvas.getContext('2d');
    const ctx = _tableCtx;

    // 响应式尺寸
    const container = document.getElementById('round-table-container');
    const parent = container ? container.parentElement : null;
    if (!parent) return;

    const maxSize = Math.min(parent.clientWidth * 0.88, parent.clientHeight * 0.88, _tableSize);

    // 容器尺寸尚未就绪（CSS 布局未完成），延迟重试（最多10次）
    if (maxSize <= 0) {
        if (!drawRoundTable._retryCount) drawRoundTable._retryCount = 0;
        if (drawRoundTable._retryCount < 10) {
            drawRoundTable._retryCount++;
            requestAnimationFrame(function() { drawRoundTable(); });
        } else {
            console.warn('Canvas 容器尺寸始终为0，放弃绘制。parent.clientWidth=' + parent.clientWidth + ', parent.clientHeight=' + parent.clientHeight);
            drawRoundTable._retryCount = 0;
        }
        return;
    }
    drawRoundTable._retryCount = 0;

    const scale = maxSize / _tableSize;
    const DPR = _tableDPR;
    canvas.width = _tableSize * DPR;
    canvas.height = _tableSize * DPR;
    canvas.style.width = maxSize + 'px';
    canvas.style.height = maxSize + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // 座位覆盖层同步尺寸
    const overlay = document.getElementById('seats-overlay');
    if (overlay) {
        overlay.style.width = maxSize + 'px';
        overlay.style.height = maxSize + 'px';
    }

    const cx = _tableSize / 2;
    const cy = _tableSize / 2;
    const R = _tableSize * 0.46;
    _tableCx = cx; _tableCy = cy; _tableR = R;

    ctx.clearRect(0, 0, _tableSize, _tableSize);

    // ---- 第1层：鎏金外框 ----
    const r1 = R, r1i = R - 10;
    const grad1 = ctx.createRadialGradient(cx, cy, r1i, cx, cy, r1);
    grad1.addColorStop(0, '#8b6914');
    grad1.addColorStop(0.5, '#d49a3a');
    grad1.addColorStop(0.85, '#edc379');
    grad1.addColorStop(1, '#5a3e10');
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.arc(cx, cy, r1i, 0, Math.PI * 2, true);
    ctx.fillStyle = grad1; ctx.fill();
    _texRing(r1, r1i, 300, 100, 900, 900, 0.10);

    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(237,195,121,0.6)';
    ctx.lineWidth = 2; ctx.stroke();

    // ---- 第2层：铆钉环（12颗） ----
    const r2o = r1i - 2, r2i = r2o - 16;
    ctx.beginPath();
    ctx.arc(cx, cy, r2o, 0, Math.PI * 2);
    ctx.arc(cx, cy, r2i, 0, Math.PI * 2, true);
    const grad2 = ctx.createRadialGradient(cx, cy, r2i, cx, cy, r2o);
    grad2.addColorStop(0, '#4a3020'); grad2.addColorStop(1, '#2a1808');
    ctx.fillStyle = grad2; ctx.fill();
    _texRing(r2o, r2i, 350, 400, 800, 800, 0.10);

    const rivetCount = 12;
    const rivetR = (r2o + r2i) / 2;
    for (let i = 0; i < rivetCount; i++) {
        const angle = (i / rivetCount) * Math.PI * 2 - Math.PI / 2;
        const rx = cx + Math.cos(angle) * rivetR;
        const ry = cy + Math.sin(angle) * rivetR;
        ctx.beginPath();
        ctx.arc(rx + 1, ry + 1, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill();
        const rivetGrad = ctx.createRadialGradient(rx - 1, ry - 1, 0.5, rx, ry, 3.5);
        rivetGrad.addColorStop(0, '#edc379');
        rivetGrad.addColorStop(0.6, '#d49a3a');
        rivetGrad.addColorStop(1, '#8b6914');
        ctx.beginPath();
        ctx.arc(rx, ry, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = rivetGrad; ctx.fill();
    }

    // ---- 第3层：星宿刻度环 ----
    const r3o = r2i - 2, r3i = r3o - 20;
    ctx.beginPath();
    ctx.arc(cx, cy, r3o, 0, Math.PI * 2);
    ctx.arc(cx, cy, r3i, 0, Math.PI * 2, true);
    const grad3 = ctx.createRadialGradient(cx, cy, r3i, cx, cy, r3o);
    grad3.addColorStop(0, '#3a2818'); grad3.addColorStop(0.5, '#2a1808'); grad3.addColorStop(1, '#1a0a03');
    ctx.fillStyle = grad3; ctx.fill();
    _texRing(r3o, r3i, 400, 700, 700, 700, 0.14);

    const tickCount = 24;
    for (let i = 0; i < tickCount; i++) {
        const angle = (i / tickCount) * Math.PI * 2 - Math.PI / 2;
        const isMajor = i % 3 === 0;
        const len = isMajor ? 14 : 6;
        const outerR = r3o - 3, innerR = outerR - len;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
        ctx.lineTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
        ctx.strokeStyle = isMajor ? 'rgba(212,154,58,0.8)' : 'rgba(180,120,50,0.35)';
        ctx.lineWidth = isMajor ? 1.5 : 0.7;
        ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const dotR = r3o - 19;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dotR, cy + Math.sin(angle) * dotR, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#edc379'; ctx.fill();
    }

    // ---- 第4层：鎏金铭文分隔环 ----
    const r4o = r3i - 2, r4i = r4o - 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r4o, 0, Math.PI * 2);
    ctx.arc(cx, cy, r4i, 0, Math.PI * 2, true);
    const grad4 = ctx.createRadialGradient(cx, cy, r4i, cx, cy, r4o);
    grad4.addColorStop(0, '#8b6914'); grad4.addColorStop(0.5, '#d49a3a'); grad4.addColorStop(1, '#5a3e10');
    ctx.fillStyle = grad4; ctx.fill();
    _texRing(r4o, r4i, 250, 200, 1000, 1000, 0.10);

    // ---- 第5层：木纹桌面 ----
    const r5o = r4i - 1, r5i = r5o - 140;
    ctx.beginPath();
    ctx.arc(cx, cy, r5o, 0, Math.PI * 2);
    ctx.arc(cx, cy, r5i, 0, Math.PI * 2, true);
    const grad5 = ctx.createRadialGradient(cx, cy, r5i, cx, cy, r5o);
    grad5.addColorStop(0, '#2a1808'); grad5.addColorStop(0.5, '#1a0c03'); grad5.addColorStop(1, '#0d0400');
    ctx.fillStyle = grad5; ctx.fill();
    _texRing(r5o, r5i, 200, 150, 1100, 1100, 0.22);

    // 木纹
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r5o, 0, Math.PI * 2);
    ctx.arc(cx, cy, r5i, 0, Math.PI * 2, true);
    ctx.clip();
    for (let r = r5i + 4; r < r5o; r += 12 + Math.random() * 5) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(180,140,100,' + (0.02 + Math.random() * 0.04) + ')';
        ctx.lineWidth = 0.5 + Math.random() * 1;
        ctx.stroke();
    }
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        const sr = r5i + Math.random() * (r5o - r5i) * 0.6;
        const er = sr + 10 + Math.random() * 30;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * sr, cy + Math.sin(angle) * sr);
        ctx.lineTo(cx + Math.cos(angle) * Math.min(er, r5o), cy + Math.sin(angle) * Math.min(er, r5o));
        ctx.strokeStyle = 'rgba(160,120,80,' + (0.02 + Math.random() * 0.03) + ')';
        ctx.lineWidth = 0.3 + Math.random() * 0.5;
        ctx.stroke();
    }
    ctx.restore();

    // ---- 第6层：鎏金内框 ----
    const r6o = r5i, r6i = r6o - 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r6o, 0, Math.PI * 2);
    ctx.arc(cx, cy, r6i, 0, Math.PI * 2, true);
    const grad6 = ctx.createRadialGradient(cx, cy, r6i, cx, cy, r6o);
    grad6.addColorStop(0, '#6a4a1a'); grad6.addColorStop(0.4, '#c49a3a');
    grad6.addColorStop(0.7, '#d49a3a'); grad6.addColorStop(1, '#4a2a08');
    ctx.fillStyle = grad6; ctx.fill();
    _texRing(r6o, r6i, 300, 300, 900, 900, 0.10);

    // ---- 第7层：青铜罗盘 ----
    const r7o = r6i - 1, r7i = r7o - 60;
    ctx.beginPath();
    ctx.arc(cx, cy, r7o, 0, Math.PI * 2);
    ctx.arc(cx, cy, r7i, 0, Math.PI * 2, true);
    const grad7 = ctx.createRadialGradient(cx, cy, r7i, cx, cy, r7o);
    grad7.addColorStop(0, '#5a4028'); grad7.addColorStop(0.6, '#3a2410'); grad7.addColorStop(1, '#1a0a03');
    ctx.fillStyle = grad7; ctx.fill();
    _texRing(r7o, r7i, 450, 650, 600, 600, 0.16);

    // 十字方位线
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * (r7i + 6), cy + Math.sin(angle) * (r7i + 6));
        ctx.lineTo(cx + Math.cos(angle) * (r7o - 6), cy + Math.sin(angle) * (r7o - 6));
        ctx.strokeStyle = 'rgba(212,154,58,0.2)'; ctx.lineWidth = 1; ctx.stroke();
    }

    // ---- 第8层：魂芯 ----
    const r8 = r7i + 1;
    const grad8 = ctx.createRadialGradient(cx, cy, r8 - 4, cx, cy, r8);
    grad8.addColorStop(0, '#8b6914'); grad8.addColorStop(0.5, '#d49a3a'); grad8.addColorStop(1, '#4a2a08');
    ctx.beginPath(); ctx.arc(cx, cy, r8, 0, Math.PI * 2);
    ctx.fillStyle = grad8; ctx.fill();

    const rCore = r8 - 4;
    const gradCore = ctx.createRadialGradient(cx - 2, cy - 2, rCore * 0.1, cx, cy, rCore);
    gradCore.addColorStop(0, '#8b3a20'); gradCore.addColorStop(0.4, '#4a1810'); gradCore.addColorStop(1, '#1a0402');
    ctx.beginPath(); ctx.arc(cx, cy, rCore, 0, Math.PI * 2);
    ctx.fillStyle = gradCore; ctx.fill();
    _texRing(rCore, 0, 500, 1200, 500, 500, 0.14);

    // 十字准线
    ctx.beginPath();
    ctx.moveTo(cx - rCore * 0.7, cy); ctx.lineTo(cx + rCore * 0.7, cy);
    ctx.moveTo(cx, cy - rCore * 0.7); ctx.lineTo(cx, cy + rCore * 0.7);
    ctx.strokeStyle = 'rgba(237,195,121,0.45)'; ctx.lineWidth = 1; ctx.stroke();

    // 中心亮点 + 阶段文字
    const gradCenter = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6);
    gradCenter.addColorStop(0, '#fff8e0'); gradCenter.addColorStop(0.3, '#edc379');
    gradCenter.addColorStop(0.6, '#d49a3a'); gradCenter.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = gradCenter; ctx.fill();

    // 阶段文字
    const phase = window._tablePhase || '首夜';
    ctx.fillStyle = '#d4b87a';
    ctx.font = 'bold 16px "Noto Serif SC", "STKaiti", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(219,168,81,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(phase, cx, cy - rCore - 18);
    ctx.shadowBlur = 0;
}

// ---- 座位位置计算（圆形，基于 Canvas 容器） ----
function computeSeatPosition(angle) {
    const canvas = document.getElementById('table-canvas');
    if (!canvas || !canvas.style.width) return { x: 0, y: 0 };
    const canvasDisplaySize = parseFloat(canvas.style.width);
    const cx = canvasDisplaySize / 2;
    const cy = canvasDisplaySize / 2;
    const seatR = canvasDisplaySize * 0.46 + 28; // 桌面半径 + 座位偏移
    return {
        x: cx + Math.cos(angle) * seatR,
        y: cy + Math.sin(angle) * seatR
    };
}

// ---- 找最近的槽位 ----
function findClosestSlot(clientX, clientY) {
    const canvas = document.getElementById('table-canvas');
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    let bestSlot = 0, bestDist = Infinity;
    for (let i = 0; i < SEAT_SLOTS; i++) {
        const pos = computeSeatPosition(SLOT_ANGLES[i]);
        const sx = rect.left + pos.x;
        const sy = rect.top + pos.y;
        const dist = Math.hypot(clientX - sx, clientY - sy);
        if (dist < bestDist) { bestDist = dist; bestSlot = i; }
    }
    return bestSlot;
}

// ---- 槽位 ↔ 玩家 ----
function getPlayerAtSlot(slotIndex) {
    const slotAngle = SLOT_ANGLES[slotIndex];
    return state.players.find(p => angleEquals(p.seat_angle, slotAngle)) || null;
}
function getPlayerSlot(player) {
    return angleToSlot(player.seat_angle);
}

// ---- 渲染圆桌 ----
function renderRoundTable() {
    const overlay = document.getElementById('seats-overlay');
    const emptyHint = document.getElementById('table-empty-hint');

    // 绘制 Canvas
    drawRoundTable();

    if (!overlay) return;

    if (state.players.length === 0) {
        overlay.innerHTML = '';
        if (emptyHint) emptyHint.style.display = 'block';
        renderPlayerList();
        return;
    }

    if (emptyHint) emptyHint.style.display = 'none';

    // 为新玩家分配空槽位
    const usedSlots = new Set(
        state.players
            .filter(p => p.seat_angle !== null && p.seat_angle !== undefined)
            .map(p => angleToSlot(p.seat_angle))
            .filter(idx => idx !== -1)
    );
    state.players.forEach(player => {
        if (player.seat_angle === null || player.seat_angle === undefined
            || angleToSlot(player.seat_angle) === -1) {
            for (let i = 0; i < SEAT_SLOTS; i++) {
                if (!usedSlots.has(i)) {
                    player.seat_angle = SLOT_ANGLES[i];
                    usedSlots.add(i); break;
                }
            }
        }
    });

    // 渲染座位到 overlay
    overlay.innerHTML = '';
    for (let i = 0; i < SEAT_SLOTS; i++) {
        const angle = SLOT_ANGLES[i];
        const pos = computeSeatPosition(angle);
        const occupied = getPlayerAtSlot(i);
        if (occupied) {
            const displayName = occupied.nickname || '未命名玩家';
            const selectedClass = state.selectedPlayer && state.selectedPlayer.id === occupied.id ? 'selected' : '';
            const newClass = state.newMsgPlayers.has(occupied.id) ? 'has-new' : '';
            const statusClass = 'status-' + (occupied.status || 'alive');
            const statusTitle = occupied.status === 'executed' ? '处决' :
                                occupied.status === 'killed_at_night' ? '夜死' : '存活';
            overlay.insertAdjacentHTML('beforeend',
                `<div class="player-seat ${selectedClass} ${newClass} ${statusClass}"
                     data-player-id="${occupied.id}" data-slot="${i}"
                     style="left:${pos.x}px;top:${pos.y}px;">
                  <div class="seat-dot">
                    <span class="status-toggle" title="点击切换状态 · 当前：${statusTitle}"></span>
                  </div>
                  <div class="seat-label" onclick="editPlayerNickname('${occupied.id}');event.stopPropagation();" title="点击修改名牌">${escapeHtml(displayName)} <span class="name-edit-icon">✎</span></div>
                  ${renderRoleBadgeHtml(occupied)}
                  <span class="kick-btn seat-kick-btn" data-player-id="${occupied.id}" title="踢出房间">⛔</span>
                </div>`);
        } else {
            overlay.insertAdjacentHTML('beforeend',
                `<div class="player-seat seat-empty" data-slot="${i}"
                     style="left:${pos.x}px;top:${pos.y}px;">
                  <div class="seat-dot"></div>
                </div>`);
        }
    }
    renderPlayerList();
}

// ---- 渲染左侧玩家列表 ----
function renderPlayerList() {
    const list = document.getElementById('rt-player-list');
    if (!list) return;
    if (state.players.length === 0) {
        list.innerHTML = '<li class="player-empty">暂无玩家</li>';
    } else {
        list.innerHTML = state.players.map((p, index) => {
            const activeClass = state.selectedPlayer && state.selectedPlayer.id === p.id ? 'active' : '';
            const newClass = state.newMsgPlayers.has(p.id) ? 'has-new' : '';
            const displayName = p.nickname || '未命名玩家';
            const statusBadge = (p.status && p.status !== 'alive')
                ? `<span class="status-badge status-badge-${p.status}" title="${p.status === 'executed' ? '处决' : '夜死'}"></span>` : '';
            const roleObj = getPlayerRoleObj(p);
            const roleNameHtml = roleObj
                ? `<span class="player-role-name player-role-${roleObj.category}">${roleObj.name}</span>` : '';
            return `<li class="player-item ${activeClass} ${newClass}"
                        data-player-id="${p.id}" data-index="${index}" draggable="true">
                      <span class="drag-handle">⠿</span>
                      <span class="player-name" onclick="editPlayerNickname('${p.id}');event.stopPropagation();" title="点击修改名牌">${escapeHtml(displayName)} <span class="name-edit-icon">✎</span></span>${roleNameHtml}
                      ${statusBadge}
                      <span class="new-msg-dot"></span>
                      <span class="kick-btn" data-player-id="${p.id}" title="踢出房间">⛔</span>
                    </li>`;
        }).join('');
    }
    const countEl = document.getElementById('rt-player-count');
    if (countEl) countEl.textContent = state.players.length;
}

// ---- 拖拽排序（玩家列表） ----
function setupRtDragAndDrop() {
    const list = document.getElementById('rt-player-list');
    if (!list) return;
    list.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.player-item');
        if (!item) return;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
    });
    list.addEventListener('dragend', () => {
        list.querySelectorAll('.player-item').forEach(el => el.classList.remove('dragging', 'drag-over'));
    });
    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const item = e.target.closest('.player-item');
        if (!item) return;
        list.querySelectorAll('.player-item').forEach(el => { if (el !== item) el.classList.remove('drag-over'); });
        item.classList.add('drag-over');
    });
    list.addEventListener('drop', (e) => {
        e.preventDefault();
        const item = e.target.closest('.player-item');
        if (!item) return;
        item.classList.remove('drag-over');
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = parseInt(item.dataset.index);
        if (fromIndex === toIndex || isNaN(fromIndex) || isNaN(toIndex)) return;
        const [moved] = state.players.splice(fromIndex, 1);
        state.players.splice(toIndex, 0, moved);
        renderPlayerList();
    });
    list.addEventListener('click', (e) => {
        const kickBtn = e.target.closest('.kick-btn');
        if (kickBtn) { e.stopPropagation(); kickPlayer(kickBtn.dataset.playerId); return; }
        const item = e.target.closest('.player-item');
        if (!item) return;
        const playerId = item.dataset.playerId;
        if (playerId) selectPlayer(playerId);
    });
}

// ---- 座位点击 ----
function setupSeatClickHandler() {
    const overlay = document.getElementById('seats-overlay');
    if (!overlay) return;
    overlay.addEventListener('click', (e) => {
        const kickBtn = e.target.closest('.kick-btn');
        if (kickBtn) { e.stopPropagation(); kickPlayer(kickBtn.dataset.playerId); return; }
    });
}

// ---- 座位交换拖拽 ----
// isDragging 已在 state.js 中声明，此处直接使用
function setupSeatSwap() {
    let draggedSeat = null, startSlot = -1, startPlayerId = null;
    let hasDragged = false, startX = 0, startY = 0, lastMouseX = 0, lastMouseY = 0;

    document.addEventListener('mousedown', (e) => {
        if (e.target.closest('.status-toggle')) {
            const seat = e.target.closest('.player-seat:not(.seat-empty)');
            if (seat && seat.dataset.playerId) {
                e.preventDefault(); e.stopPropagation();
                togglePlayerStatus(seat.dataset.playerId);
            }
            return;
        }
        const seat = e.target.closest('.player-seat:not(.seat-empty)');
        if (!seat) return;
        isDragging = true; draggedSeat = seat;
        startSlot = parseInt(seat.dataset.slot);
        startPlayerId = seat.dataset.playerId;
        hasDragged = false;
        startX = e.clientX; startY = e.clientY;
        lastMouseX = e.clientX; lastMouseY = e.clientY;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        lastMouseX = e.clientX; lastMouseY = e.clientY;
        if (!draggedSeat) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!hasDragged && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (!hasDragged) {
            hasDragged = true;
            draggedSeat.style.zIndex = '10';
            draggedSeat.style.opacity = '0.85';
            draggedSeat.style.transition = 'none';
        }
        const canvas = document.getElementById('table-canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        draggedSeat.style.left = (e.clientX - rect.left) + 'px';
        draggedSeat.style.top = (e.clientY - rect.top) + 'px';
    });

    document.addEventListener('mouseup', async () => { if (draggedSeat) await _finishDrag(); });

    // 触摸事件
    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.kick-btn')) return;
        if (e.target.closest('.status-toggle')) {
            const seat = e.target.closest('.player-seat:not(.seat-empty)');
            if (seat && seat.dataset.playerId) {
                e.preventDefault(); e.stopPropagation();
                togglePlayerStatus(seat.dataset.playerId);
            }
            return;
        }
        const seat = e.target.closest('.player-seat:not(.seat-empty)');
        if (!seat) return;
        isDragging = true; draggedSeat = seat;
        startSlot = parseInt(seat.dataset.slot);
        startPlayerId = seat.dataset.playerId;
        hasDragged = false;
        const touch = e.touches[0];
        startX = touch.clientX; startY = touch.clientY;
        lastMouseX = touch.clientX; lastMouseY = touch.clientY;
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!draggedSeat) return;
        const touch = e.touches[0];
        lastMouseX = touch.clientX; lastMouseY = touch.clientY;
        const dx = touch.clientX - startX, dy = touch.clientY - startY;
        if (!hasDragged && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (!hasDragged) {
            hasDragged = true;
            draggedSeat.style.zIndex = '10';
            draggedSeat.style.opacity = '0.85';
            draggedSeat.style.transition = 'none';
        }
        const canvas = document.getElementById('table-canvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        draggedSeat.style.left = (touch.clientX - rect.left) + 'px';
        draggedSeat.style.top = (touch.clientY - rect.top) + 'px';
    }, { passive: false });

    document.addEventListener('touchend', async (e) => {
        if (!draggedSeat) return;
        if (!hasDragged && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            lastMouseX = touch.clientX; lastMouseY = touch.clientY;
        }
        await _finishDrag();
    });

    document.addEventListener('touchcancel', async () => { if (draggedSeat) await _finishDrag(); });

    async function _finishDrag() {
        if (!draggedSeat) return;
        if (hasDragged) {
            draggedSeat.style.zIndex = ''; draggedSeat.style.opacity = '';
            draggedSeat.style.transition = '';
            const closestSlot = findClosestSlot(lastMouseX, lastMouseY);
            if (closestSlot !== startSlot) {
                try { await swapSeats(startSlot, closestSlot); } catch (err) {
                    console.error('座位交换失败:', err);
                }
            }
            renderRoundTable();
        } else {
            if (startPlayerId) selectPlayer(startPlayerId);
        }
        isDragging = false; draggedSeat = null;
        startSlot = -1; startPlayerId = null; hasDragged = false;
    }
}

// ---- 交换座位 ----
async function swapSeats(slotA, slotB) {
    if (slotA === slotB) return;
    const playerA = getPlayerAtSlot(slotA);
    const playerB = getPlayerAtSlot(slotB);
    const angleA = SLOT_ANGLES[slotA];
    const angleB = SLOT_ANGLES[slotB];
    if (playerA) playerA.seat_angle = angleB;
    if (playerB) playerB.seat_angle = angleA;
    const updates = [];
    if (playerA) updates.push(state.supabase.from('players').update({ seat_angle: angleB }).eq('id', playerA.id));
    if (playerB) updates.push(state.supabase.from('players').update({ seat_angle: angleA }).eq('id', playerB.id));
    await Promise.all(updates);
}

// 窗口 resize 时重绘 Canvas
window.addEventListener('resize', () => {
    if (state.players && state.players.length > 0) drawRoundTable();
});
