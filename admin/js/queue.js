/* ============================================================
   西游纪 Blood-West · 夜间行动队列
   技能发动收集系统核心 — 队列生成/渲染/处理/触发检测
   ============================================================ */

// ----- 队列运行时状态 -----
state.nightQueue = [];           // 当前队列项 [{order, player, roleObj, interactionType, status, actionId, isTrigger}]
state.queueActions = {};         // { actionId: skill_action记录 }
state.queueProcessed = 0;        // 已处理计数
state.queuePhase = null;         // 当前队列对应的阶段
state.queueVisible = true;       // 队列面板是否展开

// ============================================================
// 交互类型判断
// ============================================================
function getInteractionType(roleObj) {
    if (!roleObj) return 'passive_auto';
    if (roleObj.abilityType === 'passive') return 'passive_auto';
    if (roleObj.abilityType === 'triggered') return 'host_prompted';
    return 'player_initiated'; // active + once_per_game
}

// ============================================================
// 生成夜间行动队列
// ============================================================
function generateNightQueue(phase) {
    var isFirstNight = (phase === '首夜');
    var inPlay = state.players
        .filter(function(p) { return p.role && !p.kicked && p.status === 'alive'; })
        .map(function(p) {
            var roleObj = ROLES_BY_ID[p.role];
            return { player: p, roleObj: roleObj };
        })
        .filter(function(e) { return e.roleObj; });

    var queue = [];

    if (isFirstNight) {
        // 首夜：先 firstNightOrder（信息位），再 nightOrder（行动位）
        var pre = inPlay
            .filter(function(e) { return e.roleObj.firstNightOrder != null; })
            .sort(function(a, b) { return a.roleObj.firstNightOrder - b.roleObj.firstNightOrder; });
        var normal = inPlay
            .filter(function(e) { return e.roleObj.nightOrder != null; })
            .filter(function(e) { return e.roleObj.firstNightBlocked === false; })
            .sort(function(a, b) { return a.roleObj.nightOrder - b.roleObj.nightOrder; });
        queue = pre.concat(normal);
        // 去重（同一玩家可能同时在两个列表）
        var seen = {};
        queue = queue.filter(function(e) {
            var key = e.player.id;
            if (seen[key]) return false;
            seen[key] = true;
            return true;
        });
    } else {
        queue = inPlay
            .filter(function(e) { return e.roleObj.nightOrder != null; })
            .sort(function(a, b) { return a.roleObj.nightOrder - b.roleObj.nightOrder; });
    }

    // 为每行标注元数据
    return queue.map(function(entry, index) {
        return {
            order: index + 1,
            player: entry.player,
            roleObj: entry.roleObj,
            interactionType: getInteractionType(entry.roleObj),
            status: 'pending',      // pending | submitted | processing | completed | skipped
            actionId: null,
            targetPlayerId: null,
            isTrigger: false
        };
    });
}

// ============================================================
// 初始化/刷新队列面板
// ============================================================
async function initNightQueue(phase) {
    if (!phase) phase = state.room ? state.room.phase : null;
    if (!phase) return;

    var phaseType = getPhaseType(phase);
    var isNight = (phaseType === 'night');

    // 非夜晚阶段隐藏队列
    var panel = $('#night-queue-panel');
    if (!isNight) {
        if (panel) panel.style.display = 'none';
        state.nightQueue = [];
        state.queuePhase = null;
        return;
    }

    state.queuePhase = phase;
    state.nightQueue = generateNightQueue(phase);
    state.queueProcessed = 0;

    // 加载本阶段已有的 skill_actions 记录
    await loadQueueActions(phase);

    // 渲染面板
    renderQueuePanel();
    if (panel) panel.style.display = 'block';
}

// ============================================================
// 加载已有技能行动记录
// ============================================================
async function loadQueueActions(phase) {
    if (!state.room) return;
    try {
        var res = await state.supabase
            .from('skill_actions')
            .select('*')
            .eq('room_id', state.room.id)
            .eq('phase', phase)
            .order('created_at', { ascending: true });

        if (res.error) { console.error('加载技能行动失败:', res.error); return; }

        var actions = res.data || [];
        state.queueActions = {};
        actions.forEach(function(a) {
            state.queueActions[a.id] = a;
            // 更新队列中对应项的状态
            var item = state.nightQueue.find(function(q) {
                return q.player.id === a.player_id && !q.isTrigger;
            });
            if (item) {
                item.actionId = a.id;
                item.targetPlayerId = a.target_player_id;
                if (a.status === 'submitted' || a.status === 'responded') {
                    item.status = 'submitted';
                } else if (a.status === 'completed') {
                    item.status = 'completed';
                } else if (a.status === 'awaiting_response') {
                    item.status = 'awaiting';
                }
            }
        });
        // 重新计算已处理数
        state.queueProcessed = state.nightQueue.filter(function(q) {
            return q.status === 'completed' || q.status === 'skipped';
        }).length;
    } catch (e) {
        console.error('加载技能行动异常:', e);
    }
}

// ============================================================
// 渲染队列面板
// ============================================================
function renderQueuePanel() {
    var panel = $('#night-queue-panel');
    if (!panel) return;

    var list = $('#queue-list');
    if (!list) return;

    var total = state.nightQueue.length;
    var processed = state.queueProcessed;

    // 更新进度
    var progressEl = $('#queue-progress');
    if (progressEl) {
        progressEl.textContent = '已处理: ' + processed + '/' + total;
    }

    // 渲染列表
    var html = '';
    if (total === 0) {
        html = '<div class="queue-empty">本阶段无夜间行动角色</div>';
    } else {
        state.nightQueue.forEach(function(item, index) {
            html += renderQueueRow(item, index);
        });
    }
    list.innerHTML = html;

    // 绑定行按钮事件
    bindQueueRowEvents();
}

// ============================================================
// 渲染单个队列行
// ============================================================
function renderQueueRow(item, index) {
    var p = item.player;
    var r = item.roleObj;
    var typeIcon, typeClass, statusText, statusClass, actionButtons;

    // 类型图标和样式
    if (item.interactionType === 'player_initiated') {
        typeIcon = '🎯';
        typeClass = 'queue-active';
    } else if (item.interactionType === 'host_prompted') {
        typeIcon = '⚡';
        typeClass = 'queue-triggered';
    } else {
        typeIcon = '—';
        typeClass = 'queue-passive';
    }

    // 状态显示
    if (item.status === 'pending') {
        if (item.interactionType === 'player_initiated') {
            statusText = '◷ 等待提交';
            statusClass = 'status-pending';
        } else if (item.interactionType === 'host_prompted') {
            statusText = '⚡ 待触发';
            statusClass = 'status-pending';
        } else {
            statusText = '— 自动';
            statusClass = 'status-auto';
        }
    } else if (item.status === 'submitted') {
        statusText = '● 已提交';
        statusClass = 'status-submitted';
    } else if (item.status === 'processing') {
        statusText = '⏳ 处理中';
        statusClass = 'status-processing';
    } else if (item.status === 'completed') {
        statusText = '✓ 已处理';
        statusClass = 'status-completed';
    } else if (item.status === 'skipped') {
        statusText = '— 已跳过';
        statusClass = 'status-skipped';
    } else if (item.status === 'awaiting') {
        statusText = '⏳ 等待回应';
        statusClass = 'status-awaiting';
    }

    // 行动描述 + 目标 + 备注（三者紧贴）
    var actionDesc = getSkillShortName(r);
    var targetHtml = '';
    var noteHtml = '';

    // 目标：优先显示手动输入的原始文本 → 高亮
    var targetText = item.targetRaw || '';
    if (!targetText && item.targetPlayerId) {
        var targetPlayer = state.players.find(function(pl) { return pl.id === item.targetPlayerId; });
        if (targetPlayer) {
            targetText = targetPlayer.player_number + '号';
        }
    }
    if (targetText) {
        targetHtml = ' <span class="queue-target">→ ' + escapeHtml(targetText) + '</span>';
    }

    // 备注：紧贴目标右侧
    if (item.status === 'completed' || item.status === 'skipped') {
        var resolution = item.resolution || '';
        if (!resolution && item.actionId && state.queueActions[item.actionId]) {
            resolution = state.queueActions[item.actionId].resolution || '';
        }
        if (resolution) {
            noteHtml = ' <span class="queue-resolution" title="' + escapeHtml(resolution) + '">' + escapeHtml(resolution) + '</span>';
        }
    }

    // 操作按钮
    actionButtons = renderQueueButtons(item);

    var isProcessed = (item.status === 'completed' || item.status === 'skipped');
    var rowClass = 'queue-row ' + typeClass + (isProcessed ? ' queue-done' : '');

    return '<div class="' + rowClass + '" data-index="' + index + '" data-player-id="' + p.id + '">' +
        '<span class="queue-order">' + item.order + '</span>' +
        '<span class="queue-type-icon">' + typeIcon + '</span>' +
        '<span class="queue-player-name">' + escapeHtml(p.nickname || '玩家') + '</span>' +
        '<span class="queue-role-name">' + r.name + '</span>' +
        '<span class="queue-action-desc" title="' + escapeHtml(r.ability || '') + '">' + escapeHtml(actionDesc) + targetHtml + noteHtml + '</span>' +
        '<span class="queue-status ' + statusClass + '">' + statusText + '</span>' +
        '<span class="queue-buttons">' + actionButtons + '</span>' +
        '</div>';
}

// ============================================================
// 队列行操作按钮
// ============================================================
function renderQueueButtons(item) {
    var buttons = '';

    if (item.interactionType === 'player_initiated') {
        if (item.status === 'submitted') {
            buttons += '<button class="btn btn-xs btn-queue-process" data-action="process" data-index="' + item.order + '">处理</button>';
            buttons += '<button class="btn btn-xs btn-queue-skip" data-action="skip" data-index="' + item.order + '">跳过</button>';
        } else if (item.status === 'pending') {
            buttons += '<button class="btn btn-xs btn-queue-manual" data-action="manual" data-index="' + item.order + '">手动处理</button>';
            buttons += '<button class="btn btn-xs btn-queue-skip" data-action="skip" data-index="' + item.order + '">跳过</button>';
        } else if (item.status === 'completed' || item.status === 'skipped') {
            buttons += '<button class="btn btn-xs btn-queue-undo" data-action="undo" data-index="' + item.order + '">撤销</button>';
        }
    } else if (item.interactionType === 'host_prompted') {
        if (item.status === 'pending') {
            buttons += '<button class="btn btn-xs btn-queue-prompt" data-action="prompt" data-index="' + item.order + '">发消息询问</button>';
            buttons += '<button class="btn btn-xs btn-queue-skip" data-action="skip" data-index="' + item.order + '">跳过</button>';
        } else if (item.status === 'awaiting') {
            buttons += '<button class="btn btn-xs btn-queue-process" data-action="process" data-index="' + item.order + '">处理回应</button>';
            buttons += '<button class="btn btn-xs btn-queue-skip" data-action="skip" data-index="' + item.order + '">跳过</button>';
        } else if (item.status === 'submitted') {
            buttons += '<button class="btn btn-xs btn-queue-process" data-action="process" data-index="' + item.order + '">处理</button>';
        }
    } else if (item.interactionType === 'passive_auto') {
        if (item.status === 'pending') {
            buttons += '<button class="btn btn-xs btn-queue-confirm" data-action="confirm" data-index="' + item.order + '">确认</button>';
        }
    }

    return buttons;
}

// ============================================================
// 绑定队列行事件
// ============================================================
function bindQueueRowEvents() {
    var list = $('#queue-list');
    if (!list) return;

    list.querySelectorAll('button[data-action]').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var action = this.getAttribute('data-action');
            var idx = parseInt(this.getAttribute('data-index'));
            handleQueueAction(action, idx);
        });
    });
}

// ============================================================
// 处理队列操作
// ============================================================
async function handleQueueAction(action, orderIndex) {
    var item = state.nightQueue.find(function(q) { return q.order === orderIndex; });
    if (!item) return;

    switch (action) {
        case 'process':
            await processQueueItem(item);
            break;
        case 'skip':
            await skipQueueItem(item);
            break;
        case 'manual':
            await manualProcessItem(item);
            break;
        case 'prompt':
            await sendHostPrompt(item);
            break;
        case 'confirm':
            await confirmPassiveItem(item);
            break;
        case 'undo':
            await undoQueueItem(item);
            break;
    }
    renderQueuePanel();
}

// ============================================================
// 处理主动技能项
// ============================================================
async function processQueueItem(item) {
    if (!state.room) return;
    item.status = 'processing';
    renderQueuePanel();

    try {
        // 更新或创建 skill_actions 记录
        if (item.actionId) {
            await state.supabase
                .from('skill_actions')
                .update({
                    status: 'completed',
                    resolution: '主持人已处理',
                    processed_at: new Date().toISOString()
                })
                .eq('id', item.actionId);
        } else {
            // 玩家口头告知，主持人手动记录
            var insertData = {
                room_id: state.room.id,
                phase: state.queuePhase,
                player_id: item.player.id,
                role_id: item.roleObj.id,
                direction: 'player_initiated',
                action_type: 'use_ability',
                action_data: '{}',
                status: 'completed',
                resolution: '主持人手动处理（玩家口头告知）',
                processed_at: new Date().toISOString()
            };
            if (item.targetPlayerId) {
                insertData.target_player_id = item.targetPlayerId;
            }
            var res = await state.supabase
                .from('skill_actions')
                .insert(insertData)
                .select();
            if (res.data && res.data.length > 0) {
                item.actionId = res.data[0].id;
                state.queueActions[item.actionId] = res.data[0];
            }
        }

        item.status = 'completed';
        state.queueProcessed++;

        // 触发检测
        await detectAndInsertTriggers(item);

    } catch (e) {
        console.error('处理队列项失败:', e);
        item.status = 'submitted'; // 恢复以便重试
    }
}

// ============================================================
// 跳过队列项
// ============================================================
async function skipQueueItem(item) {
    item.status = 'skipped';
    state.queueProcessed++;

    // 可选：在数据库记录跳过
    if (state.room && item.interactionType !== 'passive_auto') {
        try {
            var insertData = {
                room_id: state.room.id,
                phase: state.queuePhase,
                player_id: item.player.id,
                role_id: item.roleObj.id,
                direction: (item.interactionType === 'host_prompted') ? 'host_prompted' : 'player_initiated',
                action_type: 'pass',
                status: 'skipped',
                resolution: '主持人跳过',
                processed_at: new Date().toISOString()
            };
            var res = await state.supabase
                .from('skill_actions')
                .insert(insertData)
                .select();
            if (res.data && res.data.length > 0) {
                item.actionId = res.data[0].id;
            }
        } catch (e) {
            console.error('记录跳过失败:', e);
        }
    }

    renderQueuePanel();
}

// ============================================================
// 手动处理（玩家口头告知）
// ============================================================
async function manualProcessItem(item) {
    var targetInput = prompt('请输入目标（如：3、3和4、5号，留空表示无目标）：');
    if (targetInput) {
        item.targetRaw = targetInput.trim();
        // 尝试解析纯数字作为玩家号码匹配
        var num = parseInt(targetInput);
        if (!isNaN(num) && String(num) === targetInput.trim()) {
            var targetPlayer = state.players.find(function(p) { return p.player_number === num; });
            if (targetPlayer) {
                item.targetPlayerId = targetPlayer.id;
            }
        }
    }
    var note = prompt('处理备注（可选）：');
    item.resolution = note || '';

    await processQueueItem(item);
}

// ============================================================
// 主持人发送技能询问
// ============================================================
async function sendHostPrompt(item) {
    if (!state.room) return;
    try {
        var r = item.roleObj;
        var triggerMsg = '【' + r.name + '·' + getSkillShortName(r) + '】触发：请选择是否发动技能';

        // 创建 host_prompted 记录
        var insertData = {
            room_id: state.room.id,
            phase: state.queuePhase,
            player_id: item.player.id,
            role_id: r.id,
            direction: 'host_prompted',
            action_type: 'trigger_prompt',
            action_data: JSON.stringify({ prompt: triggerMsg }),
            status: 'awaiting_response'
        };
        var res = await state.supabase
            .from('skill_actions')
            .insert(insertData)
            .select();
        if (res.data && res.data.length > 0) {
            item.actionId = res.data[0].id;
            state.queueActions[item.actionId] = res.data[0];
        }

        // 同时发送系统消息到玩家聊天
        await state.supabase
            .from('messages')
            .insert({
                room_id: state.room.id,
                player_id: item.player.id,
                direction: 'host_to_player',
                content: '⚡ ' + triggerMsg,
                phase: state.queuePhase
            });

        // 更新玩家 pending_prompt 状态
        await updatePlayerPendingPrompt(item.player.id, true);

        item.status = 'awaiting';

    } catch (e) {
        console.error('发送技能询问失败:', e);
    }
    renderQueuePanel();
}

// ============================================================
// 确认被动技能
// ============================================================
async function confirmPassiveItem(item) {
    item.status = 'completed';
    state.queueProcessed++;
    // 被动技能不创建 skill_actions 记录，仅标记完成
    renderQueuePanel();
}

// ============================================================
// 撤销队列项
// ============================================================
async function undoQueueItem(item) {
    if (item.status === 'completed' || item.status === 'skipped') {
        if (item.status === 'completed') state.queueProcessed = Math.max(0, state.queueProcessed - 1);
        item.status = 'pending';
    }
    if (item.actionId && state.queueActions[item.actionId]) {
        try {
            await state.supabase
                .from('skill_actions')
                .delete()
                .eq('id', item.actionId);
            delete state.queueActions[item.actionId];
            item.actionId = null;
            item.targetPlayerId = null;
        } catch (e) {
            console.error('撤销失败:', e);
        }
    }
    renderQueuePanel();
}

// ============================================================
// 触发检测引擎
// ============================================================
async function detectAndInsertTriggers(completedItem) {
    if (!completedItem.targetPlayerId) return;

    var targetPlayer = state.players.find(function(p) { return p.id === completedItem.targetPlayerId; });
    if (!targetPlayer || !targetPlayer.role || targetPlayer.status !== 'alive') return;

    var roleObj = ROLES_BY_ID[targetPlayer.role];
    if (!roleObj || roleObj.abilityType !== 'triggered') return;

    // 检测触发条件：目标被技能选中（尤其是杀人类技能）
    var completedRole = completedItem.roleObj;
    var abilityText = completedRole.ability || '';

    // 判定是否为"杀死"类技能（恶魔杀人、东华帝君等）
    var isKillAbility = (
        completedRole.category === 'demon' ||
        abilityText.indexOf('杀死') !== -1 ||
        abilityText.indexOf('死亡') !== -1
    );

    if (!isKillAbility) return;

    // 检查是否已在队列中
    var alreadyInQueue = state.nightQueue.some(function(q) {
        return q.player.id === targetPlayer.id && q.isTrigger;
    });
    if (alreadyInQueue) return;

    // 插入触发行
    var triggerItem = {
        order: state.nightQueue.length + 1,
        player: targetPlayer,
        roleObj: roleObj,
        interactionType: 'host_prompted',
        status: 'pending',
        actionId: null,
        targetPlayerId: null,
        isTrigger: true,
        triggerReason: '被 ' + completedRole.name + ' 的技能触发'
    };
    state.nightQueue.push(triggerItem);

    console.log('⚡ 触发检测：' + targetPlayer.player_number + '号 ' + roleObj.name + ' 被触发');
}

// ============================================================
// 更新玩家 pending_prompt 状态
// ============================================================
async function updatePlayerPendingPrompt(playerId, value) {
    if (!state.room) return;
    try {
        // 检查是否存在 skill_states 记录
        var res = await state.supabase
            .from('skill_states')
            .select('id')
            .eq('room_id', state.room.id)
            .eq('player_id', playerId);

        if (res.data && res.data.length > 0) {
            await state.supabase
                .from('skill_states')
                .update({ pending_prompt: value })
                .eq('id', res.data[0].id);
        } else {
            await state.supabase
                .from('skill_states')
                .insert({
                    room_id: state.room.id,
                    player_id: playerId,
                    pending_prompt: value
                });
        }
    } catch (e) {
        console.error('更新 pending_prompt 失败:', e);
    }
}

// ============================================================
// 获取技能简称
// ============================================================
function getSkillShortName(roleObj) {
    if (!roleObj || !roleObj.ability) return '技能';
    var ab = roleObj.ability;
    var colonIdx = ab.indexOf('：');
    if (colonIdx === -1) colonIdx = ab.indexOf(':');
    if (colonIdx > 0) return ab.substring(0, colonIdx);
    return ab.substring(0, Math.min(6, ab.length));
}

// ============================================================
// 切换队列面板折叠
// ============================================================
function toggleQueuePanel() {
    state.queueVisible = !state.queueVisible;
    var body = $('#queue-list');
    var btn = $('#btn-toggle-queue');
    if (body) body.style.display = state.queueVisible ? 'block' : 'none';
    if (btn) btn.textContent = state.queueVisible ? '折叠' : '展开';
}

// ============================================================
// 监听 skill_actions Realtime 变更（玩家提交/回应）
// ============================================================
function subscribeSkillActions(roomId) {
    if (!state.supabase || !roomId) return;

    // 如果已有频道则先移除
    if (state.skillChannel) {
        state.supabase.removeChannel(state.skillChannel);
    }

    state.skillChannel = state.supabase
        .channel('skill-actions-' + roomId)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'skill_actions',
            filter: 'room_id=eq.' + roomId
        }, function(payload) {
            handleSkillActionRealtime(payload.new);
        })
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'skill_actions',
            filter: 'room_id=eq.' + roomId
        }, function(payload) {
            handleSkillActionRealtime(payload.new);
        })
        .subscribe();
}

// ============================================================
// 处理 Realtime 技能行动变更
// ============================================================
function handleSkillActionRealtime(action) {
    if (!action) return;

    // 更新本地缓存
    state.queueActions[action.id] = action;

    // 查找对应队列项
    var item = state.nightQueue.find(function(q) {
        return q.player.id === action.player_id && !q.isTrigger;
    });

    if (item) {
        item.actionId = action.id;
        item.targetPlayerId = action.target_player_id;

        if (action.status === 'submitted') {
            item.status = 'submitted';
        } else if (action.status === 'responded') {
            item.status = 'submitted';
        } else if (action.status === 'completed') {
            item.status = 'completed';
            if (state.queueProcessed < state.nightQueue.filter(function(q) { return q.status === 'completed' || q.status === 'skipped'; }).length) {
                state.queueProcessed++;
            }
        }
    }

    // 刷新面板
    renderQueuePanel();
}

// ============================================================
// 初始化技能状态记录（首夜过后调用）
// ============================================================
async function initSkillStates() {
    if (!state.room) return;

    var alivePlayers = state.players.filter(function(p) {
        return p.role && !p.kicked && p.status === 'alive';
    });

    try {
        for (var i = 0; i < alivePlayers.length; i++) {
            var p = alivePlayers[i];
            // 检查是否已有记录
            var res = await state.supabase
                .from('skill_states')
                .select('id')
                .eq('room_id', state.room.id)
                .eq('player_id', p.id);

            if (!res.data || res.data.length === 0) {
                await state.supabase
                    .from('skill_states')
                    .insert({
                        room_id: state.room.id,
                        player_id: p.id
                    });
            }
        }
        console.log('技能状态初始化完成: ' + alivePlayers.length + ' 名玩家');
    } catch (e) {
        console.error('初始化技能状态失败:', e);
    }
}

// ============================================================
// 获取玩家技能状态
// ============================================================
async function getPlayerSkillState(playerId) {
    if (!state.room) return null;
    try {
        var res = await state.supabase
            .from('skill_states')
            .select('*')
            .eq('room_id', state.room.id)
            .eq('player_id', playerId);

        if (res.data && res.data.length > 0) return res.data[0];
        return null;
    } catch (e) {
        return null;
    }
}
