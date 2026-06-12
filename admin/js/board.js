/* ============================================================
   西游纪 Blood-West · 版型配置面板模块
   版型推荐/增减/复原、角色交换、外来者修正警告
   依赖：state.js, data/roles.js, data/boards.js
   ============================================================ */

// 弹窗内当前调节的人数
var boardPlayerCount = 12;

// 弹窗内正在编辑的版型状态（与 renderBoardPanel 解耦，支持手动编辑后保留）
var boardPanelState = { playerCount: 0, roles: [] };

function openBoardPanel() {
    if (!state.room) return;

    // 默认人数 = 当前房间已加入玩家数（最少5）
    boardPlayerCount = Math.max(5, state.players.length);

    if (state.activeBoard && state.activeBoard.playerCount === boardPlayerCount) {
        // 有激活版型且人数匹配 → 复用（保留之前确认的编辑结果）
        boardPlayerCount = state.activeBoard.playerCount;
        boardPanelState = {
            playerCount: state.activeBoard.playerCount,
            roles: state.activeBoard.roles.slice()
        };
    } else if (state.activeBoard) {
        // 有激活版型但人数不匹配 → 用激活版型的人数重新生成
        boardPlayerCount = state.activeBoard.playerCount;
        var fresh = recommendBoard(boardPlayerCount);
        boardPanelState = {
            playerCount: fresh.playerCount,
            roles: fresh.roles.slice(),
            _balanceWarnings: fresh._balanceWarnings || null
        };
    } else {
        // 无激活版型 → 全新随机生成
        var fresh = recommendBoard(boardPlayerCount);
        boardPanelState = {
            playerCount: fresh.playerCount,
            roles: fresh.roles.slice(),
            _balanceWarnings: fresh._balanceWarnings || null
        };
    }

    renderBoardPanel();
    $('#board-modal').style.display = 'flex';
}

function closeBoardPanel() {
    $('#board-modal').style.display = 'none';
}

function adjustBoardCount(delta) {
    var newCount = boardPlayerCount + delta;
    if (newCount < 5) newCount = 5;
    if (newCount > 19) newCount = 19;
    if (newCount === boardPlayerCount) return;
    boardPlayerCount = newCount;
    // 人数改变 → 完全重新随机生成
    var fresh = recommendBoard(boardPlayerCount);
    boardPanelState = {
        playerCount: fresh.playerCount,
        roles: fresh.roles.slice(),
        _balanceWarnings: fresh._balanceWarnings || null
    };
    renderBoardPanel();
}

function renderBoardPanel() {
    // 动态更新玩家数为当前角色总数
    $('#board-player-count').textContent = boardPanelState.roles.length;

    // 当前已加入人数提示
    var joinedHint = $('#board-joined-hint');
    if (state.players.length > 0) {
        joinedHint.textContent = '（当前房间已加入 ' + state.players.length + ' 人）';
    } else {
        joinedHint.textContent = '';
    }

    // 从 boardPanelState 计算各分类数量
    var dist = {};
    CATEGORY_CONFIG.forEach(function(cat) { dist[cat.key] = 0; });
    boardPanelState.roles.forEach(function(r) {
        if (dist[r.category] !== undefined) dist[r.category]++;
    });

    // 分类概览
    var summaryHtml = CATEGORY_CONFIG.map(function(cat) {
        var count = dist[cat.key] || 0;
        if (count === 0) return '';
        return '<span class="board-dist-item">' + cat.emoji + ' ' + cat.label + ' ×' + count + '</span>';
    }).filter(Boolean).join(' ');

    // 计算外来者修正值并追加徽章
    var modTotal = sumOutsiderModifier(boardPanelState.roles);
    if (modTotal !== 0) {
        var modSign = modTotal > 0 ? '+' : '';
        var modClass = modTotal > 0 ? 'board-mod-badge--plus' : 'board-mod-badge--minus';
        summaryHtml += ' <span class="board-mod-badge ' + modClass + '">📊 ' + modSign + modTotal + '外来者</span>';
    }

    $('#board-dist-summary').innerHTML = summaryHtml;

    // 检查外来者修正是否异常，显示警告
    var warning = getOutsiderWarning();
    $('#board-outsider-warning').innerHTML = warning || '';

    // 显示平衡校验状态
    renderBalanceStatus();

    // 按类别分组渲染角色列表（标签可点击交换）
    var listHtml = '';
    CATEGORY_CONFIG.forEach(function(cat) {
        var catRoles = boardPanelState.roles.filter(function(r) { return r.category === cat.key; });
        if (catRoles.length === 0) return;
        listHtml += '<div class="board-cat-group">';
        listHtml += '<div class="board-cat-header" onclick="toggleBoardCat(this)">';
        listHtml += '<span class="board-cat-title">' + cat.emoji + ' ' + cat.label +
                    '<span class="board-cat-count">（' + catRoles.length + '）</span></span>';
        listHtml += '<span class="board-cat-toggle">▼</span>';
        listHtml += '</div>';
        listHtml += '<div class="board-cat-body">';
        catRoles.forEach(function(r) {
            // 找到在 boardPanelState.roles 中的全局索引
            var globalIdx = boardPanelState.roles.indexOf(r);
            listHtml += '<span class="board-role-tag board-role-tag--clickable" ' +
                        'data-role-index="' + globalIdx + '" ' +
                        'data-role-category="' + r.category + '" ' +
                        'data-role-id="' + r.id + '" ' +
                        'onclick="startRoleSwap(event, this)">' +
                        r.name +
                        ' <span class="board-role-swap-icon">⇄</span>' +
                        ' <span class="board-role-remove-btn" data-role-index="' + globalIdx + '" ' +
                        'onclick="removeRoleFromBoard(event, this)" title="移除此角色">×</span>' +
                        '</span>';
        });

        // 添加"+"按钮（检查是否还有该类别未使用的角色）
        var usedIdsForCat = [];
        boardPanelState.roles.forEach(function(rr) { usedIdsForCat.push(rr.id); });
        var hasAvailable = ROLES.some(function(rr) {
            return rr.category === cat.key && usedIdsForCat.indexOf(rr.id) === -1;
        });
        if (hasAvailable) {
            listHtml += '<span class="board-cat-add-btn" data-category="' + cat.key + '" ' +
                        'onclick="addRoleToBoard(event, this)" title="添加' + cat.label + '">+</span>';
        } else {
            listHtml += '<span class="board-cat-add-btn board-cat-add-btn--none" ' +
                        'title="没有更多可用' + cat.label + '">+</span>';
        }

        listHtml += '</div></div>';
    });
    $('#board-role-list').innerHTML = listHtml;

    // 更新复原按钮状态
    var restoreBtn = $('#btn-board-restore');
    if (restoreBtn) {
        restoreBtn.disabled = !state.activeBoard;
    }
}

// 折叠/展开版型分类
function toggleBoardCat(header) {
    var body = header.nextElementSibling;
    var toggle = header.querySelector('.board-cat-toggle');
    if (body.style.display === 'none') {
        body.style.display = '';
        toggle.textContent = '▼';
    } else {
        body.style.display = 'none';
        toggle.textContent = '▶';
    }
}

// 点击角色标签 → 原地替换为同类别下拉选择器
function startRoleSwap(event, tagEl) {
    event.stopPropagation();

    var roleIndex = parseInt(tagEl.getAttribute('data-role-index'));
    var category = tagEl.getAttribute('data-role-category');
    var currentRoleId = tagEl.getAttribute('data-role-id');

    if (isNaN(roleIndex)) return;

    // 收集当前版型中已使用的角色 ID（排除自己）
    var usedIds = [];
    boardPanelState.roles.forEach(function(r, i) {
        if (i !== roleIndex) usedIds.push(r.id);
    });

    // 获取同类别未使用的角色
    var availableRoles = getAvailableRolesForCategory(category, usedIds);

    // 构建下拉框
    var selectHtml = '<select class="board-role-swap-select" ' +
                     'data-role-index="' + roleIndex + '" ' +
                     'onchange="commitRoleSwap(this)" ' +
                     'onblur="cancelRoleSwap(this)">';
    selectHtml += '<option value="">-- 选择角色 --</option>';
    availableRoles.forEach(function(r) {
        var selected = (r.id === currentRoleId) ? ' selected' : '';
        selectHtml += '<option value="' + r.id + '"' + selected + '>' + r.name + '</option>';
    });
    selectHtml += '</select>';

    // 替换 DOM
    tagEl.outerHTML = selectHtml;

    // 自动聚焦下拉框
    var selectEl = document.querySelector('.board-role-swap-select[data-role-index="' + roleIndex + '"]');
    if (selectEl) {
        selectEl.focus();
    }
}

// 确认交换：更新 boardPanelState 并重新渲染
function commitRoleSwap(selectEl) {
    var roleIndex = parseInt(selectEl.getAttribute('data-role-index'));
    var newRoleId = selectEl.value;

    if (isNaN(roleIndex) || !newRoleId) return;

    var newRole = ROLES_BY_ID[newRoleId];
    if (!newRole) return;

    // 防重复检查
    var duplicate = false;
    boardPanelState.roles.forEach(function(r, i) {
        if (i !== roleIndex && r.id === newRoleId) duplicate = true;
    });
    if (duplicate) return;

    // 更新版型状态
    boardPanelState.roles[roleIndex] = newRole;

    // 重新渲染面板
    renderBoardPanel();
}

// 取消交换：下拉框失焦未选择时恢复为标签
function cancelRoleSwap(selectEl) {
    // setTimeout 给 onchange 时间触发，避免竞态
    setTimeout(function() {
        if (selectEl && selectEl.parentNode) {
            // select 还在 DOM 中 → 没有 commit，恢复标签
            var roleIndex = parseInt(selectEl.getAttribute('data-role-index'));
            var role = boardPanelState.roles[roleIndex];
            if (role) {
                selectEl.outerHTML = '<span class="board-role-tag board-role-tag--clickable" ' +
                                     'data-role-index="' + roleIndex + '" ' +
                                     'data-role-category="' + role.category + '" ' +
                                     'data-role-id="' + role.id + '" ' +
                                     'onclick="startRoleSwap(event, this)">' +
                                     role.name +
                                     ' <span class="board-role-swap-icon">⇄</span>' +
                                     ' <span class="board-role-remove-btn" data-role-index="' + roleIndex + '" ' +
                                     'onclick="removeRoleFromBoard(event, this)" title="移除此角色">×</span>' +
                                     '</span>';
            }
        }
    }, 150);
}

// 从版型中移除指定索引的角色
function removeRoleFromBoard(event, removeBtn) {
    event.stopPropagation();

    var idx = parseInt(removeBtn.getAttribute('data-role-index'));
    if (isNaN(idx)) return;
    if (boardPanelState.roles.length <= 5) return; // 最少保留5个角色

    boardPanelState.roles.splice(idx, 1);
    boardPanelState.playerCount = boardPanelState.roles.length;
    boardPlayerCount = boardPanelState.playerCount;

    renderBoardPanel();
}

// 点击分类"+"按钮 → 替换为同类别角色选择下拉框
function addRoleToBoard(event, btnEl) {
    event.stopPropagation();

    var category = btnEl.getAttribute('data-category');

    // 收集已使用的角色 ID
    var usedIds = [];
    boardPanelState.roles.forEach(function(r) { usedIds.push(r.id); });

    var available = getAvailableRolesForCategory(category, usedIds);
    if (available.length === 0) return;

    // 替换为内联下拉框
    var selectHtml = '<select class="board-cat-add-select" ' +
        'data-category="' + category + '" ' +
        'onchange="commitAddRole(this)" ' +
        'onblur="cancelAddRole(this, \'' + category + '\')">';
    selectHtml += '<option value="">-- 添加角色 --</option>';
    available.forEach(function(r) {
        selectHtml += '<option value="' + r.id + '">' + r.name + '</option>';
    });
    selectHtml += '</select>';

    btnEl.outerHTML = selectHtml;

    // 自动聚焦
    var sel = document.querySelector('.board-cat-add-select[data-category="' + category + '"]');
    if (sel) sel.focus();
}

// 确认添加角色
function commitAddRole(selectEl) {
    var newRoleId = selectEl.value;
    if (!newRoleId) return;

    var newRole = ROLES_BY_ID[newRoleId];
    if (!newRole) return;

    // 防重复检查
    var dup = false;
    boardPanelState.roles.forEach(function(r) {
        if (r.id === newRoleId) dup = true;
    });
    if (dup) return;

    // 上限检查（最多19人）
    if (boardPanelState.roles.length >= 19) return;

    // 添加角色
    boardPanelState.roles.push(newRole);
    boardPanelState.playerCount = boardPanelState.roles.length;
    boardPlayerCount = boardPanelState.playerCount;

    renderBoardPanel();
}

// 取消添加：下拉框失焦未选择时恢复"+"按钮
function cancelAddRole(selectEl, category) {
    setTimeout(function() {
        if (selectEl && selectEl.parentNode) {
            selectEl.outerHTML = '<span class="board-cat-add-btn" ' +
                'data-category="' + category + '" ' +
                'onclick="addRoleToBoard(event, this)" title="添加角色">+</span>';
        }
    }, 150);
}

// 检查外来者修正是否异常，返回警告文本或 null
function getOutsiderWarning() {
    var roles = boardPanelState.roles;
    var playerCount = boardPanelState.playerCount;

    // 查表获取基础外来者数量（兜底12人）
    var baseDist = DISTRIBUTION_TABLE[playerCount] || DISTRIBUTION_TABLE[12];
    var baseOutsider = baseDist.outsider;

    var mod = sumOutsiderModifier(roles);
    var expected = baseOutsider + mod;

    var actual = 0;
    for (var i = 0; i < roles.length; i++) {
        if (roles[i].category === 'outsider') actual++;
    }

    if (actual === expected) return null;

    if (actual < expected) {
        if (mod !== 0) {
            return '⚠️ 外来者修正异常：当前有 ' + (mod > 0 ? '+' + mod : mod) + ' 修正但外来者不足（当前' + actual + '个 / 建议' + expected + '个），请增加外来者';
        }
        return '⚠️ 外来者数量异常：外来者不足（当前' + actual + '个 / 建议' + expected + '个），请增加外来者';
    }
    // actual > expected
    if (mod !== 0) {
        return '⚠️ 外来者修正异常：当前有 ' + (mod > 0 ? '+' + mod : mod) + ' 修正但外来者过多（当前' + actual + '个 / 建议' + expected + '个），请减少外来者';
    }
    return '⚠️ 外来者数量异常：外来者过多（当前' + actual + '个 / 建议' + expected + '个），请减少外来者';
}

// 渲染平衡校验状态（利用 boardPanelState._balanceWarnings 或实时校验）
function renderBalanceStatus() {
    var el = $('#board-balance-status');
    if (!el) return;

    // 检查是否有兜底警告
    var warnings = boardPanelState._balanceWarnings || [];

    // 如果没有预存警告，实时校验
    if (warnings.length === 0 && typeof validateBoard === 'function') {
        var validation = validateBoard(boardPanelState.roles, boardPanelState.playerCount);
        if (!validation.valid) {
            warnings = validation.errors;
        }
    }

    if (warnings.length === 0) {
        el.className = 'board-balance-status board-balance-status--pass';
        el.innerHTML = '✅ 版型平衡';
    } else {
        el.className = 'board-balance-status board-balance-status--warn';
        el.innerHTML = '⚠️ 平衡警告：' + warnings.map(function(w) { return escapeHtml(w); }).join('；');
    }
}

// 复原到上次确认的版型
function restoreBoardPanel() {
    if (!state.activeBoard) return;

    boardPanelState = {
        playerCount: state.activeBoard.playerCount,
        roles: state.activeBoard.roles.slice()
    };
    boardPlayerCount = state.activeBoard.playerCount;

    renderBoardPanel();
}

// 重新推荐版型（完全随机重抽，丢弃手动编辑）
function refreshBoard() {
    var fresh = recommendBoard(boardPlayerCount);
    boardPanelState = {
        playerCount: fresh.playerCount,
        roles: fresh.roles.slice(),
        _balanceWarnings: fresh._balanceWarnings || null
    };
    renderBoardPanel();
}

// 确认使用此版型（保存当前编辑中的版型，而非重新随机）
function confirmBoard() {
    // 从 boardPanelState 计算分布
    var dist = {};
    CATEGORY_CONFIG.forEach(function(cat) { dist[cat.key] = 0; });
    boardPanelState.roles.forEach(function(r) {
        if (dist[r.category] !== undefined) dist[r.category]++;
    });

    var board = {
        playerCount: boardPanelState.playerCount,
        distribution: dist,
        roles: boardPanelState.roles.slice()
    };

    state.activeBoard = board;

    // 持久化到 localStorage
    localStorage.setItem('botc_active_board', JSON.stringify(board));

    closeBoardPanel();

    // 如果当前有选中的玩家，刷新角色选择器
    if (state.selectedPlayer) {
        renderRoleSelector(state.selectedPlayer);
    }

    // 刷新圆桌显示（可能已有 role 的玩家）
    renderRoundTable();
}

// 恢复版型（页面刷新后）
function restoreBoard() {
    var saved = localStorage.getItem('botc_active_board');
    if (!saved) return;
    try {
        var board = JSON.parse(saved);
        state.activeBoard = board;
    } catch (e) {
        localStorage.removeItem('botc_active_board');
    }
}
