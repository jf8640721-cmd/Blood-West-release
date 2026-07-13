/**
 * 血染钟楼：西游纪 — 角色主注册表
 * 共88个角色，分属4个阵营类别
 * 数据来源：docs/西游纪角色说明书.txt
 * v1.6.1: 按说明书补全12个缺失角色 + 修正4个归类（镇元子/元始天尊/万圣公主/孔雀公主→外来者）
 */

var ROLES = [
  // ============================================================
  // 村民 (townsfolk) — 善良阵营，49个
  // ============================================================
  {
    id: "tang_seng", name: "唐僧", category: "townsfolk",
    ability: "冥思：每晚打坐冥思，可感知自身左右两边邪恶玩家的数量",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 22, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "师徒四人",
    description: "唐僧通过冥思感知身边的邪恶气息，是村民阵营的信息核心之一。若与女儿国王邻座，两人皆全程晕眩，直至一人死亡。",
    tips: "注意唐僧-女儿国王邻座眩晕规则"
  },
  {
    id: "sun_wukong", name: "孙悟空", category: "townsfolk",
    ability: "金箍棒：每晚挥动金箍棒攻击一名玩家，其今夜晕眩，不可连续攻击同一玩家（若打到唐僧孙悟空死亡）",
    balanceTags: ["disruption","killing"],
    abilityType: "active", nightOrder: 3, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "师徒四人",
    description: "齐天大圣的金箍棒能令目标晕眩，但需注意不可连续攻击同一目标，且千万不能误伤唐僧。",
    tips: "提醒玩家：不可连续选择同一目标；打到唐僧则孙悟空立即死亡"
  },
  {
    id: "zhu_bajie", name: "猪八戒", category: "townsfolk",
    ability: "猪瘟：邪恶阵营技能选中猪八戒后染上猪瘟，导致次夜晕眩",
    balanceTags: [],
    abilityType: "passive", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "师徒四人",
    description: "猪八戒的猪瘟是被动反击能力——任何邪恶角色对他使用技能后，次夜自身会晕眩。与高翠兰有羁绊。",
    tips: "被动触发，主持需记录被感染的邪恶角色并在次夜通知其晕眩"
  },
  {
    id: "sha_seng", name: "沙僧", category: "townsfolk",
    ability: "流沙：每个白天选择两名玩家，得知昨夜醒来人数",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: null, firstNightOrder: null,
    needsChoice: true, targetCount: 2, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "师徒四人",
    description: "沙僧通过流沙感知昨夜有多少玩家被唤醒（被技能选中或发动技能），从而推断夜晚行动规模。",
    tips: "注意告知的是'醒来人数'，不是死亡人数"
  },
  {
    id: "taibai_jinxing", name: "太白金星", category: "townsfolk",
    ability: "冤大头：提名结束时，大声喊出\"我不入地狱谁入地狱！\"如被处决玩家为善良，你替其死亡，发动成功后可继续投票",
    balanceTags: ["protection","support"],
    abilityType: "triggered", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "太白金星可在处决前主动替死善良玩家，成功发动后仍可继续参与投票。",
    tips: "这是白天能力，在提名阶段结束时使用"
  },
  {
    id: "taiyi_zhenren", name: "太乙真人", category: "townsfolk",
    ability: "回梦游仙：全局一次，死亡次日早晨触发苍穹之轮倒转，回溯到前一天的早上（外来者+1）",
    outsiderModifier: 1,
    balanceTags: ["support"],
    abilityType: "triggered", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "太乙真人的苍穹之轮可倒转时空，死亡后触发，使游戏回到前一天早上状态，代价是增加一名外来者。",
    tips: "回溯时需恢复所有玩家状态到前一天；全局一次仅触发一次"
  },
  {
    id: "change", name: "嫦娥", category: "townsfolk",
    ability: "奔月：每晚飞向月宫，免疫当日的死亡技能。不可连续奔月；月神：全局一次，嫦娥奔月时可携带一名玩家",
    balanceTags: ["protection","support"],
    abilityType: "active", nightOrder: 4, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "嫦娥每晚可奔月免疫死亡技能，但不能连续使用。每局有一次机会携带一名同伴一起登月。",
    tips: "注意不可连续奔月的限制；携带玩家需消耗月神次数"
  },
  {
    id: "gao_cuilan", name: "高翠兰", category: "townsfolk",
    ability: "猪猪宝贝：高翠兰与猪八戒同时在场时，二人互知身份。猪八戒不死，高翠兰不会死亡（晕眩不可打断羁绊）",
    balanceTags: ["info","protection"],
    abilityType: "passive", nightOrder: null, firstNightOrder: 8,
    needsChoice: false, firstNightNeedsChoice: false, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: "猪猪宝贝",
    description: "高翠兰与猪八戒的羁绊使她获得死亡免疫——只要猪八戒活着，她就安全。二人开场互知身份。",
    tips: "告知双方彼此身份；猪八戒死亡后高翠兰的保护立即失效"
  },
  {
    id: "nver_guowang", name: "女儿国王", category: "townsfolk",
    ability: "威仪：首夜你会知道邪恶阵营的女性角色数；集权：每晚主动查验一名玩家所属阵营",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 35, firstNightOrder: 7,
    needsChoice: true, firstNightNeedsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "女儿国王首夜获知邪恶女性数量，之后每晚可主动查验一名玩家所属阵营。若与唐僧邻座，两人全程晕眩。",
    tips: "注意唐僧-女儿国王邻座眩晕规则；首夜无需选择目标（自动获知信息）"
  },
  {
    id: "donghai_longwang", name: "东海龙王", category: "townsfolk",
    ability: "布雨：全局一次，在白天大声喊出\"下雨啦！\"，今夜狂风暴雨，所有人晕眩，你庇护的一名玩家除外",
    balanceTags: ["disruption","protection"],
    abilityType: "once_per_game", nightOrder: null, firstNightOrder: null,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "东海龙王可呼风唤雨，全局一次令全场（除一名庇护者外）进入晕眩状态。",
    tips: "白天发动，当夜生效；主持需记录庇护的玩家"
  },
  {
    id: "taishang_laojun", name: "太上老君", category: "townsfolk",
    ability: "炼丹炉：每晚开炉炼丹，次晚随机炼成仙丹或毒丹可对他人使用，仙丹复活，毒丹晕眩（外来者+1）",
    outsiderModifier: 1,
    balanceTags: ["disruption","support"],
    abilityType: "active", nightOrder: 6, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "三清现世",
    description: "太上老君每晚炼药，次晚可使用——仙丹可复活死者，毒丹使目标晕眩。三清同时在场时获得一次死亡免疫。",
    tips: "炼药结果随机（主持决定或用硬币）；丹药在次晚使用"
  },
  {
    id: "erlang_shen", name: "二郎神", category: "townsfolk",
    ability: "天眼：每晚睁开第三只眼，可选择两名玩家，得知其中是否有恶魔，一名善良玩家是你的宿敌，会被误判为恶魔",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 23, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, targetCount: 2, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "二郎神的天眼可查验两名玩家中是否包含恶魔，但有一名善良宿敌会干扰结果被误判为恶魔。",
    tips: "宿敌由主持在开局时秘密指定一名善良玩家；告知二郎神'其中有/无恶魔'即可"
  },
  {
    id: "nezha", name: "哪吒", category: "townsfolk",
    ability: "莲花化身：首次死亡时，化身莲花重生（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["protection"],
    abilityType: "triggered", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "哪吒的莲花化身可使其首次死亡时立即重生，同时减少一名外来者。",
    tips: "死亡时触发，自动生效；注意外来者数量变化"
  },
  {
    id: "puti_zushi", name: "菩提祖师", category: "townsfolk",
    ability: "归元：全局一次，重置一名玩家的技能到初始状态；化墟：全局一次，可使一名死亡玩家使用一次技能（外来者+1）",
    outsiderModifier: 1,
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: 14, dayOrder: 14, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "菩提祖师拥有两项强大的全局一次能力：归元可重置技能，化墟可让死者再次行动。",
    tips: "两项能力各独立使用；化墟使用后外来者+1"
  },
  {
    id: "tuota_tianwang", name: "托塔天王", category: "townsfolk",
    ability: "雷峰塔：每晚可将一名玩家收入雷峰塔，其不会受到当夜发起的死亡技能，雷峰塔不能连续收入同一名玩家",
    balanceTags: ["protection"],
    abilityType: "active", nightOrder: 10, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "托塔天王每夜可庇护一名玩家免于死亡技能，但不能连续保护同一人。",
    tips: "不可连续选择同一玩家；仅免疫死亡技能，不免疫晕眩"
  },
  {
    id: "yuhuang_dadi", name: "玉皇大帝", category: "townsfolk",
    ability: "天帝：首夜化身任意村民。如该角色在场，他晕眩至你死亡",
    balanceTags: ["disruption"],
    abilityType: "active", nightOrder: null, firstNightOrder: 1,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "玉皇大帝在首夜选择化身成任意村民角色获得其能力，若该村民真实在场则被眩晕直至玉帝死亡。",
    tips: "主持需秘密告知玉帝其化身角色的能力；若目标在场则通知其晕眩"
  },
  {
    id: "wangmu_niangniang", name: "王母娘娘", category: "townsfolk",
    ability: "天后：每晚传唤两名善良角色，得知传唤成功的人数",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 21, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, targetCount: 2, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "王母娘娘每夜选择两名玩家传唤，得知其中有多少善良角色响应了传唤。",
    tips: "主持只告知传唤成功的善良角色数量（0/1/2）"
  },
  {
    id: "lishan_shengmu", name: "黎山圣母", category: "townsfolk",
    ability: "补天：首夜选择1-5名玩家，抛出五色神石，若其中同时有邪恶和善良阵营，你死后第三天早晨重生",
    balanceTags: [],
    abilityType: "active", nightOrder: null, firstNightOrder: 3,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "黎山圣母首夜标记多名玩家，若涵盖了善恶两阵营，则获得死后第三天重生的能力。",
    tips: "主持需记录五色神石标记的玩家；检查是否包含两种阵营"
  },
  {
    id: "zengzhang_tianwang", name: "增长天王", category: "townsfolk",
    ability: "正法：若你两侧的玩家不为同一阵营，你在处决时不会死亡",
    balanceTags: ["protection"],
    abilityType: "passive", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "增长天王的正法使他在两侧邻座玩家阵营不同时免疫处决。",
    tips: "主持需在处决前检查其两侧玩家阵营是否不同"
  },
  {
    id: "guangmu_tianwang", name: "广目天王", category: "townsfolk",
    ability: "看破：每晚可查看一名死者的真实角色（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 16, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "广目天王每夜可查验一名死者的真实身份，外来者因此减少一人。",
    tips: "告知死者真实角色；注意外来者-1"
  },
  {
    id: "duowen_tianwang", name: "多闻天王", category: "townsfolk",
    ability: "兼听：每晚撑开混元伞，随机得知一个被他人技能选择的号码",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 34, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "多闻天王撑开混元伞窃听夜晚行动，随机获知一个被他人技能选中的玩家号码。",
    tips: "主持随机选择一个当晚被任何技能选中的玩家号码告知"
  },
  {
    id: "chiguo_tianwang", name: "持国天王", category: "townsfolk",
    ability: "天音：每晚弹奏琵琶奏响梵乐，与你相邻的角色不会异常",
    balanceTags: ["protection"],
    abilityType: "active", nightOrder: 17, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "持国天王的梵乐庇护邻座玩家，使其不受异常状态（晕眩等）影响。",
    tips: "梵乐防止相邻玩家被晕眩或其他异常状态影响"
  },
  {
    id: "tang_taizong", name: "唐太宗", category: "townsfolk",
    ability: "圣旨：每个白天你可以颁布一份诏书，如诏书内容无误，当夜随机一名善良玩家死亡（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "唐太宗白天颁布诏书（猜测某事实），若猜对则当夜随机一名善良玩家死亡，外来者-1。",
    tips: "诏书内容由主持人判断对错；死亡目标是随机善良玩家"
  },
  {
    id: "juling_shen", name: "巨灵神", category: "townsfolk",
    ability: "神佑：首夜选择三个角色，排序靠前的在场角色死亡时由你承担",
    balanceTags: ["protection"],
    abilityType: "active", nightOrder: null, firstNightOrder: 2,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "巨灵神首夜守护三个角色，若其中在场者死亡，由巨灵神代为承受。",
    tips: "主持需记录三个守护角色及其排序；按顺序代人承受死亡"
  },
  {
    id: "pilanpo", name: "毗蓝婆", category: "townsfolk",
    ability: "洞察：首夜得知全场异常人数，每晚选择两名玩家进行查验",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 25, firstNightOrder: 7, firstNightBlocked: true,
    needsChoice: true, firstNightNeedsChoice: false, targetCount: 2, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "毗蓝婆首夜获知全场异常（邪恶+外来者+独立）人数，之后每晚可查验两名玩家。",
    tips: "首夜告知异常人数；每晚告知查验结果"
  },
  {
    id: "jiutian_xuannv", name: "九天玄女", category: "townsfolk",
    ability: "降世：每晚猜测一名邪恶角色得知是否在场，如果猜出全部在场邪恶角色且未发生错误，玄女翻牌",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 19, firstNightOrder: null,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "九天玄女每晚猜测一名邪恶角色是否在场，若全部猜对且无误，则公开翻牌确认。",
    tips: "主持每次告知是否在场；全部猜对时公开翻牌"
  },
  {
    id: "donghua_dijun", name: "东华帝君", category: "townsfolk",
    ability: "天帝律令：每双数夜晚选择一个号码，若其为村民则死亡，今夜不会再有其他死者",
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 8, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "东华帝君在双数夜晚执行天帝律令——选择号码，若是村民则死亡，且该夜无其他死者。",
    tips: "仅双数夜晚（第2/4/6/...夜）可用；若目标为村民则死且该夜仅此一人死亡"
  },
  {
    id: "jinding_daxian", name: "金顶大仙", category: "townsfolk",
    ability: "云霄锦衣：首夜，你将获得一名不在场爪牙的能力",
    balanceTags: [],
    abilityType: "active", nightOrder: null, firstNightOrder: 5,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "金顶大仙在首夜随机获得一个不在场的爪牙角色的能力。",
    tips: "主持随机选择一个不在场爪牙，告知其能力并允许金顶大仙使用"
  },
  {
    id: "randeng_gufo", name: "燃灯古佛", category: "townsfolk",
    ability: "过去未来：全局一次，在死去玩家的尸体上点燃琉璃灯，你死去时，其于次日早晨复活，若你复活，灯火熄灭，其再次死亡",
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: 18, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "燃灯古佛以自身生命为代价点燃琉璃灯，死后可复活被点灯的玩家。若燃灯复活则灯灭人亡。",
    tips: "全局一次选择一名死者点灯；燃灯死亡时灯亮的玩家复活"
  },
  {
    id: "rulai_fo", name: "如来佛", category: "townsfolk",
    ability: "金刚咒：如来免疫任何角色技能；众生平等：如来仅可被投票出局",
    balanceTags: ["protection"],
    abilityType: "passive", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: false, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "如来佛免疫所有角色技能，唯一被淘汰的途径是投票处决。",
    tips: "任何角色技能对如来无效（包括恶魔杀人、晕眩等）"
  },
  {
    id: "mile_fo", name: "弥勒佛", category: "townsfolk",
    ability: "哈哈哈：全局一次，若在夜晚死去，可选择一名替死鬼",
    balanceTags: ["protection"],
    abilityType: "triggered", nightOrder: null, firstNightOrder: null,
    needsChoice: true, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "弥勒佛全局一次可在夜晚死亡时选择他人代替自己死去。",
    tips: "仅在夜晚死亡时触发；选择一名玩家替死"
  },
  {
    id: "guanyin_pusa", name: "观音菩萨", category: "townsfolk",
    ability: "玉净瓶：每晚选择一名玩家播撒杨枝甘露，当夜免疫异常，如撒到爪牙其当夜晕眩，不可连续播撒同一人",
    balanceTags: ["disruption","protection"],
    abilityType: "active", nightOrder: 1, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "观音菩萨的杨枝甘露可庇护善良玩家免疫异常，但若选中爪牙则使其晕眩。不可连续庇护同一人。",
    tips: "不可连续选择同一玩家；选中爪牙时通知其晕眩"
  },
  {
    id: "huoshen_zhurong", name: "火神祝融", category: "townsfolk",
    ability: "宿命：每晚从说书人处获取信息，一条正确，一条错误",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 24, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "火神祝融每晚获得两条信息——一条真实、一条虚假，需要自行甄别。",
    tips: "主持准备两条信息（一真一假），不告知哪条是真"
  },
  {
    id: "nanji_xianweng", name: "南极仙翁", category: "townsfolk",
    ability: "灵芝仙草：全局一次，可用灵芝仙草复活当夜的随机一名死者",
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: 32, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "南极仙翁可用灵芝仙草复活当夜随机一名死者，全程仅一次机会。",
    tips: "主持随机选择当夜一名死者复活"
  },
  {
    id: "lingji_pusa", name: "灵吉菩萨", category: "townsfolk",
    ability: "轮回：全局一次，公开宣布发动技能，并暗自选择1名死亡玩家，唤醒其灵魂，其每隔一日可正常使用一次技能",
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: null, firstNightOrder: null,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "灵吉菩萨可唤醒一名死者灵魂使其每隔一天能使用一次技能，但不能完全复活。",
    tips: "公开宣布发动；秘密选择目标；死者每隔一日可用一次技能"
  },
  {
    id: "dizang_pusa", name: "地藏菩萨", category: "townsfolk",
    ability: "彼岸花：全局一次，白天在死去玩家上种植彼岸花，当夜获得其技能。若该玩家复活，彼岸花凋谢，技能失效",
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: 15, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "地藏菩萨种下彼岸花后获得死者技能，但若该玩家复活则失去。",
    tips: "选择死者种植；当夜获得其技能使用；玩家复活时技能失效"
  },
  {
    id: "puxian_pusa", name: "普贤菩萨", category: "townsfolk",
    ability: "踏歌行：每个白天歌唱并私聊说书人歌名，如果两侧玩家都猜对，晚上获得一条不受晕眩干扰的信息，逢3倍数的夜晚获得重要信息",
    balanceTags: ["disruption","info"],
    abilityType: "active", nightOrder: 20, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "普贤菩萨通过歌唱与两侧玩家互动，若他们猜对歌名则在夜晚获得可靠信息，3倍夜信息更关键。",
    tips: "白天互动；两侧都猜对才触发；3/6/9...夜信息更重要"
  },
  {
    id: "wenshu_pusa", name: "文殊菩萨", category: "townsfolk",
    ability: "穿魂：每晚向一名玩家吟诵梵音，若其为恶魔，你与他交换身份及阵营，并将其晕眩二个夜晚后才得知此信息",
    balanceTags: ["disruption","support"],
    abilityType: "active", nightOrder: 7, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "文殊菩萨每晚对一名玩家吟诵梵音，若选中恶魔则交换身份阵营，对方被晕眩两晚后才知情。",
    tips: "若选中恶魔，主持需秘密通知双方交换阵营；恶魔两晚后才得知被交换"
  },
  {
    id: "maori_xingguan", name: "昴日星官", category: "townsfolk",
    ability: "极昼：每晚引导日轮照亮亡者之路，得知昨日被处决玩家的两侧是否有邪恶角色",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 38, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "昴日星官每夜查验昨日处决玩家两侧座位是否有邪恶角色。",
    tips: "若昨日无处决则无信息；告知处决者两侧座位是否有邪恶"
  },
  {
    id: "chijiao_daxian", name: "赤脚大仙", category: "townsfolk",
    ability: "云游：每晚可主动习得上个死于处决的善良玩家的能力1日",
    balanceTags: [],
    abilityType: "active", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "赤脚大仙每夜可以学习上一个被处决的善良玩家的能力，使用一天后失效。",
    tips: "告知其获得的能力；仅持续一天"
  },
  {
    id: "chen_guangrui", name: "陈光蕊", category: "townsfolk",
    ability: "苦难：恶魔技能对你无效，你替两侧玩家承受恶魔的技能",
    balanceTags: ["protection"],
    abilityType: "passive", nightOrder: 9, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "陈光蕊免疫恶魔技能，但会替两侧邻座玩家承受恶魔的技能效果。",
    tips: "恶魔技能对陈光蕊无效；两侧玩家被恶魔选中时代为承受"
  },
  {
    id: "jiang_ziya", name: "姜子牙", category: "townsfolk",
    ability: "封神：全局一次，在夜晚对一名玩家发动技能，若其为白板角色随机转变为同阵营的不在场角色；打神鞭：全局一次，在夜晚对一名玩家发动技能，若其为爪牙则永久失去技能",
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: 26, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "姜子牙手握封神榜和打神鞭——封神可将白板转变为同阵营不在场角色，打神鞭可永久废掉爪牙技能。两项能力各独立使用。",
    tips: "封神：选择白板角色→转变；打神鞭：选择爪牙→永久失去技能；两项全局一次独立使用"
  },
  {
    id: "bai_she", name: "白蛇", category: "townsfolk",
    ability: "化蛇：全局一次，在白天饮下雄黄酒现出原形，直到次日黄昏，你所受到的所有技能效果都将反噬施术者",
    balanceTags: [],
    abilityType: "once_per_game", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "白蛇饮下雄黄酒现出原形后，所有对她使用的技能效果会反弹给施术者，持续到次日黄昏。",
    tips: "白天发动；效果持续到次日黄昏；所有技能效果（包括查验/杀死/晕眩等）均反噬"
  },
  {
    id: "xu_xian", name: "许仙", category: "townsfolk",
    ability: "渡情：首夜选择一名玩家共结连理，各自获得免疫一次死亡的护盾，如果其中一人死去，另一人也会殉情",
    balanceTags: ["protection"],
    abilityType: "active", nightOrder: null, firstNightOrder: 8,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "许仙在首夜与一名玩家结为连理，双方各获一次免死护盾。但若一方死亡，另一方殉情。",
    tips: "双方各获一次死亡免疫护盾（独立使用）；任一方死亡→另一方立即殉情"
  },
  {
    id: "fa_hai", name: "法海", category: "townsfolk",
    ability: "大威天龙：全局一次，召唤天龙攻击一名玩家，若其为恶魔则直接死亡；大罗法咒：全局一次，向一名玩家吟诵法咒，若其为爪牙则直接死亡。两个技能仅择一使用，发动时需公开宣布，若选择目标为明牌状态则技能发动无效",
    balanceTags: ["killing"],
    abilityType: "once_per_game", nightOrder: 27, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "法海拥有大威天龙（杀恶魔）和大罗法咒（杀爪牙），二选一使用。必须公开宣布发动，对明牌角色无效。",
    tips: "二选一使用；必须公开宣布；目标若为明牌状态（已公开身份）则无效；全局仅一次"
  },
  {
    id: "ning_caichen", name: "宁采臣", category: "townsfolk",
    ability: "笔墨：全局一次，在白天选择两名玩家，当夜他们的号码将被交换；丹青：全局一次，在夜晚选择两名玩家，白天他们的号码将被交换",
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: 28, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, targetCount: 2, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "宁采臣以笔墨丹青之术交换玩家号码——笔墨白天选人当夜交换，丹青夜晚选人白天交换。两项独立使用。",
    tips: "笔墨：白天选择两名玩家→当夜号码互换；丹青：夜晚选择→白天号码互换；各自独立使用"
  },
  {
    id: "nvwa", name: "女娲", category: "townsfolk",
    ability: "造化敕令：首夜选择一个角色进行庇护，获得免疫一次死亡的能量护盾。护盾破碎后第三天将刷新重置；传承之火：若你死于处决，当夜离你最近的随机一名死亡善良玩家将转世重生为同阵营的不在场角色；离你最远的一名玩家将在第三个夜晚感到灼热（无论你是否存活）",
    outsiderModifier: 1,
    balanceTags: ["protection","support"],
    abilityType: "active", nightOrder: null, firstNightOrder: 4, firstNightBlocked: false,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "女娲首夜选择一个角色以造化敕令庇护，获得免疫一次死亡的护盾，破碎后第3天刷新。死于处决时传承之火触发：最近死亡善良角色转世+最远玩家灼热。",
    tips: "首夜选择一个角色（非玩家）庇护→护盾免疫一次死亡→破碎后第3天刷新；死于处决→最近死亡善良转世+最远玩家第3夜灼热"
  },
  {
    id: "pangu", name: "盘古", category: "townsfolk",
    ability: "天地聚合：盘古死亡当夜，可选择四名玩家强制重抽角色卡牌，盘古将得知其中一张；混淹浩劫：全局一次，使用盘古斧击杀一名玩家，若目标为邪恶角色且因此死亡，与其最近的一名善良玩家将被波及死亡",
    outsiderModifier: 1,
    balanceTags: ["info","killing"],
    abilityType: "once_per_game", nightOrder: 33, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "盘古死亡当夜可强制四名玩家重抽角色（得知其中一张）；混淹浩劫可斩杀邪恶并波及邻近善良。两项技能均为一次性，需主持确认。",
    tips: "死亡当夜：天地聚合→选四名玩家重抽→盘古得知其中一张；全局一次：混淹浩劫→选一名玩家→若为邪恶死亡→最近善良波及死"
  },
  {
    id: "shennong", name: "神农", category: "townsfolk",
    ability: "洗练神鼎：全局一次，在夜晚选择两名你认为的邪恶玩家并猜测其角色，若全对，其一将转为善良阵营；青鸢延苓：全局一次，由你提名并致死的首个善良玩家将在死后第三个早晨复活",
    outsiderModifier: 1,
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: 31, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "神农拥有洗练神鼎（夜晚猜两名邪恶角色→全对则其一转善良）和青鸢延苓（提名致死的首个善良玩家在死后第3个早晨复活），两项各全局一次。",
    tips: "洗练神鼎：选两名玩家+猜角色→全对则其一转善良；青鸢延苓：神农提名致死首个善良→第3个早晨复活"
  },

  // ============================================================
  // 外来者 (outsider) — 善良阵营但能力有害，10个
  // ============================================================
  {
    id: "tieshan_gongzhu", name: "铁扇公主", category: "outsider",
    ability: "恶魔家属：你被视作邪恶阵营，因此爪牙的技能对你无效",
    balanceTags: [],
    abilityType: "passive", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "铁扇公主虽为善良但被所有效果视为邪恶阵营，这使她免疫爪牙技能但也容易被善良角色误伤。",
    tips: "查验、技能效果均将铁扇公主视为邪恶阵营"
  },
  {
    id: "bailong_ma", name: "白龙马", category: "outsider",
    ability: "龙珠：龙珠光茫耀眼，与你相邻的玩家每逢双数夜晚晕眩",
    balanceTags: ["disruption"],
    abilityType: "passive", nightOrder: 2, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "白龙马的龙珠在双数夜晚发出耀眼光芒，使邻座玩家晕眩——对善良阵营是个麻烦。",
    tips: "第2/4/6/...夜自动触发；相邻两玩家晕眩"
  },
  {
    id: "tianming_ren", name: "天命人", category: "outsider",
    ability: "碍事：从异世界穿越而来的诡异玩家，没啥卵用。但如果被投票处决，导致游戏结束，邪恶阵营直接获胜",
    balanceTags: [],
    abilityType: "passive", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "天命人无用但危险——若因他的处决导致游戏结束（善良失败条件达成），邪恶直接获胜。",
    tips: "若处决天命人后善良人数≤邪恶人数，邪恶立即获胜"
  },
  {
    id: "zhenyuan_zi", name: "镇元子", category: "outsider",
    ability: "授道：每晚向一名玩家发出风火雷电任一元素，若他选择相同元素则加入你的教派，恶魔除外。四个教徒入教后你们单独获胜",
    balanceTags: [],
    abilityType: "active", nightOrder: 13, firstNightOrder: null,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "镇元子以风火雷电四种元素招收教徒入教，集齐四人则独立获胜。恶魔不可被教化。",
    tips: "主持需告知被选中玩家元素类型并询问其选择；记录教徒数量；4人即独立获胜"
  },
  {
    id: "yuanshi_tianzun", name: "元始天尊", category: "outsider",
    ability: "混沌：技能选择你或者提名你的角色次夜将随机变为同阵营的其它角色（每人限1次），若有玩家透露你的身份则立即被处决",
    balanceTags: ["disruption"],
    abilityType: "passive", nightOrder: 12, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "三清现世",
    description: "元始天尊的混沌之力使针对他的角色随机转变，透露其身份者立即处决。三清同时在场时获得一次死亡免疫。",
    tips: "有人透露元始天尊身份时立即处决；技能选中他的角色次夜转变"
  },
  {
    id: "wansheng_gongzhu", name: "万圣公主", category: "outsider",
    ability: "龙裔：你死亡后的当夜选择一名玩家，若他是村民继承你的角色",
    balanceTags: [],
    abilityType: "triggered", nightOrder: 29, firstNightOrder: null,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "万圣公主死亡后可将自己的角色传承给一名村民玩家。",
    tips: "死亡当夜选择一名玩家；若为村民则获得万圣公主角色能力"
  },
  {
    id: "liuer_mihou", name: "六耳猕猴", category: "outsider",
    ability: "分身：你以为你是某位村民，但你的技能不会生效",
    balanceTags: [],
    abilityType: "passive", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "六耳猕猴以为自己是村民并获得能力，但实际上技能不会产生任何效果——他只是一只猴子。",
    tips: "告诉六耳猕猴他是某个村民（随机选），但所有技能发动时实际无效"
  },
  {
    id: "kongque_gongzhu", name: "孔雀公主", category: "outsider",
    ability: "恶魔代言人：异乡人+6/玩家数，本场无邪恶角色，说书人是恶魔，你是他队友。第五个白天结束未处决说书人，善良阵营落败",
    balanceTags: [],
    abilityType: "passive", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "孔雀公主改变游戏规则——本局无邪恶角色，说书人成为隐藏恶魔，若第五天仍未处决说书人则善良失败。",
    tips: "全场无邪恶角色（除孔雀公主）；说书人是隐藏恶魔；第五天是deadline"
  },
  {
    id: "qing_she", name: "青蛇", category: "outsider",
    ability: "练气：每晚选择一名玩家施放技能，由于道行不够，单数夜晚随机善良阵营技能生效，双数夜晚随机邪恶阵营生效",
    balanceTags: [],
    abilityType: "active", nightOrder: 30, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "青蛇道行尚浅，每晚对一名玩家施放随机技能——单数夜随机善良技能，双数夜随机邪恶技能，效果不可控。",
    tips: "主持从对应阵营技能池中随机选取；单数夜选善良技能，双数夜选邪恶技能"
  },
  {
    id: "nie_xiaoqian", name: "聂小倩", category: "outsider",
    ability: "怨魂日行：全局一次，在白天私聊说书人发起日行，这个白天，只有你和死者可以提名和投票，随后你在处决阶段死亡",
    balanceTags: ["support"],
    abilityType: "once_per_game", nightOrder: null, firstNightOrder: null,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "聂小倩的怨魂日行可劫持整个白天的提名和投票权——只有她和死者可以参与，但之后她会在处决阶段死亡。",
    tips: "全局一次；发动后当天只有聂小倩+死者可提名投票；处决阶段聂小倩自动死亡"
  },

  // ============================================================
  // 爪牙 (minion) — 邪恶帮手，17个
  // ============================================================
  {
    id: "pipa_jing", name: "琵琶精", category: "minion",
    ability: "阴乐：每晚弹奏琵琶奏响阴乐，选择一名玩家晕眩",
    balanceTags: ["disruption"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "琵琶精的阴乐每晚可令一名玩家陷入晕眩，干扰其能力发挥。",
    tips: "选择一名玩家晕眩到次夜"
  },
  {
    id: "heibai_wuchang", name: "黑白无常", category: "minion",
    ability: "接引：全局（6/玩家数）次，唤起一名死者成为傀儡，持续晕眩且不计入存活玩家数量，并可代为承受一次死亡",
    balanceTags: ["disruption","killing"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "黑白无常可多次唤起死者作傀儡——傀儡不计入存活人数，可代为承受死亡。",
    tips: "使用次数=6/玩家数（向下取整）；傀儡晕眩且不计存活"
  },
  {
    id: "heixiong_jing", name: "黑熊精", category: "minion",
    ability: "锦镧袈裟：每晚，你披上锦镧袈裟伪装成说书人，向任意一名玩家发送一条信息（不可发送场外信息）",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "黑熊精每夜伪装说书人向任意玩家发送虚假信息，混淆视听。",
    tips: "信息内容由黑熊精指定，主持代为传达；不可发送场外信息"
  },
  {
    id: "zhizhu_jing", name: "蜘蛛精", category: "minion",
    ability: "冰魄蛛丝：每晚选择1名玩家，次日发起提名无效；迷魂阵：全局一次，敌对阵营提名无效（外来者+1）",
    outsiderModifier: 1,
    balanceTags: ["disruption"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "蜘蛛精用冰魄蛛丝每晚瘫痪一名玩家的提名权，全局还有一次迷魂阵让敌对阵营全部提名无效。",
    tips: "冰魄蛛丝：选择玩家→次日其提名无效；迷魂阵：全局一次，全体敌方提名无效"
  },
  {
    id: "huli_jing", name: "狐狸精", category: "minion",
    ability: "魅惑：首夜魅惑一名玩家，会被认作邪恶阵营；诱惑：每晚诱惑说书人透露一名角色的身份",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4, firstNightBlocked: true,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "狐狸精首夜栽赃一名善良玩家使其被查验时显示邪恶，之后每晚可诱惑说书人泄露角色信息。",
    tips: "被魅惑玩家查验结果显示邪恶；每晚获知一名角色身份"
  },
  {
    id: "huangfeng_guai", name: "黄风怪", category: "minion",
    ability: "三昧神风：全局一次，早晨发动狂沙席卷到深夜，所有人晕眩，邪恶阵营除外。黄风怪死后也可发动技能",
    balanceTags: ["disruption"],
    abilityType: "once_per_game", nightOrder: null, firstNightOrder: 4,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "黄风怪的三昧神风是强力AOE——全局一次令全体善良玩家晕眩整日，死后仍可发动。",
    tips: "全局一次；早晨发动持续到深夜；邪恶阵营免疫；死后也可发动"
  },
  {
    id: "qingshi_jing", name: "青狮精", category: "minion",
    ability: "睚眦：提名过你的善良玩家将在隔夜死亡；负隅：若在处决前公开身份，将获得一次死亡豁免",
    balanceTags: ["killing","protection"],
    abilityType: "passive", nightOrder: null, firstNightOrder: 4,
    needsChoice: false, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "青狮精的报复——提名过他的善良玩家隔夜必死。公开身份可获得一次死亡豁免。",
    tips: "记录所有提名过青狮精的善良玩家；隔夜自动死亡；公开身份=一次免死"
  },
  {
    id: "jinjiao_dawang", name: "金角大王", category: "minion",
    ability: "金葫芦：首夜选择一名玩家，若发起提名，则会立即死亡；捆仙绳：每晚选择一名玩家，白天不会被处决，不可连续选择同一玩家（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "金角大王有金葫芦（首夜标记即死提名陷阱）和捆仙绳（每夜庇护邪恶玩家免于处决）。",
    tips: "金葫芦标记的玩家发起提名则立即死；捆仙绳不可连续用同一人"
  },
  {
    id: "yinjiao_dawang", name: "银角大王", category: "minion",
    ability: "银葫芦：每晚对一名玩家释放风火雷电任一标记，若其猜中，爆炸致死，若连续四枚标记都未触发，次夜强制命中",
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "银角大王每晚释放元素标记让目标猜，猜中即死。连续四枚未命中则补一发必中。",
    tips: "玩家需猜中你放的元素类型；四连空后强制命中"
  },
  {
    id: "shuishen_gonggong", name: "水神共工", category: "minion",
    ability: "宿敌：首夜，选择一名玩家建立生命链接，在他死亡之前你不会死亡，你死亡后可持续投票",
    balanceTags: ["protection"],
    abilityType: "active", nightOrder: null, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: true,
    inheritsDemon: true, teamSynergy: null,
    description: "水神共工与一名玩家建立生命链接获得不死之身，即使死亡也能继续投票。",
    tips: "首夜选择链接目标；目标存活时共工不死；死后仍可投票"
  },
  {
    id: "dujiao_si", name: "独角兕", category: "minion",
    ability: "金刚琢：每单数夜晚向一名玩家发出风火雷电任一元素，如果他选择和你不同，将永久失去技能，太上老君除外",
    balanceTags: ["disruption"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "独角兕的金刚琢在单数夜可永久剥夺选错元素的玩家的技能（太上老君免疫）。",
    tips: "仅单数夜可用（第1/3/5...夜）；太上老君免疫此效果"
  },
  {
    id: "yutu_jing", name: "玉兔精", category: "minion",
    ability: "结亲：首夜选择一名玩家结亲。该玩家必须全程扮演玉兔精指定的角色，如果表现不够坚定，处决入夜；冥婚：玉兔精若被处决，可强行处决一名玩家陪葬",
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: null, firstNightOrder: 4,
    needsChoice: true, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "玉兔精强迫一名玩家扮演指定角色，不坚定则被处决。若玉兔精被处决可拉人陪葬。",
    tips: "首夜指定结亲目标和扮演角色；主持监督扮演质量；冥婚：被处决时选择陪葬者"
  },
  {
    id: "liyu_jing", name: "鲤鱼精", category: "minion",
    ability: "莲台泡影：当你获得说书人给予的衣服时，确认选择一件，可幻化做该角色并获得对应技能",
    balanceTags: [],
    abilityType: "active", nightOrder: null, firstNightOrder: 4,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "鲤鱼精可变身为其他角色并获得其技能，是最灵活的爪牙。",
    tips: "从说书人提供的角色中选择一件'衣服'（幻化目标），获得该角色技能"
  },
  {
    id: "daji", name: "妲己", category: "minion",
    ability: "夺心：首夜选择一名玩家，接管说书人与其的对话。该玩家死亡的当夜，你可以更换目标",
    balanceTags: ["info"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "妲己在首夜夺心一名玩家，接管主持人与该玩家的所有私下沟通，该玩家死后可更换目标继续。",
    tips: "主持不再直接与该玩家私下沟通，所有信息由妲己代为转达；目标死亡当夜可更换"
  },
  {
    id: "shen_gongbao", name: "申公豹", category: "minion",
    ability: "开天珠：每个单数夜晚，使用开天珠唤醒一名邪恶亡魂，当夜可以使用技能",
    balanceTags: ["support"],
    abilityType: "active", nightOrder: 5, firstNightOrder: 4,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "申公豹在单数夜用开天珠唤醒一名已死亡的邪恶玩家，使其当夜可使用一项技能。",
    tips: "仅单数夜可用；选择一名已死亡的邪恶玩家；该玩家当夜可使用自身技能一次"
  },
  {
    id: "qiannian_shuyao", name: "千年树妖", category: "minion",
    ability: "极度魔界：首夜向三名玩家发送魔界标记，任一标记玩家死亡，存活标记玩家之一将被秘密转换为另一名随机恶魔，并与树妖结识。树妖无法入群（外来者-1）；若被转换的玩家是邪恶阵营，则树妖入群且随机转换为一个不在场的爪牙",
    outsiderModifier: -1,
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: null, firstNightOrder: 4,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: true, teamSynergy: null,
    description: "千年树妖首夜标记三名玩家——一旦有标记玩家死亡，另一存活标记者被秘密转为恶魔并与树妖结识。若被转者为邪恶则树妖入群转爪牙。",
    tips: "首夜标记三名玩家；任一标记死亡→存活标记之一秘密转恶魔；被转者若原为邪恶→树妖入群转爪牙；树妖初始不在邪恶群"
  },
  {
    id: "xingtian", name: "刑天", category: "minion",
    ability: "不灭煞气：每晚猜测两名非明牌玩家的角色，如果全对，煞气随机杀死其中一名玩家。如果全错，刑天将被煞气杀死（当场上积聚煞气过重，刑天可能在非点将情况下登场）",
    outsiderModifier: -1,
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 5, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "刑天每晚猜测两名非明牌玩家的角色——全对则随机杀其之一，全错则刑天被煞气反噬死亡。刑天可能在非点将情况下因煞气过重登场。",
    tips: "每晚猜两名非明牌玩家的角色；全对→随机杀其一；全错→刑天死亡；煞气积聚时刑天可能强行登场"
  },

  // ============================================================
  // 恶魔 (demon) — 邪恶核心，12个
  // ============================================================
  {
    id: "baigu_jing", name: "白骨精", category: "demon",
    ability: "夺魄：每晚选择一名玩家杀死，他会得知你的身份；还魂：白骨精有三条命，第三次死亡时才会真正死亡；骨幡：竖起骨幡，当天被处决者可选一名玩家替死，骨幡可用次数|6/玩家数（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["killing","protection"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "白骨精堪称最强恶魔：三条命、每晚杀人、被杀者得知其身份、骨幡可替死。但被爪牙继承时仅一条命。",
    tips: "三条命追踪；死者得知白骨精身份；骨幡次数=6/玩家数；被爪牙继承仅一条命"
  },
  {
    id: "jiutou_chong", name: "九头虫", category: "demon",
    ability: "蛊毒：每晚选择一名玩家下蛊，当夜晕眩，次夜死亡；夺舍：全局一次，在白天处决前公开宣布自己是九头虫，当场处决入夜，前一晚被下蛊的玩家成为新的九头虫。善良玩家不足四人时不可再夺舍（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["disruption","killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "九头虫的下蛊延迟一天致死，独有的夺舍能力可将恶魔身份传给被下蛊玩家（善良≥4人时可用）。",
    tips: "下蛊：当夜晕眩+次夜死亡；夺舍：白天公开宣布→被处决→被下蛊者成为新恶魔"
  },
  {
    id: "niumo_wang", name: "牛魔王", category: "demon",
    ability: "狂暴：每晚选择一名玩家杀死，逢2倍数的夜晚多杀一人；肉盾：牛魔王的爪牙首次死亡可获得一次豁免（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["killing","protection"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "牛魔父子",
    description: "牛魔王在双数夜可杀两人，且其爪牙首次死亡获得豁免。与红孩儿极少同时登场。",
    tips: "第2/4/6...夜多杀一人；爪牙首次死亡豁免一次；牛魔王+红孩儿极低概率同时登场"
  },
  {
    id: "shijia", name: "释迦", category: "demon",
    ability: "超度：说书人宣布天亮后，每个早晨，公开超度一名玩家；金刚咒：释迦免疫/无视任何角色技能；众生有别：释迦无法被投票出局；狂热信徒：失去所有爪牙信徒的释迦仅剩超度技能生效",
    balanceTags: ["protection"],
    abilityType: "active", nightOrder: null, firstNightOrder: 6,
    needsChoice: true, isDizzyable: false, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "释迦是近乎无敌的恶魔——免疫技能、不能被投票出局、每天早晨超度一名玩家。但失去所有爪牙后只剩超度。",
    tips: "免疫所有技能（如如来佛）；无法被投票处决；早晨超度自动触发；爪牙全死后大幅削弱"
  },
  {
    id: "jinchi_dapeng", name: "金翅大鹏", category: "demon",
    ability: "业报：每晚选择一名玩家猎食；涅槃：首次死亡进入假死状态，第3夜最近的善良玩家感到灼热；上清仙光：每晚选择一名玩家杀死，并可指定其收到的死亡信息；混元真气：每晚发动，被查验时，邪恶阵营被视作善良角色。不可连续发动",
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "金翅大鹏每晚杀两人（业报+上清仙光），首次死亡假死，可混淆查验结果。",
    tips: "业报+上清仙光每晚各杀一人；假死状态持续；混元真气不可连续发动"
  },
  {
    id: "diyong_furen", name: "地涌夫人", category: "demon",
    ability: "瘟疫：每晚选择一名玩家，其得知被鼠群吞噬而死；隐匿：首次死亡时不会真正死去，可隐匿到场上任意被鼠群吞噬的尸体中，其被处决才会真正死亡（外来者-1）",
    outsiderModifier: -1,
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: true,
    inheritsDemon: false, teamSynergy: null,
    description: "地涌夫人每晚用鼠群杀人，首次死亡可隐匿到任何被鼠群吞噬的尸体中，需该尸体被处决才真死。",
    tips: "追踪被鼠群吞噬的死者列表；首次死亡时选择隐匿尸体；隐匿尸体被处决才真死"
  },
  {
    id: "honghaier", name: "红孩儿", category: "demon",
    ability: "邪火：每晚选择一名玩家杀死；三昧真火：首夜随机得知三个登场角色（信息位优先），选择其一被三昧真火焚烧，全程晕眩。离三昧真火最远的善良玩家在第三个夜晚感受到灼热（外来者+1）",
    outsiderModifier: 1,
    balanceTags: ["disruption","killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: 6, firstNightBlocked: true,
    needsChoice: true, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "牛魔父子",
    description: "红孩儿每晚杀人，首夜获知三个在场角色并可焚烧一人使其全程晕眩。第三夜最远善良玩家感知灼热。",
    tips: "首夜告知三个在场角色；被焚烧者全程晕眩；灼热位置=离红孩儿座位最远的善良玩家"
  },
  {
    id: "yanwang", name: "阎王", category: "demon",
    ability: "生死簿：阎王首夜按任意长度及顺序的号码编写生死簿，每晚发动，按顺序终结寿命，如遇到已死亡的号码则跳过。生死簿执行完毕后，阎王每晚决定第二天追加的处决号码；死神：身为神明，阎王被查验时不会被判定为邪恶阵营",
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: 6, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "阎王首夜编写死亡名单，之后按名单顺序杀人。名单用完后每晚追加处决。查验时不被判为邪恶。",
    tips: "首夜编写生死簿（有序号码列表）；按顺序杀；跳过已死者；执行完毕后每晚追加处决"
  },
  {
    id: "huangmei_laozu", name: "黄眉老祖", category: "demon",
    ability: "妖王：每晚选择一名玩家杀死；妖印·阴：若出现平安夜，次夜妖王技能额外触发一次；妖印·阳：若出现平安日，当夜妖王技能额外触发一次",
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "黄眉老祖的妖印机制使其在平安夜/平安日后获得额外杀人机会，连锁累积。",
    tips: "平安夜→次夜额外杀一人；平安日→当夜额外杀一人；可叠加触发"
  },
  {
    id: "tongtian_jiaozhu", name: "通天教主", category: "demon",
    ability: "上清仙光：每晚选择一名玩家杀死，并可指定其收到的死亡信息；混元真气：每晚发动，被查验时，邪恶阵营被视作善良角色。不可连续发动",
    balanceTags: ["info","killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: "三清现世",
    description: "通天教主每晚以上清仙光杀人并指定死亡信息，混元真气可混淆查验结果。三清同时在场时获得一次死亡免疫。",
    tips: "上清仙光每晚杀一人+自定义死亡信息；混元真气不可连续发动；三清羁绊=一次免死"
  },
  {
    id: "zhou_wang", name: "纣王", category: "demon",
    ability: "暴虐：每晚选择一名玩家杀死，并向其发送风火雷电任一元素，若选择与你不同，则死后尸体化为血骸；血骸：血骸隔夜爆发，炸死两侧的玩家，纣王免疫血骸伤害，善良阵营人数不足四人时，血骸无法再触发",
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: null, firstNightBlocked: true,
    needsChoice: true, isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "纣王每晚杀人并强制目标猜元素——猜错则尸体化为血骸，隔夜爆发炸死两侧玩家。善良不足4人时血骸失效。",
    tips: "每晚杀一名玩家+发元素标记；目标选错→尸体化血骸→隔夜炸死两侧；纣王免疫血骸；善良<4人时血骸不触发"
  },
  {
    id: "heishan_laoyao", name: "黑山老妖", category: "demon",
    ability: "地府噩梦：每晚向（夜晚数+1）名玩家发送风火雷电任一元素，若与你选择不同，将被拖入噩梦死亡（外来者-1）；在死亡人数大于2的次夜，黑山老妖休息一晚并重置技能",
    outsiderModifier: -1,
    balanceTags: ["killing"],
    abilityType: "active", nightOrder: 11, firstNightOrder: 6,
    needsChoice: false, choiceType: "text", isDizzyable: true, deathImmune: false,
    inheritsDemon: false, teamSynergy: null,
    description: "黑山老妖每晚向递增数量的玩家发元素标记，选错即拖入噩梦死亡。累计死亡>2后次夜休息并重置计数。",
    tips: "每晚目标数=夜晚数+1（第1夜2人/第2夜3人...）；选错者死亡；累计死亡>2→次夜休息→计数器重置"
  }
];

// 索引：按 id 快速查找角色
var ROLES_BY_ID = {};
ROLES.forEach(function(r) { ROLES_BY_ID[r.id] = r; });

// ============================================================
// v3.0.61: 多技能解析工具
// ============================================================

/**
 * 解析角色的 ability 字符串为子技能对象数组
 * 输入："归元：全局一次，重置一名玩家的技能到初始状态；化墟：全局一次，可使一名死亡玩家使用一次技能"
 * 输出：[{name:"归元", description:"全局一次，重置一名玩家的技能到初始状态"}, {name:"化墟", description:"..."]]
 * 单技能角色返回单元素数组，无 ability 返回 [{name:'', description:''}]
 */
function parseSubSkills(abilityStr) {
    if (!abilityStr) return [{ name: '', description: '', isOncePerGame: false }];
    // 按中文/英文分号分割
    var parts = abilityStr.split(/[；;]/);
    return parts.map(function(part) {
        var trimmed = part.trim();
        if (!trimmed) return null;
        // 按第一个中文/英文冒号分割 name: description
        var colonMatch = trimmed.match(/^([^：:]+)[：:](.*)$/);
        if (colonMatch) {
            var desc = colonMatch[2].trim();
            return {
                name: colonMatch[1].trim(),
                description: desc,
                isOncePerGame: /^全局一次/.test(desc)  // v3.0.64: 标记是否全局一次
            };
        }
        // 无冒号回退：整段作为 name
        var rawName = trimmed.substring(0, 10);
        return { name: rawName, description: trimmed, isOncePerGame: false };
    }).filter(Boolean);
}

/**
 * 检查角色是否有多个子技能
 */
function hasMultipleSkills(roleObj) {
    if (!roleObj || !roleObj.ability) return false;
    return parseSubSkills(roleObj.ability).length > 1;
}

/**
 * 根据索引获取子技能名
 */
function getSubSkillName(roleObj, index) {
    if (!roleObj || !roleObj.ability) return null;
    var skills = parseSubSkills(roleObj.ability);
    if (index != null && index >= 0 && index < skills.length) {
        return skills[index].name;
    }
    return null;
}

// 西游纪角色数据加载完成（共 88 个角色）
