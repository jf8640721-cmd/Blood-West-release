/* ============================================================
   西游纪 Blood-West · 夜间行动历史记录模块
   查询 skill_actions 表，按夜晚分组展示已处理的行动记录
   依赖：state.js, data/roles.js
   ============================================================ */

// 加载夜间行动历史
async function loadNightHistory() {
    if (!state.room) return;

    const list = $('#history-list');
    const selector = $('#history-phase-selector');
    if (!list || !selector) return;

    // 显示加载状态
    list.innerHTML = '<div class="msg-placeholder">加载中…</div>';
    selector.innerHTML = '';

    try {
        // 查询已处理的技能行动
        const { data, error } = await state.supabase
            .from('skill_actions')
            .select('*')
            .eq('room_id', state.room.id)
            .in('status', ['completed', 'skipped'])
            .order('created_at', { ascending: true });

        if (error) {
            console.error('加载夜间历史失败:', error);
            list.innerHTML = '<div class="msg-placeholder">加载失败，请重试</div>';
            return;
        }

        if (!data || data.length === 0) {
            list.innerHTML = '<div class="msg-placeholder">暂无夜间行动记录</div>';
            return;
        }

        // 按 phase 分组，只保留夜晚阶段
        const phaseMap = new Map();
        for (const row of data) {
            if (!row.phase || !row.phase.includes('夜')) continue;
            if (!phaseMap.has(row.phase)) phaseMap.set(row.phase, []);
            phaseMap.get(row.phase).push(row);
        }

        if (phaseMap.size === 0) {
            list.innerHTML = '<div class="msg-placeholder">暂无夜间行动记录</div>';
            return;
        }

        // 保持 phase 顺序（SQL 已按 created_at 排序，Map 保持插入顺序）
        const phaseGroups = [];
        for (const [phase, actions] of phaseMap) {
            phaseGroups.push({ phase, actions });
        }

        renderNightHistory(phaseGroups);
    } catch (err) {
        console.error('加载夜间历史异常:', err);
        list.innerHTML = '<div class="msg-placeholder">加载失败，请重试</div>';
    }
}

// 渲染整个历史视图
function renderNightHistory(phaseGroups) {
    const list = $('#history-list');
    const selector = $('#history-phase-selector');

    // 渲染阶段选择器
    renderPhaseSelector(phaseGroups.map(g => g.phase));

    // 渲染所有夜晚分组
    let html = '';
    let isFirst = true;
    for (const group of phaseGroups) {
        html += renderPhaseGroup(group.phase, group.actions, isFirst);
        isFirst = false;
    }
    list.innerHTML = html;
}

// 渲染阶段快速跳转栏
function renderPhaseSelector(phaseNames) {
    const selector = $('#history-phase-selector');
    if (phaseNames.length <= 1) {
        selector.innerHTML = '';
        return;
    }
    let html = '';
    for (const name of phaseNames) {
        html += `<button class="history-phase-btn" onclick="scrollToPhase('${name}')" title="跳转到 ${name}">${name}</button>`;
    }
    selector.innerHTML = html;
}

// 渲染单个夜晚的行动组
function renderPhaseGroup(phaseName, actions, expanded) {
    const completedCount = actions.filter(a => a.status === 'completed').length;
    const skippedCount = actions.filter(a => a.status === 'skipped').length;

    let parts = [];
    if (completedCount > 0) parts.push(completedCount + ' 已完成');
    if (skippedCount > 0) parts.push(skippedCount + ' 已跳过');

    const phaseKey = phaseName.replace(/[^a-zA-Z0-9一-龥]/g, '_');

    let html = '<div class="history-phase-group" id="history-group-' + phaseKey + '">';
    html += '<div class="history-phase-header" onclick="togglePhaseGroup(\'' + phaseKey + '\')">';
    html += '<span class="history-phase-name">' + phaseName + '</span>';
    html += '<span class="history-phase-count">' + parts.join(' · ') + '</span>';
    html += '<span class="history-phase-arrow ' + (expanded ? 'expanded' : '') + '" id="history-arrow-' + phaseKey + '">▼</span>';
    html += '</div>';
    html += '<div class="history-phase-body" id="history-body-' + phaseKey + '" style="' + (expanded ? '' : 'display:none;') + '">';

    for (let i = 0; i < actions.length; i++) {
        html += renderHistoryActionRow(actions[i], i + 1);
    }

    html += '</div></div>';
    return html;
}

// 渲染单条行动记录行
function renderHistoryActionRow(action, orderNum) {
    const playerInfo = getPlayerInfo(action.player_id);
    const roleName = getRoleName(action.role_id);
    const roleCategory = getRoleCategory(action.role_id);
    const statusInfo = getStatusInfo(action.status);
    const targetInfo = action.target_player_id ? getPlayerInfo(action.target_player_id) : null;

    // 尝试从 action_data 中提取 targetRaw（手动处理时的原始输入）
    var actionData = {};
    try { actionData = JSON.parse(action.action_data || '{}'); } catch(e) {}
    var targetRaw = actionData.targetRaw || '';

    // 处理时间
    let timeStr = '';
    if (action.processed_at) {
        const d = new Date(action.processed_at);
        timeStr = d.getHours().toString().padStart(2, '0') + ':' +
                  d.getMinutes().toString().padStart(2, '0');
    } else if (action.created_at) {
        const d = new Date(action.created_at);
        timeStr = d.getHours().toString().padStart(2, '0') + ':' +
                  d.getMinutes().toString().padStart(2, '0');
    }

    // 备注文本
    const resolution = action.resolution || '';

    let html = '<div class="history-action-row ' + statusInfo.rowClass + '">';
    html += '<span class="history-action-order">#' + orderNum + '</span>';
    html += '<span class="history-action-player">' + escapeHtml(playerInfo.label) + '</span>';
    html += '<span class="history-action-role seat-role-' + roleCategory + '">' + escapeHtml(roleName) + '</span>';

    if (targetInfo) {
        html += '<span class="history-action-arrow">→</span>';
        html += '<span class="history-action-target">' + escapeHtml(targetInfo.label) + '</span>';
    } else if (targetRaw) {
        html += '<span class="history-action-arrow">→</span>';
        html += '<span class="history-action-target-raw">' + escapeHtml(targetRaw) + '</span>';
    }

    html += '<span class="history-action-status ' + statusInfo.className + '">' + statusInfo.label + '</span>';
    html += '<span class="history-action-time">' + timeStr + '</span>';

    if (resolution) {
        html += '<span class="history-action-resolution">' + escapeHtml(resolution) + '</span>';
    }

    html += '</div>';
    return html;
}

// 从 state.players 查找玩家信息
function getPlayerInfo(playerId) {
    if (!playerId) return { label: '?', number: '?' };
    const player = state.players.find(p => p.id === playerId);
    if (player) {
        const name = player.nickname || player.player_number + '号';
        return { label: player.player_number + '号 ' + name, number: player.player_number };
    }
    return { label: '已离开', number: '?' };
}

// 从 ROLES_BY_ID 查找角色名
function getRoleName(roleId) {
    if (!roleId) return '未知';
    if (window.ROLES_BY_ID && ROLES_BY_ID[roleId]) {
        return ROLES_BY_ID[roleId].name || roleId;
    }
    return roleId;
}

// 获取角色类别（用于着色）
function getRoleCategory(roleId) {
    if (!roleId) return 'townsfolk';
    if (window.ROLES_BY_ID && ROLES_BY_ID[roleId]) {
        const cat = ROLES_BY_ID[roleId].category;
        if (cat === 'townsfolk') return 'townsfolk';
        if (cat === 'outsider') return 'outsider';
        if (cat === 'minion') return 'minion';
        if (cat === 'demon') return 'demon';
    }
    return 'townsfolk';
}

// 状态信息映射
function getStatusInfo(status) {
    switch (status) {
        case 'completed':
            return { label: '已完成', className: 'status-completed', rowClass: 'row-completed' };
        case 'skipped':
            return { label: '已跳过', className: 'status-skipped', rowClass: 'row-skipped' };
        default:
            return { label: status, className: '', rowClass: '' };
    }
}

// 折叠/展开单个夜晚分组
function togglePhaseGroup(phaseKey) {
    const body = $('#history-body-' + phaseKey);
    const arrow = $('#history-arrow-' + phaseKey);
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (arrow) {
        arrow.classList.toggle('expanded', isHidden);
    }
}

// 滚动到指定夜晚
function scrollToPhase(phaseKey) {
    const group = $('#history-group-' + phaseKey);
    if (group) {
        group.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 简单的 HTML 转义
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
