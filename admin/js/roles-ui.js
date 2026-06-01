/* ============================================================
   西游纪 Blood-West · 角色 UI 模块
   角色查询、徽章渲染、角色选择器
   依赖：state.js, data/roles.js, board.js (state.activeBoard)
   ============================================================ */

// 根据玩家的 role 字段获取角色对象
function getPlayerRoleObj(player) {
    if (!player || !player.role) return null;
    return ROLES_BY_ID[player.role] || null;
}

// 生成座位角色徽章 HTML（空字符串 = 无角色）
function renderRoleBadgeHtml(player) {
    const roleObj = getPlayerRoleObj(player);
    if (!roleObj) return '';
    return `<span class="seat-role-badge seat-role-${roleObj.category}">${roleObj.name}</span>`;
}

// 渲染角色选择器下拉框
function renderRoleSelector(player) {
    const area = $('#rt-role-selector');
    const select = $('#rt-role-select');

    if (!state.activeBoard || !state.activeBoard.roles.length) {
        area.style.display = 'none';
        return;
    }

    area.style.display = 'flex';

    // 按类别分组构建 options
    const categories = [
        { key: 'townsfolk', label: '村民' },
        { key: 'outsider', label: '外来者' },
        { key: 'minion', label: '爪牙' },
        { key: 'demon', label: '恶魔' }
    ];

    let html = '<option value="">选择角色…</option>';
    categories.forEach(function(cat) {
        const catRoles = state.activeBoard.roles.filter(function(r) { return r.category === cat.key; });
        if (catRoles.length > 0) {
            html += '<optgroup label="── ' + cat.label + ' ──">';
            catRoles.forEach(function(r) {
                const selected = (player.role === r.id) ? ' selected' : '';
                html += '<option value="' + r.id + '"' + selected + '>' + r.name + '</option>';
            });
            html += '</optgroup>';
        }
    });

    select.innerHTML = html;

    // 如果玩家已有角色但不在当前版型中，追加
    if (player.role && !state.activeBoard.roles.find(function(r) { return r.id === player.role; })) {
        const extra = ROLES_BY_ID[player.role];
        if (extra) {
            select.innerHTML += '<optgroup label="── 其他 ──">' +
                '<option value="' + extra.id + '" selected>' + extra.name + '</option>' +
                '</optgroup>';
        }
    }
}

// 角色选择变更 -> 更新数据库
async function onRoleSelected(roleId) {
    if (!state.selectedPlayer) return;

    const playerId = state.selectedPlayer.id;

    // 乐观更新本地
    state.selectedPlayer.role = roleId || null;
    // 同步到 players 数组
    var idx = state.players.findIndex(function(p) { return p.id === playerId; });
    if (idx !== -1) {
        state.players[idx].role = roleId || null;
    }

    renderRoundTable();
    renderRoleSelector(state.selectedPlayer);
    updateEvilToolbarButton();

    // 持久化到数据库
    var updateData = { role: roleId || null };
    var { error } = await state.supabase
        .from('players')
        .update(updateData)
        .eq('id', playerId);

    if (error) {
        console.error('角色更新失败:', error);
        // 回滚
        state.selectedPlayer.role = state.selectedPlayer.role;
        if (idx !== -1) state.players[idx].role = state.selectedPlayer.role;
        renderRoundTable();
        renderRoleSelector(state.selectedPlayer);
        updateEvilToolbarButton();
    }
}
