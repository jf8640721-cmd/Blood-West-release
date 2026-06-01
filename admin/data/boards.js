/**
 * 版型推荐器 — 根据玩家人数推荐角色配置
 * 依赖：ROLES（roles.js 中定义）
 */

// 标准血染钟楼人数分布表（善良：村民+外来者 / 邪恶：爪牙+恶魔）
// 实际入局的爪牙/恶魔数量：表中数值为推荐放入版型的数量
// 主持人从中选择实际入局角色（通常恶魔只入局1个）
const DISTRIBUTION_TABLE = {
  5:  { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
  6:  { townsfolk: 4, outsider: 0, minion: 1, demon: 1 },
  7:  { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
  8:  { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
  9:  { townsfolk: 6, outsider: 1, minion: 1, demon: 1 },
  10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
  11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
  12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
  13: { townsfolk: 8, outsider: 1, minion: 3, demon: 1 },
  14: { townsfolk: 8, outsider: 2, minion: 3, demon: 1 },
  15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 },
  16: { townsfolk: 10, outsider: 2, minion: 3, demon: 1 },
  17: { townsfolk: 10, outsider: 3, minion: 3, demon: 1 },
  18: { townsfolk: 11, outsider: 3, minion: 3, demon: 1 },
  19: { townsfolk: 12, outsider: 3, minion: 3, demon: 1 }
};

// 类别显示顺序与标签
const CATEGORY_CONFIG = [
  { key: 'townsfolk',    label: '村民',   emoji: '⚪', color: 'var(--role-town)' },
  { key: 'outsider',     label: '外来者', emoji: '🟢', color: 'var(--role-outsider)' },
  { key: 'minion',       label: '爪牙',   emoji: '🟡', color: 'var(--role-minion)' },
  { key: 'demon',        label: '恶魔',   emoji: '🔴', color: 'var(--role-demon)' }
];

/**
 * Fisher-Yates 洗牌
 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 推荐版型：根据人数从各分类中随机抽取角色
 * @param {number} playerCount - 玩家人数（5-19）
 * @returns {{ playerCount: number, distribution: object, roles: array }}
 */
function recommendBoard(playerCount) {
  // 查表，超出范围用12人默认
  const dist = DISTRIBUTION_TABLE[playerCount] || DISTRIBUTION_TABLE[12];

  var result = {
    playerCount: playerCount,
    distribution: {},
    roles: []
  };

  // 按分类随机抽取角色（基础分布）
  CATEGORY_CONFIG.forEach(function(cat) {
    const count = dist[cat.key];
    if (count && count > 0) {
      const pool = ROLES.filter(function(r) { return r.category === cat.key; });
      const picked = shuffle(pool).slice(0, count);
      result.roles = result.roles.concat(picked);
    }
  });

  // 计算外来者修正值
  var totalMod = sumOutsiderModifier(result.roles);
  if (totalMod === 0) {
    // 无修正，直接返回
    result.distribution = { townsfolk: dist.townsfolk, outsider: dist.outsider, minion: dist.minion, demon: dist.demon };
    return result;
  }

  // 收集已使用的角色 ID
  var usedIds = result.roles.map(function(r) { return r.id; });

  if (totalMod > 0) {
    // 需要增加外来者、减少村民
    // 找出可移除的村民（优先移除不带修正的）
    var townsfolkToRemove = result.roles.filter(function(r) {
      return r.category === 'townsfolk' && !r.outsiderModifier;
    });
    var removed = 0;
    for (var i = result.roles.length - 1; i >= 0 && removed < totalMod; i--) {
      if (result.roles[i].category === 'townsfolk' && !result.roles[i].outsiderModifier) {
        usedIds.splice(usedIds.indexOf(result.roles[i].id), 1);
        result.roles.splice(i, 1);
        removed++;
      }
    }

    // 添加外来者
    var outsiderPool = ROLES.filter(function(r) {
      return r.category === 'outsider' && usedIds.indexOf(r.id) === -1;
    });
    var addedOutsiders = shuffle(outsiderPool).slice(0, totalMod);
    result.roles = result.roles.concat(addedOutsiders);
  } else {
    // 需要减少外来者、增加村民
    var absMod = -totalMod;
    // 找出可移除的外来者（优先移除不带修正的）
    for (var i = result.roles.length - 1; i >= 0 && absMod > 0; i--) {
      if (result.roles[i].category === 'outsider') {
        usedIds.splice(usedIds.indexOf(result.roles[i].id), 1);
        result.roles.splice(i, 1);
        absMod--;
      }
    }
    // 注意：即使外来者不够移除（已到0或负数），也继续添加村民
    var townsfolkPool = ROLES.filter(function(r) {
      return r.category === 'townsfolk' && usedIds.indexOf(r.id) === -1;
    });
    var addedTownsfolk = shuffle(townsfolkPool).slice(0, -totalMod); // totalMod 为负，-totalMod 为正
    result.roles = result.roles.concat(addedTownsfolk);
  }

  // 重新计算分布
  var townsfolkCount = 0, outsiderCount = 0, minionCount = 0, demonCount = 0;
  result.roles.forEach(function(r) {
    if (r.category === 'townsfolk') townsfolkCount++;
    else if (r.category === 'outsider') outsiderCount++;
    else if (r.category === 'minion') minionCount++;
    else if (r.category === 'demon') demonCount++;
  });
  result.distribution = {
    townsfolk: townsfolkCount,
    outsider: outsiderCount,
    minion: minionCount,
    demon: demonCount
  };

  return result;
}

/**
 * 获取指定人数对应的分布（不含具体角色，仅数量）
 */
function getDistribution(playerCount) {
  return DISTRIBUTION_TABLE[playerCount] || DISTRIBUTION_TABLE[12];
}

/**
 * 获取某类别中未被版型使用的角色（用于角色交换下拉框）
 * @param {string} categoryKey - 类别键
 * @param {string[]} usedRoleIds - 已被占用的角色 id 数组
 * @returns {object[]} 可用角色列表
 */
function getAvailableRolesForCategory(categoryKey, usedRoleIds) {
  return ROLES.filter(function(r) {
    return r.category === categoryKey && usedRoleIds.indexOf(r.id) === -1;
  });
}

/**
 * 计算一组角色的外来者修正值总和
 * @param {object[]} roles - 角色数组
 * @returns {number} 修正值总和（正值=需增加外来者，负值=需减少外来者）
 */
function sumOutsiderModifier(roles) {
  var total = 0;
  roles.forEach(function(r) {
    total += r.outsiderModifier || 0;
  });
  return total;
}
