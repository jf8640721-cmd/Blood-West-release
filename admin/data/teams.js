/**
 * 血染钟楼：西游纪 — 羁绊组合定义
 * 定义角色之间的羁绊关系及触发效果
 * 数据来源：docs/西游纪角色说明书.txt
 */

var TEAM_SYNERGIES = {
  /* ============================================================
     师徒四人 — 唐僧、孙悟空、猪八戒、沙僧齐聚
     效果：爪牙数量+1（增加一名邪恶爪牙）
     ============================================================ */
  "师徒四人": {
    name: "师徒四人",
    members: ["tang_seng", "sun_wukong", "zhu_bajie", "sha_seng"],
    description: "唐僧、孙悟空、猪八戒、沙僧四人齐聚西行",
    bonus: "爪牙数量+1",
    effect: "add_minion",
    effectValue: 1
  },

  /* ============================================================
     猪猪宝贝 — 高翠兰 & 猪八戒
     效果：二人互知身份，猪八戒不死则高翠兰不会死亡
     注：晕眩不可打断此羁绊
     ============================================================ */
  "猪猪宝贝": {
    name: "猪猪宝贝",
    members: ["gao_cuilan", "zhu_bajie"],
    description: "高翠兰与猪八戒同时在场，二人互知身份",
    bonus: "猪八戒不死则高翠兰不会死亡（晕眩不可打断）",
    effect: "mutual_knowledge_and_protection",
    protectedBy: "zhu_bajie",  // 保护者（死亡后保护失效）
    protectedPlayer: "gao_cuilan"  // 被保护者
  },

  /* ============================================================
     三清现世 — 太上老君、元始天尊、通天教主同时登场
     效果：三清各获一次死亡免疫
     ============================================================ */
  "三清现世": {
    name: "三清现世",
    members: ["taishang_laojun", "yuanshi_tianzun", "tongtian_jiaozhu"],
    description: "太上老君、元始天尊、通天教主同时登场",
    bonus: "三清各获一次死亡免疫护盾",
    effect: "death_immune_once_each",
    effectValue: 1  // 每人获得1次死亡免疫
  },

  /* ============================================================
     牛魔父子 — 牛魔王 & 红孩儿
     效果：极低概率同时登场（限制性羁绊，主持人控制概率）
     ============================================================ */
  "牛魔父子": {
    name: "牛魔父子",
    members: ["niumo_wang", "honghaier"],
    description: "牛魔王与红孩儿极少同时登场",
    bonus: "极低概率同时登场（限制性羁绊）",
    effect: "rarely_together",
    descriptionFull: "牛魔王和红孩儿同时登场的概率极低，建议主持人在版型配置时避免二者同场"
  }
};

/**
 * 根据在玩角色ID列表检测所有激活的羁绊
 * @param {string[]} roleIds - 当前版型中的角色ID列表
 * @returns {object[]} 激活的羁绊数组
 */
function getActiveSynergies(roleIds) {
  var result = [];
  for (var key in TEAM_SYNERGIES) {
    if (!TEAM_SYNERGIES.hasOwnProperty(key)) continue;
    var synergy = TEAM_SYNERGIES[key];
    var matchCount = 0;
    for (var i = 0; i < synergy.members.length; i++) {
      if (roleIds.indexOf(synergy.members[i]) !== -1) {
        matchCount++;
      }
    }
    // 所有成员都在场才算激活
    if (matchCount === synergy.members.length) {
      result.push(synergy);
    }
  }
  return result;
}

/**
 * 检测版型是否需要因为羁绊调整分布
 * @param {string[]} roleIds - 当前版型中的角色ID列表
 * @returns {object} { addMinion: number } 需要额外添加的爪牙数量
 */
function getSynergyDistributionMod(roleIds) {
  var mod = { addMinion: 0 };
  var synergies = getActiveSynergies(roleIds);
  for (var i = 0; i < synergies.length; i++) {
    var syn = synergies[i];
    if (syn.effect === "add_minion") {
      mod.addMinion += (syn.effectValue || 0);
    }
  }
  return mod;
}
