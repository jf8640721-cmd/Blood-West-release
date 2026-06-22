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
    removeSwapOutsideListener();  // v3.0.51: 清理交换监听器
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

    // v3.0.51: 清除搜索提示
    var existingHint = document.getElementById('board-search-hint');
    if (existingHint) existingHint.remove();

    // 重新应用搜索过滤
    var searchInput = $('#board-search-input');
    if (searchInput && searchInput.value.trim()) {
        filterBoardRoles(searchInput.value.trim().toLowerCase());
    }

    // 更新复原按钮状态
    var restoreBtn = $('#btn-board-restore');
    if (restoreBtn) {
        restoreBtn.disabled = !state.activeBoard;
    }

    // 渲染衣服推荐
    renderClothesSection();

    // v3.0.51: 绑定搜索事件
    bindBoardSearch();
}

// v3.0.51: 版型角色搜索
function bindBoardSearch() {
    var searchInput = $('#board-search-input');
    var clearBtn = $('#btn-board-search-clear');
    if (!searchInput || !clearBtn) return;

    // 移除旧事件（避免重复绑定）
    var newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    searchInput = newInput;

    searchInput.addEventListener('input', function () {
        var keyword = this.value.trim().toLowerCase();
        clearBtn.style.display = keyword ? '' : 'none';
        filterBoardRoles(keyword);
    });

    clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        this.style.display = 'none';
        filterBoardRoles('');
        searchInput.focus();
    });
}

function filterBoardRoles(keyword) {
    var catGroups = document.querySelectorAll('.board-cat-group');
    catGroups.forEach(function (group) {
        if (!keyword) {
            // 无搜索词：全部显示
            group.style.display = '';
            var tags = group.querySelectorAll('.board-role-tag, .board-role-tag--clickable');
            tags.forEach(function (t) { t.style.display = ''; });
            var addBtns = group.querySelectorAll('.board-cat-add-btn');
            addBtns.forEach(function (b) { b.style.display = ''; });
            return;
        }

        // 过滤角色标签
        var hasVisible = false;
        var tags = group.querySelectorAll('.board-role-tag, .board-role-tag--clickable');
        tags.forEach(function (t) {
            var name = (t.textContent || '').replace(/[⇄×]/g, '').trim().toLowerCase();
            if (name.indexOf(keyword) !== -1) {
                t.style.display = '';
                hasVisible = true;
            } else {
                t.style.display = 'none';
            }
        });

        // 搜索时隐藏 "+" 按钮
        var addBtns = group.querySelectorAll('.board-cat-add-btn');
        addBtns.forEach(function (b) { b.style.display = 'none'; });

        // 如果该分类没有可见角色，隐藏整个分组
        group.style.display = hasVisible ? '' : 'none';
    });

    // 更新搜索结果提示
    updateBoardSearchHint(keyword);
}

function updateBoardSearchHint(keyword) {
    var existingHint = document.getElementById('board-search-hint');
    if (existingHint) existingHint.remove();

    if (!keyword) return;

    // 查找可添加的匹配角色
    var usedIds = boardPanelState.roles.map(function (r) { return r.id; });
    var available = ROLES.filter(function (r) {
        return usedIds.indexOf(r.id) === -1 &&
               r.name.toLowerCase().indexOf(keyword) !== -1;
    });

    if (available.length === 0) return;

    var hintHtml = '<div id="board-search-hint" class="board-search-hint">';
    hintHtml += '<span class="board-search-hint-label">可添加角色：</span>';
    available.forEach(function (r) {
        hintHtml += '<span class="board-role-tag board-role-tag--addable" ' +
                    'data-role-id="' + r.id + '" ' +
                    'onclick="quickAddRoleFromSearch(event, this)" ' +
                    'title="点击添加 ' + r.name + '">' +
                    r.name + ' <span class="board-role-add-icon">+</span></span>';
    });
    hintHtml += '</div>';

    var roleList = $('#board-role-list');
    if (roleList) {
        roleList.insertAdjacentHTML('beforebegin', hintHtml);
    }
}

// v3.0.51: 搜索后快速添加角色
function quickAddRoleFromSearch(event, el) {
    event.stopPropagation();
    var roleId = el.getAttribute('data-role-id');
    var role = ROLES_BY_ID[roleId];
    if (!role) return;

    // 检查是否重复
    var exists = boardPanelState.roles.some(function (r) { return r.id === roleId; });
    if (exists) return;

    // 添加到版型并重新渲染
    boardPanelState.roles.push(role);

    // 清除搜索并重新渲染
    var searchInput = $('#board-search-input');
    if (searchInput) searchInput.value = '';
    var clearBtn = $('#btn-board-search-clear');
    if (clearBtn) clearBtn.style.display = 'none';

    renderBoardPanel();
    flashBoardRoleTag(roleId);
}

// 高亮新增的角色标签
function flashBoardRoleTag(roleId) {
    setTimeout(function () {
        var tags = document.querySelectorAll('.board-role-tag--clickable[data-role-id="' + roleId + '"]');
        tags.forEach(function (t) {
            t.classList.add('board-role-tag--flash');
            setTimeout(function () { t.classList.remove('board-role-tag--flash'); }, 1500);
        });
    }, 100);
}
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

// 点击角色标签 → 原地替换为搜索输入框 + 可点击下拉列表
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

    // 获取同类别所有可用角色
    var availableRoles = getAvailableRolesForCategory(category, usedIds);
    // 把当前角色也加入列表（避免找不到）
    var currentRole = ROLES_BY_ID[currentRoleId];
    var allCategoryRoles = getAvailableRolesForCategory(category, []);

    // 构建搜索输入 + 下拉列表
    var html = '<span class="board-role-swap-wrap" data-role-index="' + roleIndex + '">' +
               '<input class="board-role-swap-input" ' +
               'placeholder="输入搜索…" ' +
               'oninput="filterSwapDropdown(this)" ' +
               'onkeydown="onSwapKeydown(event, this)" />' +
               '<button class="board-role-swap-cancel" onclick="cancelSwapExplicit(this)" title="取消">✕</button>' +
               '<div class="board-role-swap-dropdown">';
    allCategoryRoles.forEach(function(r) {
        html += '<div class="board-role-swap-option' + (r.id === currentRoleId ? ' current' : '') + '" ' +
                'data-role-id="' + r.id + '" ' +
                'onmousedown="commitSwapByClick(event, this)" ' +
                'ontouchstart="commitSwapByClick(event, this)">' +
                r.name + '</div>';
    });
    html += '</div></span>';

    // 替换 DOM
    tagEl.outerHTML = html;

    // 注册点击外部关闭
    ensureSwapOutsideListener();

    // 聚焦输入框，预填当前角色名
    var wrap = document.querySelector('.board-role-swap-wrap[data-role-index="' + roleIndex + '"]');
    if (wrap) {
        var inputEl = wrap.querySelector('.board-role-swap-input');
        if (inputEl) {
            if (currentRole) {
                inputEl.value = currentRole.name;
            }
            inputEl.focus();
            inputEl.select();
        }
    }
}

// 搜索过滤下拉选项
function filterSwapDropdown(inputEl) {
    var keyword = (inputEl.value || '').trim().toLowerCase();
    var wrap = inputEl.closest('.board-role-swap-wrap');
    if (!wrap) return;
    var options = wrap.querySelectorAll('.board-role-swap-option');
    options.forEach(function(opt) {
        var name = (opt.textContent || '').toLowerCase();
        opt.style.display = (!keyword || name.indexOf(keyword) !== -1) ? '' : 'none';
    });
}

// 键盘操作：Enter 确认，Escape 取消
function onSwapKeydown(event, inputEl) {
    if (event.key === 'Enter') {
        event.preventDefault();
        commitSwapFromInput(inputEl);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        cancelSwapExplicit(inputEl);
    }
}

// 点击下拉选项（mousedown 防止 blur 竞态）
function commitSwapByClick(event, optionEl) {
    event.preventDefault();
    event.stopPropagation();
    var roleId = optionEl.getAttribute('data-role-id');
    var wrap = optionEl.closest('.board-role-swap-wrap');
    if (!wrap || !roleId) return;
    var roleIndex = parseInt(wrap.getAttribute('data-role-index'));
    if (isNaN(roleIndex)) return;

    var newRole = ROLES_BY_ID[roleId];
    if (!newRole) return;

    // 防重复
    var dup = false;
    boardPanelState.roles.forEach(function(r, i) {
        if (i !== roleIndex && r.id === roleId) dup = true;
    });
    if (dup) return;

    boardPanelState.roles[roleIndex] = newRole;
    renderBoardPanel();
    removeSwapOutsideListener();
}

// 从输入框确认（Enter 键触发）
function commitSwapFromInput(inputEl) {
    var wrap = inputEl.closest('.board-role-swap-wrap');
    if (!wrap) return;
    var roleIndex = parseInt(wrap.getAttribute('data-role-index'));
    if (isNaN(roleIndex)) return;

    var typed = (inputEl.value || '').trim();
    if (!typed) return;

    // 先找可见选项中的第一个匹配
    var visibleOptions = wrap.querySelectorAll('.board-role-swap-option:not([style*="display: none"])');
    if (visibleOptions.length === 1) {
        var onlyId = visibleOptions[0].getAttribute('data-role-id');
        var onlyRole = ROLES_BY_ID[onlyId];
        if (onlyRole) {
            boardPanelState.roles[roleIndex] = onlyRole;
            renderBoardPanel();
            removeSwapOutsideListener();
            return;
        }
    }

    // 模糊匹配
    var newRole = findRoleByName(typed);
    if (!newRole) return;

    var dup = false;
    boardPanelState.roles.forEach(function(r, i) {
        if (i !== roleIndex && r.id === newRole.id) dup = true;
    });
    if (dup) return;

    boardPanelState.roles[roleIndex] = newRole;
    renderBoardPanel();
    removeSwapOutsideListener();
}

// 显式取消
function cancelSwapExplicit(el) {
    var wrap = (el.classList && el.classList.contains('board-role-swap-wrap'))
        ? el : el.closest('.board-role-swap-wrap');
    if (!wrap) return;
    var roleIndex = parseInt(wrap.getAttribute('data-role-index'));
    if (isNaN(roleIndex)) { wrap.remove(); return; }

    var role = boardPanelState.roles[roleIndex];
    if (!role) { wrap.remove(); return; }

    wrap.outerHTML = buildRoleTagHtml(roleIndex, role);
    removeSwapOutsideListener();
}

// 构建角色标签 HTML
function buildRoleTagHtml(roleIndex, role) {
    return '<span class="board-role-tag board-role-tag--clickable" ' +
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

// 按名称查找角色
function findRoleByName(name) {
    var lower = name.toLowerCase();
    for (var i = 0; i < ROLES.length; i++) {
        if (ROLES[i].name.toLowerCase() === lower) return ROLES[i];
    }
    for (var i = 0; i < ROLES.length; i++) {
        if (ROLES[i].name.toLowerCase().indexOf(lower) !== -1) return ROLES[i];
    }
    return null;
}

// 点击版型面板外部关闭交换
var _swapOutsideHandler = null;
function ensureSwapOutsideListener() {
    if (_swapOutsideHandler) return;
    _swapOutsideHandler = function(e) {
        var wraps = document.querySelectorAll('.board-role-swap-wrap');
        var clickedInside = false;
        wraps.forEach(function(w) {
            if (w.contains(e.target)) clickedInside = true;
        });
        if (clickedInside) return;
        // 点击外部 → 全部取消
        wraps.forEach(function(w) { cancelSwapExplicit(w); });
    };
    document.addEventListener('mousedown', _swapOutsideHandler);
}
function removeSwapOutsideListener() {
    if (_swapOutsideHandler) {
        document.removeEventListener('mousedown', _swapOutsideHandler);
        _swapOutsideHandler = null;
    }
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

// 渲染衣服推荐区域
function renderClothesSection() {
  var el = $('#board-clothes-section');
  if (!el) return;

  var clothes = boardPanelState._clothes || [];
  if (clothes.length === 0) {
    clothes = generateClothes(boardPanelState.roles);
    boardPanelState._clothes = clothes;
  }

  var evilCount = 0;
  boardPanelState.roles.forEach(function(r) {
    if (r.category === 'minion' || r.category === 'demon') evilCount++;
  });

  var html = '<div class="clothes-section">';
  html += '<div class="clothes-header">👔 衣服推荐';
  html += '<span class="clothes-hint">（不在场村民，供坏人伪装，共' + clothes.length + '件 / 坏人' + evilCount + '人+1）</span>';
  html += '</div>';
  html += '<div class="clothes-list">';
  clothes.forEach(function(r) {
    html += '<span class="clothes-tag">' + r.name + '</span>';
  });
  html += '</div></div>';
  el.innerHTML = html;
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

    // v3.0.49: 新版型 = 新回合，重置结算状态
    state.currentRound++;
    localStorage.setItem('botc_current_round', state.currentRound);
    if (typeof showSettleButton === 'function') showSettleButton();

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
