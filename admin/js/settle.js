/**
 * admin/js/settle.js - 游戏结算逻辑（v3.0.47）
 * 依赖：state.js（全局状态）、roles.js（ROLES_BY_ID 角色数据）
 */

// ============================================================
// 结算弹窗控制
// ============================================================

// 显示结算弹窗
function showSettleModal() {
    if (!state.room || !state.room.id) {
        alert('请先创建或加入房间');
        return;
    }

    // 检查是否已结算过
    var roomId = state.room.id;
    state.supabase
        .from('game_participants')
        .select('id')
        .eq('room_id', roomId)
        .limit(1)
        .then(function (res) {
            if (res.data && res.data.length > 0) {
                alert('该房间已经结算过了，无法重复结算。');
                return;
            }
            if (res.error) {
                console.error('检查结算状态失败:', res.error);
            }
            renderSettleSummary();
            document.getElementById('settle-modal').style.display = 'flex';
        });
}

// 关闭结算弹窗
function closeSettleModal() {
    document.getElementById('settle-modal').style.display = 'none';
}

// ============================================================
// 渲染结算摘要
// ============================================================

function renderSettleSummary() {
    var players = state.players || [];
    var activePlayers = players.filter(function (p) { return !p.kicked; });

    var summary = document.getElementById('settle-summary');
    if (!summary) return;

    var html = '<div class="settle-players">';
    html += '<span class="settle-count">共 ' + activePlayers.length + ' 名玩家</span>';

    // 统计阵营
    var goodCount = 0;
    var evilCount = 0;
    activePlayers.forEach(function (p) {
        var roleObj = getPlayerRoleObj(p);
        if (roleObj) {
            var cat = roleObj.category;
            if (cat === 'townsfolk' || cat === 'outsider') goodCount++;
            else if (cat === 'minion' || cat === 'demon') evilCount++;
        }
    });

    html += '<span class="settle-factions">善良 ' + goodCount + ' / 邪恶 ' + evilCount + '</span>';
    html += '</div>';

    // 列出玩家
    html += '<div class="settle-player-list">';
    activePlayers.forEach(function (p) {
        var roleObj = getPlayerRoleObj(p);
        var roleName = roleObj ? roleObj.name : '未知';
        var cat = roleObj ? roleObj.category : '';
        var faction = (cat === 'townsfolk' || cat === 'outsider') ? 'good' : 'evil';
        var factionLabel = faction === 'good' ? '☀ 善良' : '🌙 邪恶';
        var survived = p.status === 'alive';
        var survivedLabel = survived ? '存活' : '死亡';

        html += '<div class="settle-player-row faction-' + faction + '">';
        html += '<span class="sp-number">' + p.player_number + '号</span>';
        html += '<span class="sp-name">' + (p.nickname || (p.player_number + '号')) + '</span>';
        html += '<span class="sp-role">' + roleName + '</span>';
        html += '<span class="sp-faction">' + factionLabel + '</span>';
        html += '<span class="sp-status">' + survivedLabel + '</span>';
        html += '</div>';
    });
    html += '</div>';

    summary.innerHTML = html;
}

// ============================================================
// 执行结算
// ============================================================

async function executeSettle(winner) {
    var roomId = state.room.id;
    var players = state.players.filter(function (p) { return !p.kicked; });

    if (players.length === 0) {
        alert('房间内没有玩家，无法结算');
        return;
    }

    // 检查测试玩家
    var hasTestPlayer = players.some(function (p) {
        return p.openid && p.openid.indexOf('test_') === 0;
    });
    if (hasTestPlayer) {
        var skipTest = confirm('房间内包含测试玩家（模拟加入），其数据不会计入排行榜。是否继续结算？');
        if (!skipTest) return;
    }

    // 1. 构建 game_participants 数据
    var participants = [];
    players.forEach(function (p) {
        var roleObj = getPlayerRoleObj(p);
        if (!roleObj) return;
        var cat = roleObj.category;
        var faction = (cat === 'townsfolk' || cat === 'outsider') ? 'good' : 'evil';
        var survived = p.status === 'alive';
        var won = (winner === faction);

        participants.push({
            room_id: roomId,
            player_id: p.id,
            openid: p.openid || '',
            role_id: p.role || '',
            faction: faction,
            survived: survived,
            won: won
        });
    });

    try {
        // 2. 批量插入 game_participants
        var { error: insertErr } = await state.supabase
            .from('game_participants')
            .insert(participants);

        if (insertErr) {
            console.error('插入参与记录失败:', insertErr);
            alert('结算失败：无法写入参与记录。请查看控制台。');
            return;
        }

        // 3. 逐玩家更新 player_game_stats（跳过测试玩家）
        var updateCount = 0;
        for (var i = 0; i < participants.length; i++) {
            var part = participants[i];
            if (part.openid.indexOf('test_') === 0) continue;

            var p = players[i];
            // 使用 RPC 函数原子更新统计
            var { error: rpcErr } = await state.supabase.rpc('upsert_game_stats', {
                p_openid: part.openid,
                p_nickname: p.nickname || '',
                p_avatar_url: p.avatar_url || '',
                p_won: part.won
            });

            if (rpcErr) {
                console.error('更新玩家统计失败 (' + part.openid + '):', rpcErr);
            } else {
                updateCount++;
            }
        }

        // 4. 关闭弹窗
        closeSettleModal();

        var winnerLabel = winner === 'good' ? '善良阵营' : '邪恶阵营';
        alert('✅ 结算完成！\n\n获胜方：' + winnerLabel + '\n已更新 ' + updateCount + ' 名玩家的生涯统计。');

        // 隐藏结算按钮（防止重复结算）
        var btnSettle = document.getElementById('btn-settle');
        if (btnSettle) btnSettle.style.display = 'none';

    } catch (err) {
        console.error('结算异常:', err);
        alert('结算过程发生异常，请查看控制台。');
    }
}

// ============================================================
// 事件绑定（在 app.js 中调用）
// ============================================================

function bindSettleEvents() {
    // 结算按钮
    var btnSettle = document.getElementById('btn-settle');
    if (btnSettle) {
        btnSettle.addEventListener('click', showSettleModal);
    }

    // 关闭按钮
    var btnClose = document.getElementById('btn-close-settle');
    if (btnClose) {
        btnClose.addEventListener('click', closeSettleModal);
    }

    var btnCancel = document.getElementById('btn-settle-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', closeSettleModal);
    }

    // 获胜按钮
    var settleBtns = document.querySelectorAll('.btn-settle-good, .btn-settle-evil');
    settleBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var winner = this.getAttribute('data-winner');
            if (!confirm('确定结算为 ' + (winner === 'good' ? '善良阵营获胜' : '邪恶阵营获胜') + ' 吗？此操作不可撤销。')) return;
            executeSettle(winner);
        });
    });

    // 点击弹窗遮罩关闭
    var modal = document.getElementById('settle-modal');
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeSettleModal();
        });
    }
}

// 显示结算按钮（进入房间后调用）
function showSettleButton() {
    var btnSettle = document.getElementById('btn-settle');
    if (btnSettle) btnSettle.style.display = '';
}

// 隐藏结算按钮（退出房间时调用）
function hideSettleButton() {
    var btnSettle = document.getElementById('btn-settle');
    if (btnSettle) btnSettle.style.display = 'none';
}
