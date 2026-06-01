# 版本日志

## v1.8.4 (2026-06-01)

### 新增首夜技能封锁规则（`*` 标记）

角色说明书中 `每晚*`、`全局一次*` 表示该技能**首夜/首日无法发动**。此前该规则未在代码中体现，现已实现：

- **新增字段** `firstNightBlocked` 到角色数据（`admin/data/roles.js` + `miniprogram/utils/roles.js`）
- **21个角色**标记为 `firstNightBlocked: true`：
  - `每晚*`：孙悟空、嫦娥、太上老君、二郎神、托塔天王、王母娘娘、广目天王、毗蓝婆、观音菩萨、文殊菩萨、昴日星官、青蛇、狐狸精、金角大王
  - `全局一次*`：菩提祖师、姜子牙、法海、宁采臣、燃灯古佛、地藏菩萨
  - `每双数夜晚`（首夜=第1夜无法发动）：东华帝君
- **队列生成** `generateNightQueue()` 首夜过滤 `firstNightBlocked` 角色，使其不显示在夜间队列中
- 恶魔和爪牙不受影响（其首夜行动由 `firstNightOrder` 独立处理）

## v1.8.3 (2026-06-01)

### 修复首夜信息位缺失 + 顺移 firstNightOrder

新增三个首夜信息位角色：
- **金顶大仙**：`firstNightOrder: null → 5`（爪牙之后、恶魔之前）
- **毗蓝婆**：`firstNightOrder: null → 7`（爪牙和恶魔之后）
- **女儿国王**：`firstNightOrder: null → 7`（爪牙和恶魔之后）

编号顺移：
- 恶魔(12个)：`firstNightOrder: 5 → 6`
- 许仙：`firstNightOrder: 6 → 8`

首夜完整序列：玉皇大帝(1) → 巨灵神(2) → 黎山圣母(3) → 爪牙(4) → 金顶大仙(5) → 恶魔(6) → 毗蓝婆+女儿国王(7) → 许仙(8)

## v1.8.2 (2026-06-01)

### 夜间行动队列修复与优化

**Bug修复：**
- 首夜玩家加入/分配角色后夜间队列不显示 → 在玩家 INSERT 和角色变更 UPDATE 的 Realtime 回调中自动刷新队列

**UI 优化：**
- 队列面板玩家名牌去掉号码前缀（原 `1号 玩家名` → `玩家名`）
- 已处理项的备注/内容移到状态标识左侧显示（`.queue-resolution` 样式）

### 变更文件
- `admin/js/room.js` — 玩家加入/角色变更时调用 initNightQueue() 刷新队列
- `admin/js/queue.js` — 去号码前缀 + 已处理备注左移
- `admin/style.css` — 新增 .queue-resolution 样式

## v1.8.1 (2026-06-01)

### 角色技能数据修正 — 5角色技能轮转

根据最新版角色说明书同步：
- **孔雀公主** (外来者)：授道(招募教徒) → 恶魔代言人(原青狮精技能)，abilityType: active→passive
- **青狮精** (爪牙)：恶魔代言人 → 睚眦+负隅(原鲤鱼精技能)，inheritsDemon: false→true
- **鲤鱼精** (爪牙)：睚眦+负隅 → 莲台泡影(原金翅大鹏技能)，abilityType: passive→active
- **金翅大鹏** (恶魔)：莲台泡影 → 业报+涅槃+上清仙光+混元真气(原通天教主技能)，deathImmune: false→true
- **通天教主** (恶魔)：移除业报+涅槃，仅保留上清仙光+混元真气，deathImmune: true→false

### 变更文件
- `docs/西游纪角色说明书.txt` — 用户手动编辑（备份：docs/西游纪角色说明书_备份_20260601.txt）
- `admin/data/roles.js` — 5角色ability/abilityType/needsChoice/deathImmune/inheritsDemon/description/tips
- `miniprogram/utils/roles.js` — 孔雀公主+鲤鱼精 abilityType/needsChoice 同步

## v1.8.0 (2026-06-01)

### 技能发动收集系统 — Phase 2 基础架构

#### 数据库（需在 Supabase SQL Editor 执行）
- **`skill_actions` 表**：技能行动记录，统一处理玩家主动发动(`player_initiated`) + 主持人反向询问(`host_prompted`)
  - 状态流转：`submitted`→`processing`→`completed` / `awaiting_response`→`responded` / `skipped`
- **`skill_states` 表**：技能状态追踪（全局一次/连续目标/晕眩/待回应标记），按 `(room_id, player_id)` 唯一约束
- **`game_state` 表**：灵活游戏状态 JSONB 存储
- **`players.is_dizzy`**：玩家晕眩状态标记

#### 小程序数据层
- **`utils/roles.js` 扩展**：84角色全部新增字段 — `abilityType`(56主动/5触发/12被动/11全局一次)、`nightOrder`(58个)、`firstNightOrder`(32个)、`needsChoice`、`isDizzyable`
- **`utils/api.js` 新增8个函数**：`submitSkillAction`、`respondSkillPrompt`、`getPlayerSkillState`、`getPendingSkillPrompts`、`getRoomSkillActions`、`updatePlayerDizzy`、`updateSkillState`、`createSkillState`

#### Web 端夜间行动队列面板
- **`admin/js/queue.js`**（新文件，759行）：队列核心模块
  - `generateNightQueue()` — 按 nightOrder/firstNightOrder 有序生成队列，首夜信息位优先
  - 三种行类型：🎯主动(player_initiated)、⚡触发(host_prompted)、—被动(passive_auto)
  - `detectAndInsertTriggers()` — 触发检测引擎（恶魔杀人→检测目标角色是否triggered→自动插入触发行）
  - `sendHostPrompt()` — 主持人反向询问（创建skill_actions+发送系统消息+标记pending_prompt）
  - `subscribeSkillActions()` — Realtime 监听玩家提交/回应，实时刷新队列状态
  - 操作按钮：处理/跳过/手动处理/发消息询问/确认/撤销
- **`admin/index.html`**：工具栏下方新增队列面板（夜晚阶段显示），含折叠/进度指示
- **`admin/style.css`**：队列面板完整样式（三种行类型左边框颜色区分、状态动画、操作按钮）
- **`admin/js/room.js`**：createRoom/restoreRoom/executePhaseSwitch 接入队列初始化 + 首夜结束时初始化技能状态

### 变更文件
- `supabase/schema.sql` — 新增3表 + 1列 + RLS + Realtime
- `miniprogram/utils/roles.js` — 84角色扩展新字段
- `miniprogram/utils/api.js` — 新增8个技能API函数
- `admin/js/queue.js` — 新建，夜间行动队列核心模块
- `admin/js/room.js` — 接入队列钩子（3处）
- `admin/index.html` — 队列面板HTML + 脚本引用
- `admin/style.css` — 队列面板样式（~200行）

## v1.7.1 (2026-06-01)

### 项目
- **双仓库架构**：源码仓库 `Blood-West` 改为私有，新建公开仓库 `Blood-West-release` 仅包含 `admin/` + `CHANGELOG.md`，通过 GitHub Actions 自动同步，保护源码的同时保持 Pages 公开部署

### 新增
- **主持端快捷回复模板**：私聊回复区新增快捷回复按钮，主持人可一键发送标准确认消息，避免泄露技能结果
  - "✅ 已收到" — 告知玩家主持人已知晓其技能使用（不透露技能结果）
  - "❓ 请说明" — 请玩家补充技能目标等详情
  - "🔒 已处理" — 告知玩家技能已处理完毕（不透露结果）
- 快捷回复与自由输入并存，主持人可自由选择使用模板或手动输入

### 设计原则
- 玩家（如观音）使用技能后只应知道"主持人已收到"，不应得知技能是否成功（如是否眩晕了爪牙）
- 快捷回复模板确保主持人不小心透露游戏信息

### 修复
- **小程序消息气泡右侧裁切**：`scroll-view` 不支持直接 CSS `padding`，padding 被算进可滚动区域导致右对齐气泡超出可视区被裁切；修复为内层 `.msg-list-inner` 承载 padding，同时修复聊天页和邪恶群聊页

### 变更文件
- `admin/index.html` — 私聊回复区增加 `.quick-reply-templates` 按钮组；邪恶群聊回复区适配新布局
- `admin/style.css` — 新增 `.quick-reply-templates` / `.btn-quick-reply` / `.reply-row` 样式
- `admin/js/messages.js` — 新增 `sendQuickReply(content)` 函数
- `admin/app.js` — 绑定快捷回复按钮点击事件
- `docs/技能发动系统设计.md` — 同步：新增第十二章信息控制原则，修正 3.3 观音流程不泄露技能结果
- `miniprogram/pages/chat/chat.wxml` — scroll-view 内新增 `<view class="msg-list-inner">` 内层容器
- `miniprogram/pages/chat/chat.wxss` — padding 从 `.msg-list` 移至 `.msg-list-inner`
- `miniprogram/pages/evil-chat/evil-chat.wxml` — 同上
- `miniprogram/pages/evil-chat/evil-chat.wxss` — 同上

## v1.7.0 (2026-05-31)

### 新增
- **Web 端邪恶群聊工具栏入口**：工具栏房间码左侧新增 👿 小恶魔按钮，有邪恶阵营玩家时自动出现；点击直接切换到邪恶群聊 Tab；新消息到达时按钮闪烁红光提示未读；当前邪恶 Tab 时按钮高亮
- **邪恶阵营群聊（爪牙恶魔聊天）**：主持人分配 minion/demon 角色后，邪恶阵营玩家自动获得群聊权限
  - **小程序端**：新增 `pages/evil-chat/evil-chat` 页面，邪恶玩家在聊天页和圆桌页底部导航栏自动显示"😈 群聊"按钮；群聊页面顶部显示邪恶队友名牌栏（含真实角色名），支持展开/折叠；消息区分队友（紫色气泡+角色名标签）、自己（深紫气泡右对齐）、主持人（金色气泡）；复用聊天页的轮询/消息渲染/昵称编辑模式
  - **Web 端**：右侧消息面板新增 Tab 切换（"私聊"/"😈 邪恶群聊"）；邪恶群聊 Tab 显示邪恶阵营成员名牌横条、群聊消息列表、回复输入区；Realtime 即时推送，非活跃 Tab 显示未读标记
  - **角色数据层**：新增 `miniprogram/utils/roles.js` — 84 角色精简索引（id→{name, category} + `isEvilRole()`），小程序端可判断阵营和显示角色名称
  - **安全性**：邪恶页面加载时校验角色阵营，非邪恶玩家自动跳转聊天页；轮询中持续检测角色变化，若角色被改为善良则自动退出群聊

### 数据库
- 新增 `evil_chat_messages` 表（id, room_id, player_id, direction, content, created_at），RLS 宽松策略，Realtime 已启用
- 迁移 SQL：新表需在 Supabase SQL Editor 中手动执行

### 变更文件
- `supabase/schema.sql` — 新增 `evil_chat_messages` 表定义（含索引、RLS、Realtime 发布）
- `miniprogram/utils/roles.js` — 新建，84 角色精简索引
- `miniprogram/utils/api.js` — `getPlayerStatus` 新增 `role` 字段；新增 `getEvilChatMessages`/`getNewEvilChatMessages`/`sendEvilChatMessage`
- `miniprogram/app.json` — 注册 `pages/evil-chat/evil-chat`
- `miniprogram/pages/evil-chat/*` — 新建邪恶群聊页面（4 文件，~450行）
- `miniprogram/pages/chat/chat.js` — 新增角色检测（`isEvil`）、`onGoEvilChat` 导航
- `miniprogram/pages/chat/chat.wxml` — bottom-nav 增加条件渲染的"😈 群聊"按钮
- `miniprogram/pages/chat/chat.wxss` — 新增 `.nav-btn-evil` 紫色调按钮样式
- `miniprogram/pages/table/table.js` — 同上，新增角色检测和邪恶群聊导航
- `miniprogram/pages/table/table.wxml` — 同上，条件按钮
- `miniprogram/pages/table/table.wxss` — 同上，按钮样式
- `admin/index.html` — 右侧面板改为 Tab 结构（私聊/邪恶群聊双内容区）
- `admin/app.js` — 新增 Tab 切换/邪恶成员渲染/群聊消息收发/Realtime 监听 (~180行)；`selectPlayer`/`updateMessagePanelTitle` 适配 Tab；`hideRoomUI`/`exitRoom` 清理邪恶群聊状态
- `admin/style.css` — 新增 Tab 样式、邪恶成员名牌栏、群聊消息气泡样式 (~160行)

### Phase 1 收尾
- **羁绊组合数据**：新增 `admin/data/teams.js`（~100行），定义4个羁绊组合（师徒四人/猪猪宝贝/三清现世/牛魔父子），含 `getActiveSynergies()` 自动检测 + `getSynergyDistributionMod()` 版型修正
- **代码拆分**：`admin/app.js` 从 ~1977行 拆分为 8 个模块文件（`admin/js/state.js`/`room.js`/`table.js`/`messages.js`/`evil-chat.js`/`board.js`/`roles-ui.js` + 主入口 `app.js` 76行），每个模块 ≤500行，通过 `<script>` 标签按依赖顺序加载
- `admin/index.html` — 更新脚本加载顺序（数据层→核心状态→业务模块→主入口）
- `docs/西游纪实施方案.md` — 更新 Phase 1 进度、文件清单、代码拆分章节

## v1.6.3 (2026-05-31)

### 新增
- **主持端踢出玩家功能**：主持人可在玩家列表或圆桌座位悬停显示 ⛔ 按钮，点击确认后将玩家踢出房间；踢出时自动发送系统通知消息（"您已经被可怕的说书人请出房间…🐶"），标记 `kicked` 字段；小程序端聊天页和圆桌页轮询检测到踢出后弹出模态框，玩家确认后清除数据回到扫码页

### 修复
- **小程序昵称弹窗优化**：已有昵称的玩家切换页面（聊天↔圆桌）时不再重复弹出设置弹窗，仅首次进入无昵称时自动弹出
- **小程序圆桌座位定位修正**：修复 pill 轮廓算法中半圆圆心偏移错误（`seatHalfH` 误加 `gap`），使所有座位均匀距离桌面 24px；修复容器测量时序 — `#round-table` 被 `wx:if` 移除导致 `onReady` 永远测不到真实尺寸，改用始终渲染+系统信息兜底
- **小程序聊天页滚动修复**：新增 `scroll-top` 属性确保从圆桌切回聊天页时消息列表滚动到底部
- **小程序导航按钮统一**：聊天页"🪑 圆桌"按钮保留在消息列表与输入区之间的 `bottom-nav` 栏；圆桌页"💬 消息"按钮从顶栏移至底部同位置 `bottom-nav` 栏，两页导航入口位置对称
- **小程序顶栏尺寸统一**：聊天页顶部状态栏间距/内边距/字体与圆桌页对齐（`gap: 8px`, `padding: 10px 12px`），避免拥挤
- **小程序圆桌座位同步主持端**：座位计算优先使用数据库 `seat_angle`（主持端拖拽调整后的角度），轮询指纹新增 `seat_angle` 字段，主持端调整座位后小程序 1.5 秒内同步

### 数据库
- players 表新增 `kicked BOOLEAN NOT NULL DEFAULT FALSE` 字段

### 变更文件
- `miniprogram/pages/chat/chat.js` — `onLoad` 中仅无昵称时弹出设置弹窗；新增 `scrollTop` 数据字段；新增 `handleKicked` 踢出检测
- `miniprogram/pages/chat/chat.wxml` — 恢复 `bottom-nav` 栏（"🪑 圆桌"），移除 `input-area` 内 `table-nav`
- `miniprogram/pages/chat/chat.wxss` — 恢复 `.bottom-nav` 样式，移除 `.table-nav` 样式；顶栏尺寸对齐圆桌页
- `miniprogram/pages/table/table.wxml` — `#round-table` 始终渲染（移除 `wx:if`），座位层内部条件渲染；新增 `bottom-nav` 栏（"💬 消息"）
- `miniprogram/pages/table/table.wxss` — 新增 `.bottom-nav` 样式
- `miniprogram/pages/table/table.js` — 修正 `computeSeatPosition` 算法 + `onReady` 用系统信息做兜底；座位计算优先使用 `seat_angle` 同步主持端拖拽；新增 `handleKicked` 踢出检测
- `miniprogram/utils/api.js` — `getPlayerStatus` 选择字段扩展为 `status,kicked`
- `admin/app.js` — 新增 `kickPlayer`/`setupSeatClickHandler`；`renderPlayerList` 和 `renderRoundTable` 中新增踢出按钮
- `admin/style.css` — 新增 `.kick-btn` / `.seat-kick-btn` 样式（hover 显示，悬停放大）
- `supabase/schema.sql` — 新增 `kicked` 列迁移语句

## v1.6.2 (2026-05-31)

### 新增
- **版型面板手动增减角色**：每个阵营分组末尾新增"+"按钮，主持人可手动添加任意未使用的同类别角色；每个角色标签新增"×"移除按钮（hover 显示），支持逐角色微调版型
- **版型复原功能**：主持人确认版型后，右侧新增「↩ 复原」按钮，一键将编辑中的版型恢复到上次确认的状态
- **外来者修正警告**：当外来者实际数量与人数分布表+角色修正规则不匹配时，版型面板顶部显示金色警告横幅，提示说书人调整
- **小程序圆桌视图**：新增 `pages/table/table` 页面，pill 长圆形桌面显示所有玩家的名牌和存活状态，主持人切换白天/黑夜时自动更新（每 1.5 秒轮询）

### 变更
- **小程序玩家名牌优化**：聊天页玩家名牌恢复为昵称显示，每次进入自动弹出名称设置弹窗（placeholder："请输入你的号码+名字，例如 1 Lester"），红色警示"不要输入你的身份"
- 昵称保存时同步到 Supabase，Web 端可实时显示
- 聊天页 + 圆桌页互相导航（"桌"/"信"按钮），`redirectTo` 无缝切换

### 变更文件
- `admin/index.html` — 新增外来者警告容器、复原按钮
- `admin/app.js` — 新增 `removeRoleFromBoard`/`addRoleToBoard`/`commitAddRole`/`cancelAddRole`/`getOutsiderWarning`/`restoreBoardPanel` 等函数（+169行）
- `admin/style.css` — 新增角色移除按钮/添加按钮/外来者警告/复原按钮样式（+70行）
- `miniprogram/utils/api.js` — 新增 `getRoomPlayers` API
- `miniprogram/app.json` — 注册圆桌页面路由
- `miniprogram/pages/table/*` — 新建圆桌页面（4 个文件，~360行），含 pill 轮廓座位定位算法 + 轮询
- `miniprogram/pages/chat/chat.wxml` — 名牌恢复昵称显示 + 新增"桌"导航按钮
- `miniprogram/pages/chat/chat.js` — 昵称功能优化 + 同步 Supabase + `onGoTable` 导航
- `miniprogram/pages/chat/chat.wxss` — 新增 `.nav-btn` 样式

## v1.6.1 (2026-05-30)

### 修复
- **角色数据库补全**：按说明书补全12个缺失角色（村民+5：姜子牙/白蛇/许仙/法海/宁采臣；外来者+2：青蛇/聂小倩；爪牙+3：妲己/申公豹/千年树妖；恶魔+2：纣王/黑山老妖），角色总数 72→84
- **归类修正**：4个角色按说明书重新归类——镇元子/孔雀公主/元始天尊/万圣公主从村民/独立移入外来者（外来者 4→10）
- 移除已不存在的「独立阵营」类别（CSS变量+boards.js+app.js中的引用）

## v1.6.0 (2026-05-30)

### 新增
- **版型推荐器**：主持人在工具栏点击「🎭 角色配置」，输入玩家人数，系统根据人数分布表自动推荐角色版型（村民/外来者/爪牙/恶魔数量），支持随机刷新和手动调节人数
- **角色手动确认**：选中玩家后在消息面板通过下拉框手动指定角色，适配线下抽卡→玩家自报→主持确认的流程
- **角色徽章显示**：座位标签和玩家列表显示已确认的角色名称，按类别着色（村民绿/外来者金/爪牙红/恶魔紫/独立青）
- **101角色数据文件**：`admin/data/roles.js` 完整录入西游纪72个角色（村民47+外来者4+独立2+爪牙13+恶魔10），含能力描述/行动顺序/羁绊/主持提示等字段
- 版型持久化到 localStorage，页面刷新后自动恢复

### 新增文件
- `admin/data/roles.js` — 西游纪完整角色数据库
- `admin/data/boards.js` — 人数分布表 + 版型推荐算法

### 变更
- `admin/index.html` — 加载角色数据文件，新增版型配置弹窗和角色选择器
- `admin/app.js` — 新增版型推荐面板、角色选择器下拉框、角色徽章渲染逻辑（+180行）
- `admin/style.css` — 新增角色类别颜色变量、版型弹窗样式、角色徽章样式（+110行）

## v1.5.5 (2026-05-30)

### 新增
- 玩家生死状态系统：三态切换（存活 ⇄ 处决 ⇄ 夜死），支持区分白天处决和夜晚死亡
- 座位标记点中央新增状态切换图标，点击循环切换：存活（金点）→ 处决（血红✕）→ 夜死（暗紫☽）→ 存活
- 座标颜色随状态变化：存活=暖棕，处决=血红渐变+红光晕，夜死=暗紫渐变+紫光晕
- 左侧玩家列表同步显示死亡状态标记圆点（红/紫）
- 死亡玩家仍可正常收发消息（符合血染钟楼规则）
- 小程序端顶部状态栏实时显示玩家生死指示器（轮询同步）

### 数据库
- players 表新增 `status` 列：TEXT NOT NULL DEFAULT 'alive'，CHECK 约束三态值

## v1.5.4 (2026-05-30)

### 新增
- 阶段切换添加确认弹窗：点击切换按钮弹出确认对话框，防止误操作
- 阶段支持后退切换：新增 ◀ 按钮，可将阶段往回调（如夜晚返回白天）

## v1.5.3 (2026-05-30)

### 变更
- 去除圆桌内外圈装饰环，桌面更简洁
- 座位标记点放大：已占用 22px，空槽位 14px，名字标签同步放大
- **座位定位从椭圆公式改为 pill 轮廓求交**：射线与长圆（矩形+两端半圆）求交点，座位天然贴合桌面外形，32px 均匀间距不重叠

## v1.5.2 (2026-05-30)

### 修复
- 小程序轮询从 `setInterval` 改为递归 `setTimeout`，等待请求完成后再计时，防止网络慢时请求堆积
- 轮询间隔从 2 秒缩短至 1.5 秒，减少阶段切换和主持人回复的感知延迟
- 修复拖拽座位后消失：浮点角度比较改容差 + 鼠标坐标直传 + 孤儿玩家兜底重分配

## v1.5.1 (2026-05-30)

### 变更
- 移除列表视图，圆桌视图成为唯一主视图（简化界面）
- 圆桌改为竖形 pill 长桌，更贴近血染钟楼长桌场景
- 座位改为固定槽位（19 个预置位置），拖拽时交换座次而非自由移动
- 新加入玩家在圆桌上统一显示「未命名玩家」（而非号码）
- 左侧玩家列表面板支持拖拽排序（与列表视图功能一致）

### 修复
- 修复小程序发消息重复：轮询回调增加按消息 ID 去重，消除竞态条件
- 修复拖拽座位时玩家消失：重构拖拽逻辑，mouseup 后再渲染 DOM
- 移除中央区域背景径向渐变，保持纯暗色背景
- 清理已删除列表视图的遗留样式和 JS 引用

## v1.5.0 (2026-05-30)

### 新增
- Web 端新增圆桌视图，玩家围坐在圆形木纹桌面周围
  - 视图切换按钮：工具栏新增「圆桌视图」/「列表视图」切换
  - 座位自动分配：新玩家加入时均匀分布就座
  - 拖拽调座：主持人可拖拽座位调整位置，角度持久化到数据库
  - 点击坐位选中玩家查看消息、回复
  - 新消息红点同步显示在座位上
  - 中央显示当前游戏阶段
  - 视图偏好持久化到 localStorage，刷新后保持

### 变更
- Web 端全局 UI 升级为暗黑哥特风格
  - 新增 CSS 设计系统变量（五级灰阶背景、金/血红/紫色强调色、多级阴影）
  - 工具栏：渐变背景 + 金色底部分隔装饰线，Logo 使用衬线字体+光晕
  - 按钮：金属渐变（金/铜/暗银）、hover 光晕放大、active 按压位移
  - 阶段按钮：脉冲呼吸光晕动画（夜=紫色、昼=金色）
  - 玩家列表卡片化，选中态金色左边框+光晕
  - 消息气泡：不对称圆角、暗红/暗金渐变背景、内阴影
  - 输入框：深色内阴影，聚焦金色边框+光晕
  - 二维码弹窗：多层边框+金色外环、毛玻璃背景、入场动画
  - 滚动条：金色调滑块
  - 全局细微噪点纹理叠加
- 小程序端 UI 同步升级暗黑哥特风格
  - 全局背景加深至 #0a0a12
  - 扫码页：标题金色光晕、按钮暗框+紫色光晕、输入框内阴影、加入按钮金属渐变
  - 聊天页：阶段徽章光晕、消息气泡渐变+不对称圆角、昵称弹窗暗卡+金边

### 数据库
- players 表新增 `seat_angle`（FLOAT，圆桌座位角度）和 `role`（TEXT，角色/身份）字段

## v1.4.1 (2026-05-29)

### 修复
- 小程序网络请求添加 15 秒超时配置，避免请求挂起
- 扫码页新增版本号标识，方便排查体验版是否更新成功
- 修复玩家发消息出现重复显示（乐观更新后未用服务器数据替换临时消息）

## v1.4.0 (2026-05-29)

### 新增
- 部署 GitHub Pages，主持后台可通过公网 URL 访问
  - 地址：`https://jf8640721-cmd.github.io/Blood-West/admin/`
  - 任何设备浏览器打开即可使用，无需安装

### 修复
- 小程序重复扫码加入同一房间时返回 409 错误，改为自动恢复已有玩家信息

## v1.3.0 (2026-05-29)

### 新增
- 房间信息持久化到 localStorage，刷新页面自动恢复房间
- 主持后台新增退出房间按钮，可退出并重新创建房间

### 变更
- 主持后台玩家列表移除左侧数字编号，改为拖拽手柄
- 未设置昵称的玩家统一显示「未命名玩家」
- 玩家列表支持拖拽排序（纯视觉排列，不影响数据库 player_number）

### 修复
- 消息面板显示玩家昵称而非数字编号
- 新增 players 表 UPDATE 权限策略，修复小程序更名无法同步到 Web 端
- 小程序端消息气泡同步使用昵称显示
- 修复昵称变更后 Web 端已渲染消息未刷新的问题

## v1.2.1 (2026-05-29)

### 适配
- 聊天页安全区适配兼容 iOS 11.0-11.2（`constant()` 降级）
- 扫码页底部增加安全区适配，避免 iPhone 刘海屏和 Android 全面屏遮挡

## v1.2.0 (2026-05-28)

### 新增
- 玩家可自定义昵称：点击聊天页顶部号码栏，弹出编辑框
- 昵称支持中英文和数字，最长 10 个字符，如"1猪八戒"
- 主持后台玩家列表和消息面板同步显示玩家昵称
- 昵称变更通过 Realtime 实时推送到主持端

## v1.1.0 (2026-05-28)

### 变更
- 阶段系统改为游戏回合顺序：首夜 → 第1天 → 第1夜 → 第2天 → 第2夜 → ...
- 主持后台阶段按钮显示当前阶段名和下一阶段预告
- 小程序端阶段标签同步显示完整阶段名
- 按钮样式自动适配：含"夜"字用暗紫风格，含"天"字用金色风格

### 修复
- 小程序 POST 请求添加 Prefer 头，修复加入房间返回空数据的问题
- 小程序 urlCheck 设为 false，修复真机预览网络错误

## v1.0.0 (2026-05-28)

### 新增
- 主持人 Web 后台：创建房间、二维码分享、阶段切换
- 玩家微信小程序：扫码加入房间、手动输入房间码
- 玩家与主持人双向私密消息，消息自动带阶段标签
- 主持人端 Supabase Realtime 实时推送（玩家加入、新消息）
- 主持人可选中玩家查看消息记录并回复
- 新消息红点提示（未选中玩家有新消息时显示）
- 玩家端退出房间功能
- 全局深色主题 UI（血染钟楼风格）

### 技术栈
- 前端：原生微信小程序（JavaScript）+ 原生 HTML/CSS/JS
- 后端：Supabase（PostgreSQL + REST API + Realtime）
- 无第三方 npm 依赖
