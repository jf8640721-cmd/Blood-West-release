/* ============================================================
   西游纪 Blood-West · 圆桌与座位模块
   圆桌渲染、座位计算、拖拽排序、座位交换
   依赖：state.js, data/roles.js
   ============================================================ */

// 计算座位在 pill（长圆）轮廓上的像素坐标
// 桌面是 CSS pill 形状（矩形 + 两端半圆），座位沿同形外扩轮廓排列
function computeSeatPosition(angle) {
    const tableEl = $('#round-table');
    const W = tableEl.offsetWidth;
    const H = tableEl.offsetHeight;
    const cx = W / 2;
    const cy = H / 2;

    // 桌面表面参数（.table-surface: top/left 8%, width/height 84%, border-radius 999px）
    const surfW = W * 0.84;
    const surfH = H * 0.84;
    const endR = surfW / 2;             // 两端半圆半径（W < H，两端完全圆角）
    const rectHalfH = surfH / 2 - endR; // 矩形段半高

    // 座位路径 = 表面外扩 gap px
    const gap = 24;
    const seatR = endR + gap;           // 两端半圆外扩
    const seatHalfH = rectHalfH + gap;  // 矩形段外扩

    // 归一化角度到 [0, 2π)
    let θ = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const sinθ = Math.sin(θ);
    const cosθ = Math.cos(θ);

    let bestT = Infinity;
    let bestX = 0, bestY = 0;

    // 射线：(cx + t*sinθ, cy - t*cosθ), t > 0
    // 找射线与座位 pill 轮廓最近的交点

    // 右侧直边：x = cx + seatR, |y - cy| ≤ seatHalfH
    if (sinθ > 0.0001) {
        const t = seatR / sinθ;
        const y = cy - t * cosθ;
        if (Math.abs(y - cy) <= seatHalfH + 1) {
            bestT = t; bestX = cx + seatR; bestY = y;
        }
    }

    // 左侧直边：x = cx - seatR
    if (sinθ < -0.0001) {
        const t = -seatR / sinθ;
        const y = cy - t * cosθ;
        if (Math.abs(y - cy) <= seatHalfH + 1 && t < bestT) {
            bestT = t; bestX = cx - seatR; bestY = y;
        }
    }

    // 顶部半圆：圆心 (cx, cy - seatHalfH)，半径 seatR
    // 方程：t² - 2*seatHalfH*cosθ*t + (seatHalfH² - seatR²) = 0
    {
        const A = 1;
        const B = -2 * seatHalfH * cosθ;
        const C = seatHalfH * seatHalfH - seatR * seatR;
        const disc = B * B - 4 * A * C;
        if (disc >= 0) {
            const sqrtD = Math.sqrt(disc);
            for (const t of [(-B + sqrtD) / (2 * A), (-B - sqrtD) / (2 * A)]) {
                if (t > 0.001 && t < bestT) {
                    const y = cy - t * cosθ;
                    if (y <= cy - seatHalfH + 1) {
                        bestT = t;
                        bestX = cx + t * sinθ;
                        bestY = y;
                    }
                }
            }
        }
    }

    // 底部半圆：圆心 (cx, cy + seatHalfH)，半径 seatR
    // 方程：t² + 2*seatHalfH*cosθ*t + (seatHalfH² - seatR²) = 0
    {
        const B = 2 * seatHalfH * cosθ;
        const C = seatHalfH * seatHalfH - seatR * seatR;
        const disc = B * B - 4 * C;
        if (disc >= 0) {
            const sqrtD = Math.sqrt(disc);
            for (const t of [(-B + sqrtD) / 2, (-B - sqrtD) / 2]) {
                if (t > 0.001 && t < bestT) {
                    const y = cy - t * cosθ;
                    if (y >= cy + seatHalfH - 1) {
                        bestT = t;
                        bestX = cx + t * sinθ;
                        bestY = y;
                    }
                }
            }
        }
    }

    // 兜底（极端情况）：用大椭圆
    if (bestT === Infinity) {
        const a = W * 0.55; const b = H * 0.55;
        return { x: cx + a * sinθ, y: cy - b * cosθ };
    }

    return { x: bestX, y: bestY };
}

// 找到离鼠标最近的槽位（用于拖拽调座，复用 pill 轮廓计算）
function findClosestSlot(clientX, clientY) {
    const tableEl = $('#round-table');
    const rect = tableEl.getBoundingClientRect();

    let bestSlot = 0;
    let bestDist = Infinity;

    for (let i = 0; i < SEAT_SLOTS; i++) {
        const pos = computeSeatPosition(SLOT_ANGLES[i]);
        const sx = rect.left + pos.x;
        const sy = rect.top + pos.y;
        const dist = Math.hypot(clientX - sx, clientY - sy);
        if (dist < bestDist) {
            bestDist = dist;
            bestSlot = i;
        }
    }

    return bestSlot;
}

// 获取槽位被哪个玩家占用（返回玩家对象或 null）
function getPlayerAtSlot(slotIndex) {
    const slotAngle = SLOT_ANGLES[slotIndex];
    return state.players.find(p => angleEquals(p.seat_angle, slotAngle)) || null;
}

// 获取玩家的槽位索引（-1 = 未就座）
function getPlayerSlot(player) {
    return angleToSlot(player.seat_angle);
}

// 渲染圆桌（主视图）
function renderRoundTable() {
    const container = $('#seats-container');
    const emptyHint = $('#table-empty-hint');
    const phaseDisplay = $('#table-phase-display');

    if (state.room) {
        phaseDisplay.textContent = state.room.phase;
    }

    if (state.players.length === 0) {
        container.innerHTML = '';
        emptyHint.style.display = 'block';
        renderPlayerList();
        return;
    }

    emptyHint.style.display = 'none';

    // 为新玩家分配空槽位
    const usedSlots = new Set(
        state.players
            .filter(p => p.seat_angle !== null && p.seat_angle !== undefined)
            .map(p => angleToSlot(p.seat_angle))
            .filter(idx => idx !== -1)
    );

    state.players.forEach(player => {
        // 无角度 或 角度不匹配任何槽位（浮点精度/数据异常），重新分配
        if (player.seat_angle === null || player.seat_angle === undefined
            || angleToSlot(player.seat_angle) === -1) {
            // 找到第一个未被占用的槽位
            for (let i = 0; i < SEAT_SLOTS; i++) {
                if (!usedSlots.has(i)) {
                    player.seat_angle = SLOT_ANGLES[i];
                    usedSlots.add(i);
                    break;
                }
            }
        }
    });

    // 渲染所有槽位标记 + 已就座玩家
    container.innerHTML = '';

    // 先渲染空槽位标记（灰色小圆点）
    for (let i = 0; i < SEAT_SLOTS; i++) {
        const angle = SLOT_ANGLES[i];
        const pos = computeSeatPosition(angle);
        const occupied = getPlayerAtSlot(i);

        if (occupied) {
            // 已占用槽位：渲染玩家座位
            const displayName = occupied.nickname || '未命名玩家';
            const selectedClass =
                state.selectedPlayer && state.selectedPlayer.id === occupied.id ? 'selected' : '';
            const newClass = state.newMsgPlayers.has(occupied.id) ? 'has-new' : '';
            const statusClass = 'status-' + (occupied.status || 'alive');
            const statusTitle = occupied.status === 'executed' ? '处决' :
                                occupied.status === 'killed_at_night' ? '夜死' : '存活';

            container.insertAdjacentHTML('beforeend',
                `<div class="player-seat ${selectedClass} ${newClass} ${statusClass}"
                     data-player-id="${occupied.id}"
                     data-slot="${i}"
                     style="left:${pos.x}px;top:${pos.y}px;">
                  <div class="seat-dot">
                    <span class="status-toggle" title="点击切换状态 · 当前：${statusTitle}"></span>
                  </div>
                  <div class="seat-label">${escapeHtml(displayName)}</div>
                  ${renderRoleBadgeHtml(occupied)}
                  <span class="kick-btn seat-kick-btn" data-player-id="${occupied.id}" title="踢出房间">⛔</span>
                </div>`);
        } else {
            // 空槽位：半透明标记点
            container.insertAdjacentHTML('beforeend',
                `<div class="player-seat seat-empty"
                     data-slot="${i}"
                     style="left:${pos.x}px;top:${pos.y}px;">
                  <div class="seat-dot"></div>
                </div>`);
        }
    }

    renderPlayerList();
}

// 渲染左侧玩家列表（含拖拽排序）
function renderPlayerList() {
    const list = $('#rt-player-list');
    if (state.players.length === 0) {
        list.innerHTML = '<li class="player-empty">暂无玩家</li>';
    } else {
        list.innerHTML = state.players.map((p, index) => {
            const activeClass =
                state.selectedPlayer && state.selectedPlayer.id === p.id ? 'active' : '';
            const newClass = state.newMsgPlayers.has(p.id) ? 'has-new' : '';
            const displayName = p.nickname || '未命名玩家';
            const statusBadge = (p.status && p.status !== 'alive')
                ? `<span class="status-badge status-badge-${p.status}" title="${p.status === 'executed' ? '处决' : '夜死'}"></span>`
                : '';
            // 角色名显示
            const roleObj = getPlayerRoleObj(p);
            const roleNameHtml = roleObj
                ? `<span class="player-role-name player-role-${roleObj.category}">${roleObj.name}</span>`
                : '';
            return `<li class="player-item ${activeClass} ${newClass}"
                        data-player-id="${p.id}"
                        data-index="${index}"
                        draggable="true">
                      <span class="drag-handle">⠿</span>
                      <span class="player-name">${escapeHtml(displayName)}</span>${roleNameHtml}
                      ${statusBadge}
                      <span class="new-msg-dot"></span>
                      <span class="kick-btn" data-player-id="${p.id}" title="踢出房间">⛔</span>
                    </li>`;
        }).join('');
    }
    $('#rt-player-count').textContent = state.players.length;
}

// ============================================================
// 左侧玩家列表拖拽排序
// ============================================================
function setupRtDragAndDrop() {
    const list = $('#rt-player-list');

    list.addEventListener('dragstart', (e) => {
        const item = e.target.closest('.player-item');
        if (!item) return;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.index);
    });

    list.addEventListener('dragend', () => {
        list.querySelectorAll('.player-item').forEach(el => {
            el.classList.remove('dragging', 'drag-over');
        });
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const item = e.target.closest('.player-item');
        if (!item) return;
        list.querySelectorAll('.player-item').forEach(el => {
            if (el !== item) el.classList.remove('drag-over');
        });
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

    // 点击左侧列表选中玩家（排除拖拽操作和踢出按钮）
    list.addEventListener('click', (e) => {
        // 踢出按钮单独处理
        const kickBtn = e.target.closest('.kick-btn');
        if (kickBtn) {
            e.stopPropagation();
            kickPlayer(kickBtn.dataset.playerId);
            return;
        }

        const item = e.target.closest('.player-item');
        if (!item) return;
        const playerId = item.dataset.playerId;
        if (playerId) selectPlayer(playerId);
    });
}

// 圆桌座位点击事件（排除拖拽操作和踢出按钮）
function setupSeatClickHandler() {
    const container = $('#seats-container');
    // 鼠标按下 → 上抬期间不移动 → 视为点击
    container.addEventListener('click', (e) => {
        // 踢出按钮单独处理
        const kickBtn = e.target.closest('.kick-btn');
        if (kickBtn) {
            e.stopPropagation();
            kickPlayer(kickBtn.dataset.playerId);
            return;
        }
    });
}

// ============================================================
// 座位交换拖拽（固定槽位，拖到其他槽位时交换）
// ============================================================
function setupSeatSwap() {
    let draggedSeat = null;
    let startSlot = -1;
    let startPlayerId = null;
    let hasDragged = false;
    let startX = 0, startY = 0;
    let lastMouseX = 0, lastMouseY = 0;  // 记录最后鼠标位置，mouseup 时直接用

    document.addEventListener('mousedown', (e) => {
        // 生死状态切换图标：点击切换状态，不触发选人/拖拽
        if (e.target.closest('.status-toggle')) {
            const seat = e.target.closest('.player-seat:not(.seat-empty)');
            if (seat && seat.dataset.playerId) {
                e.preventDefault();
                e.stopPropagation();
                togglePlayerStatus(seat.dataset.playerId);
            }
            return;
        }

        // 只处理已占用的玩家座位
        const seat = e.target.closest('.player-seat:not(.seat-empty)');
        if (!seat) return;

        isDragging = true;
        draggedSeat = seat;
        startSlot = parseInt(seat.dataset.slot);
        startPlayerId = seat.dataset.playerId;
        hasDragged = false;
        startX = e.clientX;
        startY = e.clientY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        // 始终更新最后鼠标位置
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        if (!draggedSeat) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        // 移动超过 10px 才算拖拽（区分点击和拖拽）
        if (!hasDragged && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

        if (!hasDragged) {
            hasDragged = true;
            // 拖拽开始：提升 z-index
            draggedSeat.style.zIndex = '10';
            draggedSeat.style.opacity = '0.85';
            draggedSeat.style.transition = 'none';
        }

        // 视觉跟随鼠标（相对 table 定位）
        const tableEl = $('#round-table');
        const rect = tableEl.getBoundingClientRect();
        draggedSeat.style.left = (e.clientX - rect.left) + 'px';
        draggedSeat.style.top = (e.clientY - rect.top) + 'px';
    });

    document.addEventListener('mouseup', async () => {
        if (!draggedSeat) return;
        await finishDrag();
    });

    // ----- 触摸事件（iPad / 移动端支持）-----

    document.addEventListener('touchstart', (e) => {
        // 踢出按钮：不拦截，让原生 click 事件处理
        if (e.target.closest('.kick-btn')) return;

        // 生死状态切换图标：点击切换状态，不触发选人/拖拽
        if (e.target.closest('.status-toggle')) {
            const seat = e.target.closest('.player-seat:not(.seat-empty)');
            if (seat && seat.dataset.playerId) {
                e.preventDefault();
                e.stopPropagation();
                togglePlayerStatus(seat.dataset.playerId);
            }
            return;
        }

        const seat = e.target.closest('.player-seat:not(.seat-empty)');
        if (!seat) return;

        isDragging = true;
        draggedSeat = seat;
        startSlot = parseInt(seat.dataset.slot);
        startPlayerId = seat.dataset.playerId;
        hasDragged = false;

        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        lastMouseX = touch.clientX;
        lastMouseY = touch.clientY;
        e.preventDefault(); // 阻止滚动
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!draggedSeat) return;

        const touch = e.touches[0];
        lastMouseX = touch.clientX;
        lastMouseY = touch.clientY;

        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;

        if (!hasDragged && Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

        if (!hasDragged) {
            hasDragged = true;
            draggedSeat.style.zIndex = '10';
            draggedSeat.style.opacity = '0.85';
            draggedSeat.style.transition = 'none';
        }

        const tableEl = $('#round-table');
        const rect = tableEl.getBoundingClientRect();
        draggedSeat.style.left = (touch.clientX - rect.left) + 'px';
        draggedSeat.style.top = (touch.clientY - rect.top) + 'px';
    }, { passive: false });

    document.addEventListener('touchend', async (e) => {
        if (!draggedSeat) return;
        // 没有移动时，用 changedTouches 记录最后坐标
        if (!hasDragged && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            lastMouseX = touch.clientX;
            lastMouseY = touch.clientY;
        }
        await finishDrag();
    });

    document.addEventListener('touchcancel', async () => {
        if (!draggedSeat) return;
        await finishDrag();
    });

    // 拖拽结束的公共逻辑
    async function finishDrag() {
        if (!draggedSeat) return;

        if (hasDragged) {
            draggedSeat.style.zIndex = '';
            draggedSeat.style.opacity = '';
            draggedSeat.style.transition = '';

            const closestSlot = findClosestSlot(lastMouseX, lastMouseY);

            if (closestSlot !== startSlot) {
                try {
                    await swapSeats(startSlot, closestSlot);
                } catch (err) {
                    console.error('座位交换失败:', err);
                }
            }
            renderRoundTable();
        } else {
            if (startPlayerId) selectPlayer(startPlayerId);
        }

        isDragging = false;
        draggedSeat = null;
        startSlot = -1;
        startPlayerId = null;
        hasDragged = false;
    }
}

// 交换两个槽位上的玩家座位（仅更新数据，不渲染 DOM）
async function swapSeats(slotA, slotB) {
    if (slotA === slotB) return;

    const playerA = getPlayerAtSlot(slotA);
    const playerB = getPlayerAtSlot(slotB);

    const angleA = SLOT_ANGLES[slotA];
    const angleB = SLOT_ANGLES[slotB];

    // 更新本地状态
    if (playerA) playerA.seat_angle = angleB;
    if (playerB) playerB.seat_angle = angleA;

    // 保存到数据库（并行更新）
    const updates = [];
    if (playerA) {
        updates.push(
            state.supabase
                .from('players')
                .update({ seat_angle: angleB })
                .eq('id', playerA.id)
        );
    }
    if (playerB) {
        updates.push(
            state.supabase
                .from('players')
                .update({ seat_angle: angleA })
                .eq('id', playerB.id)
        );
    }
    await Promise.all(updates);
}
