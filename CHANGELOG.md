# 版本日志

## v3.0.26 (2026-06-10)

### 🔧 优化 — 扫码页按钮布局

- **按钮并列**：扫描二维码 + 进入房间 改为等宽横向排列
- **布局重排**：输入框在上 → 两按钮在下并列，操作流更顺畅
- **去除分割线**：简化视觉，减少不必要元素

## v3.0.25 (2026-06-10)

### 🎨 优化 — 扫码页标题配色升级

- **标题色**：亮金 `#f0d890` → 白镴银铜 `#c8bc9e`
  - 冷调金属质感，内敛高级，比亮金更耐看
  - 外发光同步调整为银铜色调，三层辉光更柔和

## v3.0.24 (2026-06-10)

### 🎨 字体更换 — LXGW WenKai → Ma Shan Zheng（马山正）

- **原因**：霞鹜文楷 24MB 加载偏慢，换用更小更飘逸的马山正毛笔楷体
- **字体**：Ma Shan Zheng（马山正），Google Fonts 开源，SIL OFL
  - 大小：5.6MB（比 LXGW WenKai 小 77%）
  - 风格：毛笔手写楷体，笔画有力，更适合"西游纪"血染钟楼神秘主题
  - 真机首次加载 1-2 秒，远快于之前的 5-8 秒
- **降级链**：Ma Shan Zheng → LXGW WenKai → STKaiti → KaiTi → PingFang SC

## v3.0.23 (2026-06-10)

### ✨ 新增 — 扫码页楷体字体加载

- **问题**：开发工具模拟器可显示 STKaiti 楷体，但真机 iOS/Android 均无此字体，回退为 PingFang SC 无衬线体，"西游纪"标题丧失书法风格
- **方案**：通过微信小程序 `wx.loadFontFace()` API 动态加载开源楷体
  - 字体：**LXGW WenKai（霞鹜文楷）** Regular，SIL Open Font License 开源可商用
  - 存储：上传到 Supabase Storage `fonts` bucket（公开访问）
  - 加载时机：扫码页 `onLoad` 调用，`global: true` 全局生效
  - 降级策略：加载失败自动回退系统字体栈 `STKaiti → KaiTi → PingFang SC → serif`
- **CSS 字体栈**：`--font-display` 首位新增 `'LXGW WenKai'`
- **改动文件**：`scan.js`（+wx.loadFontFace）、`app.wxss`（字体栈）、`admin/index.html`（版本）、`scan.wxml`（版本）

## v3.0.22 (2026-06-10)

### 🐛 修复 — 真机背景图 404 + 屏幕顶部未覆盖

- **根因定位**：真机 vConsole 日志显示 `GET images/texture-gold.webp 404 (Not Found)`
  - 微信小程序真机环境对 WebP 格式图片返回 404，模拟器正常
  - 全部 3 个 `.webp` 图片转为 `.jpg`（texture-gold、bg-chat、texture-wood）
  - 4 个 WXML 文件（scan/chat/table/evil-chat）全部 `.webp` → `.jpg` 引用替换
- **全局 z-index 真机修复**：`.bg-image` / `.bg-overlay` 的 `z-index: -1` 在真机 WebView 中落到 `page` 根元素背景色 `#1a0e06` 后面
  - 改 `z-index: -1` → `z-index: 0`
  - 4 页内容组件（top-bar / msg-list / bottom-nav / input-area / table-area 等）全部加 `position: relative; z-index: 1` 确保不被背景遮挡
- **导航栏隐藏**：扫码页 `navigationStyle: "custom"` 隐藏原生导航栏
  - `scan.js` 通过 `wx.getMenuButtonBoundingClientRect()` 动态计算安全区顶部距离
  - 背景图覆盖到状态栏下方，彻底解决顶部未覆盖问题

### 🎨 优化 — 扫码页 UI 重构

- **扫码按钮**：方案C 几何符号风格
  - 高度 74px → 48px，单行布局
  - 图标「扫码」→ `◎` Unicode 几何符号
  - 文字「扫描二维码加入房间 + 提示小字」→ 精简为「扫描二维码」
  - 去掉金色描边（`border: none`）和外发光（`box-shadow` 仅保留暗色投影）
  - 背景改为半透古铜 `rgba(180,120,40,0.48) → rgba(130,80,18,0.58)`，鎏金纹理透出
  - 纹理叠加改用大按钮专用 `.btn-texture-gold-lg`（opacity 0.48）
  - 加 `overflow: hidden` 确保纹理图被圆角裁切
- **卡片去黑框**：`.scan-card` 背景→透明，边框→none，阴影→none，让按钮直接浮在鎏金背景上
- **进入房间按钮**：同步半透古铜风格，去掉金色外发光
- **输入框**：背景从死黑 `rgba(0,0,0,0.3)` → 暖棕半透 `rgba(20,12,4,0.55)`，加内阴影 + 外辉光
- **分割线**：提亮，`rgba(180,130,60,0.3)` → `rgba(200,150,70,0.45)`，去掉中间「或 手动输入房间码」文字

### 📝 规范 — CLAUDE.md 新增图片识别规则

- 收到 `[Unsupported Image]` 标记时，必须立即告知用户无法查看图片，请用户用文字描述，禁止猜测后继续操作

---

## v3.0.21 (2026-06-10)

### 🎨 增强 — 纹理叠加逼近 blend-mode 效果

- `.btn-texture-gold` 新增 `filter: contrast(1.35) brightness(0.82)`，用 CSS filter 模拟 overlay 加深效果
- `.ring-texture-wood` 新增 `filter: contrast(1.25) brightness(0.88)`
- 新增两个变体类：
  - `.btn-texture-gold-sm`（小徽章：opacity 0.72）— room-badge/player-badge/phase-badge
  - `.btn-texture-gold-lg`（大按钮：opacity 0.48）— scan-btn/scan-join-btn
- 4 页 WXML 更新：小徽章→`-sm`，大按钮→`-lg`，其余保持默认 0.60
- 版本号 v3.0.20 → v3.0.21

## v3.0.20 (2026-06-10)

### 🎨 调整 — 纹理叠加 opacity 大幅提升

- `.btn-texture-gold`：opacity 0.18 → **0.60**（鎏金纹理明显可见）
- `.ring-texture-wood`：opacity 0.25 → **0.55**（木纹质感清晰）
- 原因：0.18 在金色渐变底上肉眼几乎不可见，用户测试 0.60 效果最佳
- 版本号 v3.0.19 → v3.0.20

## v3.0.19 (2026-06-10)

### ✨ 新增 — 鎏金/木纹纹理叠加

- 激活之前「预留」的 `texture-gold.webp` / `texture-wood.webp` 纹理图
- 用 `<image>` 标签绝对定位叠加到鎏金按钮/徽章内部（z-index: -1 + opacity 0.18），增加材质感
- 木纹纹理叠加到圆桌铜镜环 ring-1 / ring-4（opacity 0.25）
- 涉及 4 页共 20+ 组件：scan 按钮、room-badge、player-badge、phase-badge、subscribe-banner、send-btn、nav-btn、nickname-btn.confirm、铜镜环
- app.wxss 新增 `.btn-texture-gold` / `.ring-texture-wood` 全局纹理类
- 各组件父容器统一加 `position: relative; z-index: 0;` 创建层叠上下文
- 版本号 v3.0.18 → v3.0.19

## v3.0.18 (2026-06-10)

### 🐛 修复 — 背景图层级遮挡所有 UI 组件

- `.bg-image` / `.bg-overlay` 的 `z-index: 0` 在页面容器 `position: relative; z-index: 1` 创建的层叠上下文中，被绘制在非定位元素之上，导致白天/黑夜徽章、房间号、玩家名牌等全部不可见
- 修复：`z-index: 0` → `z-index: -1`，将背景图层沉到层叠上下文底部
- 版本号 v3.0.17 → v3.0.18

## v3.0.17 (2026-06-10)

### 🔧 修复 — 背景图层级遮挡 UI 组件

- `.bg-layer` 嵌套 `<image>` 导致小程序渲染层级异常，覆盖所有 UI
- 改为 `<image>` 直接 `position: fixed` + `z-index: 0`，移除 `.bg-layer` 包裹层
- 版本号 v3.0.16 → v3.0.17

## v3.0.16 (2026-06-10)

### 🔧 修复 — 背景图从 WXSS 改为 `<image>` 标签

- 微信小程序 WXSS 不支持 `background-image` 引用本地图片，改为 `<image>` 标签承载
- 4 页 WXML bg-layer 替换为 `<image class="bg-image" src="..." mode="aspectFill">`
- app.wxss 新增 `.bg-image` 全局样式，4 页 WXSS 移除无效 `background-image`
- 版本号 v3.0.15 → v3.0.16

## v3.0.15 (2026-06-10)

### 🗜️ 图片压缩 — WebP 格式，包体积大幅优化

- 3 张纹理图 PNG/JPG → WebP：bg-chat.png (2492KB→380KB) / texture-gold.png (2611KB→442KB) / texture-wood.jpg (752KB→171KB)
- 总计 5.8MB → 993KB（↓83%），全部低于微信 2MB 单文件限制
- 更新 4 页 WXSS 图片引用 `.png` → `.webp`
- 删除旧的 3 张大文件

- 版本号 v3.0.14 → v3.0.15

## v3.0.14 (2026-06-10)

### 🎨 小程序 UI 全面重塑 — 暗黑哥特 → 敦煌岩彩国风

- **全局**：CSS 变量系统替换（暖棕+鎏金+朱砂红），所有旧颜色 #0a0a12/#0f0f1c/#2a2040/#1e1e36 清除
- **全局**：导航栏配色改为暖棕 #1a0e06，新增背景图层 + 减淡蒙层系统
- **扫码页**：扫码按钮改为鎏金渐变，输入框改为半透明暖棕，📷→「扫码」✦→◆
- **聊天页**：top-bar/input-area/bottom-nav 去背板透明化，消息气泡改为半透明暖棕/朱砂调，🔔→⏀ 😈→魔 🪑→桌
- **圆桌页**：pill 形桌面替换为 5 层 CSS 铜镜（鎏金外框+铆钉环+刻度环+木纹桌面+透明中心），座位宝石改为暖棕/朱砂配色，😈→魔 💬→信
- **邪恶群聊页**：暗紫调全部迁移为岩彩暖棕/朱砂，队友栏无边线透明化，消息气泡朱砂暗调，😈→魔 💬→信 🪑→桌
- **图片**：新增 texture-gold.png / bg-chat.png / texture-wood.jpg 三张纹理
- **JS**：零改动 — 4 页 .js + api.js + config.js + app.js 全部保持不变

- 版本号 v3.0.13 → v3.0.14

## v3.0.13 (2026-06-10)

### ✏️ 玩家名称+角色名牌字号放大1px

- `.player-name` 14→15px / `.seat-label` 13→14px
- `.seat-role-badge` 12→13px / `.player-role-name` 12→13px
- `.name-edit-icon` 11→12px

- 版本号 v3.0.12 → v3.0.13

## v3.0.12 (2026-06-10)

### 🔧 圆桌座位名牌移除编辑功能

- 圆桌座位上玩家名牌去除铅笔图标 ✎ 和点击编辑事件
- 玩家列表侧栏保留名牌编辑功能（铅笔图标仍显示）

- 版本号 v3.0.11 → v3.0.12

## v3.0.11 (2026-06-10)

### ✏️ 全站字体加粗 — 解决浅色文字模糊

- `body` 全局字重：`500` → **600**（所有正文更清晰）
- 面板标头、弹窗标题、队列角色名、行动记录等 7 处 `500` → `600`
- 阶段提示、版型分类计数等 2 处 `normal`(400) → `500`
- 已为 `bold`(700) 的元素保持不变

- 版本号 v3.0.10 → v3.0.11

## v3.0.10 (2026-06-10)

### 🎨 版型配置弹窗玻璃面板底色/透明度统一

- `.board-cat-header`：`rgba(30,10,8,0.2)` → `rgba(30,10,8,0.25)`，hover `0.3` → `0.35`（与其他 section 标头一致）
- `.board-cat-body`：`rgba(22,8,8,0.12)` → `rgba(30,10,8,0.2)`，统一 RGB 底色（与父级 header 同色系，消除相邻色温差）

- 版本号 v3.0.9 → v3.0.10

## v3.0.9 (2026-06-10)

### 🐛 修复 Canvas 负半径崩溃 + 🎨 工具栏透明度统一

**Canvas 圆桌 — 环宽等比缩放：**
- `_tableSize=420` 时硬编码环宽总和（204px）超过桌面半径（193px），导致 `r7i=-10.8` → `arc()` 崩溃
- 新增 `_ringScale = _tableSize / 620` 缩放系数，所有 7 层环宽 + 间距等比缩放
- 原始设计基于 `_tableSize=620`，缩小画布时环宽自动适配，确保内环半径始终 > 0
- 座位偏移 `22px` 同步缩放：`22 * _ringScale`
- 刻度、星位点、魂芯尺寸随环缩放
- 添加注释标注环宽与圆桌尺寸的关联关系

**🎨 玻璃面板底色统一：**
- 工具栏区域透明度底色统一为 `rgba(30,10,8,...)` 基准（此前多个元素混用不同 RGB 底色）
- 修复元素：`.room-info`、`.player-item`、`.player-item:hover/active`、`.queue-header`、`.queue-row`
- 版型配置面板统一：`.board-cat-header`、`.board-role-tag`、`.board-empty-slot`
- 消息面板统一：`.reply-area`、`.btn-quick-reply`、`.msg-tab`、`.btn-count-stepper`
- 历史面板统一：`.history-phase-group`、`.history-phase-header`、`.history-action-row`
- 弹窗、队列、角色选择器等 20+ 玻璃元素统一底色

- 版本号 v3.0.8 → v3.0.9

## v3.0.8 (2026-06-10)

### 🎨 圆桌进一步缩小 + 玻璃面板透明度再加强

- **圆桌尺寸** `_tableSize`：500 → **420**（再缩 ~16%，总缩小 ~32%）
- **玻璃面板 alpha 二次降低** ~0.1（所有面板更融入铜镜背景）：
  - 深色面板 `0.4`→`0.12` / 工具栏 `0.35`→`0.25` / 列表项 `0.35`→`0.25`
  - 悬停 `0.4`→`0.3` / 弹窗 `0.5`→`0.4` / 输入框 `0.3`→`0.12`
  - 邪恶群聊 `0.3`→`0.2` / 队列面板 `0.3`→`0.2`
- 背景径向渐变同步降低 `0.45→0.35` / `0.7→0.6`

- 版本号 v3.0.7 → v3.0.8

## v3.0.7 (2026-06-10)

### 🎨 玻璃面板底色 — 朱砂底 + 透明度加强

**全部玻璃透明面板底色从黑棕系改为朱砂红底系：**

- CSS 变量 `--bg-*` 色相偏红：`#120904`→`#160808` / `#1f1006`→`#200a08` / `#2d180b`→`#2e1210` / `#3e2212`→`#3e1a16` / `#4f2e1a`→`#4e2620`
- 边框变量同步：`#2d180b`→`#2e1210` / `#56341d`→`#562620`
- 玻璃面板 alpha 统一降低 **0.15**（透明度加强）：
  - 深色面板 `rgba(18,9,4,0.55)` → `rgba(22,8,8,0.4)`
  - 工具栏 `rgba(26,14,6,0.5)` → `rgba(30,10,8,0.35)`
  - 列表/回复区 `rgba(45,24,11,0.5)` → `rgba(42,16,14,0.35)`
  - 悬停态 `rgba(62,34,18,0.55)` → `rgba(55,24,20,0.4)`
  - 弹窗内容 `rgba(62,34,18,0.65)` → `rgba(55,24,20,0.5)`
  - 输入框 `rgba(18,9,4,0.4)` → `rgba(22,8,8,0.3)`
- 背景径向渐变同步偏红 `rgba(30,10,8,...)`

- 版本号 v3.0.6 → v3.0.7

## v3.0.6 (2026-06-10)

### 🎨 铜镜圆桌质感重做 — 缩小 + 古铜材质升级

**尺寸：** `_tableSize` 620→500（缩小~20%），座位偏移 28→22px

**8环全面瘦身：** 外框 10→5px / 铆钉环 16→8px（铆钉 3.2→2.2px）/ 刻度环 20→12px / 分隔环 6→3px / 桌面 140→120px / 内框 8→4px / 罗盘 60→44px

**金属质感升级：**
- 全部金属环渐变从 3-4 色阶→6-8 色阶，古铜色系 `#c89860`→`#9b6e46`→`#7a5032`→`#3a1e0e`
- 每个金属环内外缘加 0.6px 高光线，模拟倒角反光
- 青铜罗盘区域撒 18 个铜绿氧化斑 `rgba(70,105,82,...)`
- 全桌面覆盖 200 个微噪点（2% 不透明度），打破 CG 塑料感
- 阶段文字字号 16→14px，更精致

- 版本号 v3.0.5 → v3.0.6

## v3.0.5 (2026-06-10)

### 🎨 邪恶群聊图标 😈 →「魔」字

- `admin/index.html` — 工具栏按钮 `👿` → `魔`，Tab 标签 `😈 邪恶群聊` → `魔 邪恶群聊`
- `admin/style.css` — `.btn-evil-toolbar` 适配汉字：字体 `Noto Serif SC`，字重 700，字号 22px，加文字阴影
- `admin/js/evil-chat.js` — 3处 😈 替换为「魔」；未读角标颜色 `#e080f0`（紫）→ `#e06050`（朱砂红）
- `admin/design-preview-dunhuang.html` — 邪恶阵营标签同步替换
- 版本号 v3.0.4 → v3.0.5

## v3.0.4 (2026-06-10)

### 🎨 修复：邪恶群聊图标配色偏紫 → 敦煌朱砂暖红

- `admin/style.css` — `.btn-evil-toolbar` 背景渐变从冷棕改为朱砂暖红 `rgba(200,62,62,...)`，发光从肉桂色改为鎏金 `rgba(219,168,81,...)`，彻底消除紫色泛光
- `admin/style.css` — `.evil-chip-name` 从薰衣草紫 `#c0b0d0` 改为暖粉 `#e0c0c0`（与设计预览 [design-preview-dunhuang.html](admin/design-preview-dunhuang.html) 一致）
- `admin/style.css` — `@keyframes demon-pulse` 脉动光晕同步改为鎏金+朱砂混合
- 版本号 v3.0.3 → v3.0.4

## v3.0.3 (2026-06-09)

### 🐛 修复：Canvas 铜镜圆桌 arc() 负半径报错

**根因：** `_tableSize=560` 时，8层环的径向总跨度（268px）超过 `R = 560×0.46 = 257.6`，导致内环半径 `r7i` 计算为 `-10.4`，Canvas `arc()` 抛出 `IndexSizeError`。

**修复内容：**
- `admin/js/table.js` — `_tableSize` 560→620，`R=285.2`，`r7i=17.2`（正值，留有余量）
- 版本号 v3.0.2 → v3.0.3

## v3.0.2 (2026-06-09)

### 🔧 调试日志 + try-catch 加固 + 版本号更新

- `admin/js/table.js` — renderRoundTable 加 try-catch 防止渲染异常吞没，renderPlayerList 加日志
- `admin/js/room.js` — Realtime INSERT 回调加日志追踪玩家加入
- 版本号 v3.0.1 → v3.0.2

## v3.0.1 (2026-06-09)

### 🐛 紧急修复：Canvas 铜镜圆桌不加载 + 玩家加入不显示

**根因：** `table.js` 中 `let isDragging` 与 `state.js` 重复声明，导致 `table.js` 整个文件 SyntaxError 解析失败，所有函数未定义。

**修复内容：**
- `admin/js/table.js` — 移除重复的 `let isDragging = false`（state.js 已声明）
- `admin/js/table.js` — 纹理加载 IIFE 改为双 RAF 延迟绘制 + window.onload 兜底 + 重试上限
- `admin/js/room.js` — `showRoomUI()` 中主动触发 Canvas 双 RAF 绘制
- `admin/index.html` — 所有 JS/CSS 引用加 `?v=3.0.1` 缓存破坏参数
- `admin/bg-frame.png` → `admin/bg-frame.jpg` — 压缩重编码（8.5MB→352KB, -96%）
- `admin/msg-bg-parchment.jpg` — 重压缩（2.2MB→357KB, -84%）
- `admin/style.css` — 更新所有 `bg-frame.png` 引用为 `bg-frame.jpg`

## v3.0.0 (2026-06-09)

### 🎨 UI 风格全面升级 — 敦煌岩彩主题

将主持后台从冷调暗蓝主题全面替换为敦煌岩彩（Dunhuang Mineral Pigment）暖棕鎏金风格。设计系统基于 bg-frame.png 画框纹理 20 阶色彩量化提取，搭配经卷纸纹理（msg-bg-parchment.jpg）和磨砂玻璃透明面板。

**设计系统：**
- 色彩：从 bg-frame.png 提取 5 级暖棕背景 + 4 阶鎏金 + 朱砂红 + 冷色素青铜锈 + 石绿
- 字体：Noto Serif SC（标题）+ Noto Sans SC（正文）+ Playfair Display（装饰）
- 材质：bg-frame.png 全屏背景 + 23处 backdrop-filter 磨砂玻璃 + 经卷纸纹理
- 按钮：6种变体（鎏金/石青/朱砂/铜色/幽灵/小按钮），每种采样 bg-frame.png 不同区域

**改动文件：**
- `admin/style.css` — 全量重写（2347→1161行），:root 变量完全替换，所有组件适配敦煌岩彩
  - body：bg-frame.png 背景 + 暗角遮罩 + font-weight:500
  - 工具栏/面板/弹窗/队列：统一磨砂玻璃透明化
  - 按钮：bg-frame.png 纹理叠加 + 渐变色调
  - 消息气泡：玩家→经卷暖金区 / 主持→经卷冷色区 / 邪恶→经卷暗朱砂区
  - 文字色系加深（cream #d4b87a / cream-dim #b87848 / cream-muted #8b5a38）
- `admin/index.html` — Google Fonts CDN + Canvas 圆桌容器替换 CSS 圆桌 + 版本号 v2.0.2→v3.0.0
- `admin/js/table.js` — Canvas 8环铜镜星盘引擎（12铆钉 + 24刻度 + 4十字方位线 + 经卷纹理叠加）
- `admin/js/room.js` — 圆桌容器引用适配（#seats-container → #seats-overlay）

**新增资源：**
- `admin/bg-frame.png` — 画框纹理背景（已有）
- `admin/msg-bg-parchment.jpg` — 经卷纸纹理（用于消息气泡 + 铜镜桌面）

## v2.0.2 (2026-06-05)

### 📋 行动记录本统一：白天+夜晚融合

将原本仅展示夜晚行动的「夜间记录」Tab 升级为统一的「行动记录」，白天和夜晚的已处理行动全部展示，用 ☀️/🌙 图标区分阶段类型。

**改动内容：**
- `admin/js/history.js` — 删除 `phase.includes('夜')` 过滤，白天阶段行动自然流入；阶段标题自动加 ☀️/🌙 图标；`loadNightHistory` → `loadActionHistory`
- `admin/index.html` — Tab 标签 `📋 夜间记录` → `📋 行动记录`，占位文案同步
- `admin/js/evil-chat.js` — 面板标题、函数引用同步更新
- `admin/js/room.js` — 退出房间重置文案同步

**设计说明：** 白天队列已经将记录写入 `skill_actions` 表（与夜间共用），仅差历史展示层过滤掉了白天数据。本次改动仅 4 个文件、20 行变更，去掉一层过滤即完成融合。

## v2.0.1 (2026-06-04)

### ☀️ 白天行动队列 + 夜间队列补全

**新增白天行动队列：**
- 在消息面板顶部新增白天行动队列面板，与夜间队列互斥显示（白天显示太阳面板，夜晚显示月亮面板）
- 覆盖 16 个白天发动的角色技能，按时段分组：
  - **早晨**：释迦(超度)、黄风怪(三昧神风)
  - **自由行动**：沙僧(流沙)、唐太宗(圣旨)、普贤菩萨(踏歌行)、东海龙王(布雨)、白蛇(化蛇)、宁采臣(笔墨)、聂小倩(怨魂日行)、地藏菩萨(彼岸花)、法海(大威天龙/大罗法咒)、灵吉菩萨(轮回)
  - **提名/处决**：太白金星(冤大头)、青狮精(负隅)、神农(青鸢延苓)、九头虫(夺舍)
- 白天队列交互简化：手动处理（输入目标+备注）/ 跳过 / 撤销，触发型技能有「触发」按钮
- 白天队列数据持久化到 `skill_actions` 表，页面刷新后自动恢复

**夜间队列补全：**
- 南极仙翁(灵芝仙草) → nightOrder: 32
- 盘古(混淹浩劫) → nightOrder: 33
- 神农(洗练神鼎) → nightOrder: 31

**涉及文件：**
- `admin/data/roles.js` — 3 个角色 nightOrder 补全
- `admin/js/queue.js` — +310 行白天队列逻辑
- `admin/index.html` — 白天队列面板 DOM
- `admin/style.css` — 白天队列暖色调样式
- `admin/js/room.js` — 阶段切换接入白天队列

## v2.0.0 (2026-06-04)

### 🎉 里程碑：项目全面审查 + 质量修复

经过 88 角色数据、24 代码文件、数据库 Schema 的全面审查，修复了 2 个严重问题、3 个主要问题、4 个次要问题。这是项目进入稳定阶段前的质量里程碑。

**严重修复：**
- **initSkillStates 从未被调用** — `room.js` 中 `'第一天'`(汉字一) vs `'第1天'`(数字1) 字符串不匹配，导致首夜过后技能状态从未初始化
- **CSS 孤立声明** — `style.css` 中 6 行无选择器的孤立 CSS 属性声明，现已移除

**主要修复：**
- **escapeHtml 重复定义** — `history.js` 的弱版覆盖了 `state.js` 的 DOM 强版（XSS 风险），已删除重复版本
- **死代码移除** — `togglePhase()` 函数从未绑定，功能已被 `togglePhaseForward()` 替代
- **退出房间队列状态泄露** — `exitRoom()` 未清理 `nightQueue`/`queueActions`/`skillChannel` 等队列状态

**次要修复：**
- **恢复房间 players 查询** — 补充了缺失的错误处理
- **Schema players DELETE 策略** — 补充缺失的 RLS DELETE 策略，修复 `debugClearTestPlayers()` 静默失败
- **云函数 AppSecret** — 改为优先读取环境变量，增强安全性
- **roles.js 调试日志** — 移除生产环境 `console.log`

**审查范围（4 维度并行）：**
1. admin/ 前端代码质量（HTML/CSS/JS）
2. 角色数据 vs 说明书一致性（88 角色逐条比对）
3. 数据库 Schema vs 代码一致性（6 表 × 全部列）
4. 小程序端代码质量（API/页面/云函数）

## v1.8.20 (2026-06-04)

### 新增 4 个角色（女娲、盘古、神农、刑天）

根据最新版角色说明书同步新增。

**村民（3个）：**
- **女娲**：造化敕令（首夜选角色庇护，免疫一次死亡，护盾破碎第3天刷新）+ 传承之火（死于处决时最近死亡善良转世 + 最远玩家灼热）【外来者+1】
- **盘古**：天地聚合（死亡当夜强制4人重抽角色，得知其中一张）+ 混淹浩劫（全局一次斩杀邪恶，波及邻近善良）【外来者+1】
- **神农**：洗练神鼎（全局一次猜两名邪恶角色→全对则其一转善良）+ 青鸢延苓（提名致死首个善良→第3早晨复活）【外来者+1】

**爪牙（1个）：**
- **刑天**：不灭煞气（每晚猜两名非明牌角色，全对杀其一、全错自己死）【外来者-1】

**变更文件：**
- `admin/data/roles.js` — 新增 4 个角色数据，总数 84→88

## v1.8.19 (2026-06-04)

### 微信订阅消息通知 — Cloudflare Worker → 微信云函数迁移

Cloudflare Workers 的 `workers.dev` 域名在中国大陆被墙，导致小程序端无法换取真实 OpenID，通知功能完全不可用。本版本将后端从 Cloudflare Worker 迁移到**微信云开发云函数**，国内网络天然可达。

**云函数 `notify`：**
- 替代 Cloudflare Worker，处理 `/exchange-openid` 和 `/send-notify`
- 通过微信云开发 HTTP 访问服务暴露端点，Web 端可直接调用
- AppSecret 等配置通过环境变量/硬编码管理（私有仓库安全）

**小程序端改动：**
- 接入微信云开发，`app.js` 初始化 `wx.cloud.init()`
- `scan.js` / `chat.js` 改用 `wx.cloud.callFunction('notify', ...)` 换取 OpenID
- 聊天页 `onLoad` 时执行 OpenID 交换（避免 scan 页跳转打断异步请求）
- 订阅按钮改用 `catchtap` + `<view>`（修复真机不弹出原生弹窗的问题）

**Web 主持端改动：**
- `WORKER_URL` 更新为云函数 HTTP 触发地址（国内可达）
- 模板参数字段修正：`thing3`（消息内容）、`thing9`（发布人）、`time2`（时间）

**修复的问题：**
- 真机 `wx.requestSubscribeMessage` 不弹出授权弹窗（`<button>` → `<view>` + `catchtap`）
- 模板参数 47003 错误（字段名与微信模板不匹配）

## v1.8.18 (2026-06-03)

### 微信订阅消息通知（切屏提醒）

主持人回复玩家时，玩家即使切到微信后台也能收到「服务通知」提醒。

**架构：Cloudflare Worker（免费）** 充当中转服务器，处理：
- `POST /exchange-openid` — 用 wx.login() code 换取真实 OpenID
- `POST /send-notify` — 调用微信 `subscribeMessage.send` 发送通知

**小程序端：**
- 加入房间时异步换取真实 OpenID，存入 `players.wechat_openid`
- 聊天页顶部显示「🔔 开启消息提醒」引导条（点击触发 `wx.requestSubscribeMessage`）
- 授权记录存入 `subscriptions` 表

**Web 主持端：**
- `replyToPlayer()` / `sendQuickReply()` 成功后异步调用 Worker 发送通知
- 静默失败，不影响消息发送

**数据库：**
- `players.wechat_openid` 字段（真 OpenID，与现有假 openid 并存）
- 新建 `subscriptions` 表（记录用户订阅状态）

**新增文件：**
- `cloudflare-worker/index.js` — Worker 中转代码
- `cloudflare-worker/wrangler.toml` — 部署配置
- `docs/技术架构.md` — 云端技术架构文档（三端架构、数据表、通信方式、安全设计、费用）

**变更文件：**
- `supabase/schema.sql` — 新字段 + 新表
- `miniprogram/utils/api.js` — +4 个新函数
- `miniprogram/utils/config.js` — 新增 WORKER_URL
- `miniprogram/pages/scan/scan.js` — 加入时换真 OpenID
- `miniprogram/pages/chat/chat.js` — 订阅提醒条逻辑
- `miniprogram/pages/chat/chat.wxml` — 提醒条 UI
- `miniprogram/pages/chat/chat.wxss` — 提醒条样式
- `admin/js/state.js` — 新增 WORKER_URL + TEMPLATE_ID 常量
- `admin/js/messages.js` — 回复后触发通知

**部署前准备：**
1. 微信公众平台配置订阅消息模板 → 获得模板 ID
2. `npx wrangler deploy` 部署 Worker → 设置 `WECHAT_APPID` / `WECHAT_APPSECRET` 密钥
3. 更新 `SUBSCRIBE_TEMPLATE_ID` 和 `WORKER_URL` 为实际值
4. 小程序后台添加 Worker URL 到 request 合法域名
5. 在 Supabase SQL Editor 执行 schema 新增部分

## v1.8.17 (2026-06-03)

### 名牌编辑规则：首夜后玩家锁定，主持人始终可改

**规则定义：**
- 玩家在首夜后可修改自己的名牌，首夜过后（切换到第1天起）锁定不可改
- 主持人始终可以修改任意玩家的名牌，不受阶段限制

**小程序端：**
- `chat.js` / `evil-chat.js` — `onNicknameSave()` 增加阶段检查，非首夜时提示"首夜后无法修改名牌，请联系主持人"

**Web 主持端：**
- 左侧玩家列表和圆桌座位上，点击玩家名牌弹出修改对话框
- 悬停时名牌变为金色 + 显示 ✎ 编辑图标
- 新增 `editPlayerNickname()` 函数，直接更新 Supabase

**变更文件：**
- `miniprogram/pages/chat/chat.js` — 阶段检查
- `miniprogram/pages/evil-chat/evil-chat.js` — 阶段检查
- `admin/js/table.js` — 玩家列表/座位名牌可点击编辑
- `admin/js/room.js` — 新增 `editPlayerNickname()` 函数
- `admin/style.css` — 名牌悬停效果 + 编辑图标样式

## v1.8.16 (2026-06-03)

### 夜间队列迁移至消息面板顶部

夜间行动队列重新嵌入右侧消息面板顶部，与私聊/群聊/历史记录处于同一视觉区域，主持人处理队列时无需在页面上下移动目光。

### 新增「模拟加入」调试按钮

工具栏新增 `🧪 模拟加入` 按钮，点击弹出输入框即可批量添加测试玩家，无需手机扫码或浏览器控制台。

**功能详情：**
- 创建房间后工具栏显示虚线边框按钮
- 点击弹出输入框，默认建议补满至 15 人
- 自动检查圆桌 19 座上限，超出时提示
- 20 个预设西游昵称（孙悟空、猪八戒…）
- 退出房间后自动隐藏

**变更文件：**
- `admin/index.html` — 队列面板 DOM 移入 `#rt-message-panel` + 调试按钮
- `admin/style.css` — 队列面板边距适配 + 调试按钮样式
- `admin/app.js` — 新增 `debugAddPlayers()` / `debugAddTestPlayers()` / `debugClearTestPlayers()`
- `admin/js/room.js` — 显示/隐藏调试按钮

## v1.8.15 (2026-06-03)

### 修复 iPad 无法拖拽移动座位

圆桌座位拖拽原先只监听鼠标事件（mousedown/mousemove/mouseup），iPad 触摸屏不触发这些事件。新增 touch 事件支持（touchstart/touchmove/touchend/touchcancel），并提取 `finishDrag()` 公共逻辑复用。

**变更文件：**
- `admin/js/table.js` — `setupSeatSwap()` 新增触摸事件监听 + 踢出按钮豁免

## v1.8.14 (2026-06-03)

### 夜间记录新增阶段筛选功能

顶部阶段选择栏改为筛选模式：点击某个夜晚按钮只显示该夜晚记录，再次点击或点「全部」恢复显示所有夜晚。

**变更文件：**
- `admin/js/history.js` — 新增 `filterByPhase()` 替换 `scrollToPhase()`，新增「全部」按钮，数据刷新时自动重置筛选

## v1.8.13 (2026-06-02)

### 新增夜间行动历史记录

主持人可在右侧面板新 Tab「📋 夜间记录」查看每夜已处理的行动历史。

**功能详情：**
- 右侧消息面板新增第三个 Tab「📋 夜间记录」
- 自动查询 `skill_actions` 表，按夜晚阶段分组展示
- 每晚一组可折叠面板，默认展开最近一晚
- 顶部阶段快速跳转栏，点击滚动到对应夜晚
- 每条行动显示：序号、玩家、角色（分类颜色）、目标、状态标签（已完成/已跳过）、处理时间、备注
- 数据实时查询 Supabase，无需额外写入或表结构变更

**变更文件：**
- `admin/index.html` — 新增 tab 按钮 + 历史内容区 + script 引用
- `admin/js/history.js` — 新建：查询、分组、渲染、折叠交互
- `admin/js/evil-chat.js` — `switchMsgTab()` 扩展支持 'history' 分支
- `admin/js/room.js` — `hideRoomUI()` 清理历史区域
- `admin/style.css` — 新增 ~140 行历史面板样式

## v1.8.12 (2026-06-02)

### 布局优化：夜间队列移入右侧侧边栏

夜间队列面板从工具栏下方移入右侧消息面板顶部，与消息上下分屏，解决竖向堆叠导致圆桌空间被挤压的问题。

**改动内容：**
- 队列面板 DOM 移入 `#rt-message-panel` 内部
- 新增 `.night-layout` CSS class 控制夜间布局（队列在上，消息在下）
- 队列可折叠为仅标题条（`queue-folded` class），释放右侧空间
- 圆桌尺寸改为容器相对单位（`vh` → `%`），适配可用空间
- 白天阶段队列完全消失，消息占满右侧面板

### 变更文件
- `admin/index.html` — 队列面板 DOM 位置迁移
- `admin/style.css` — 夜间布局规则 + 圆桌尺寸修复
- `admin/js/queue.js` — body class 切换 + 折叠逻辑

## v1.8.11 (2026-06-02)

### 修复恶魔首夜技能缺失

两个恶魔的首夜技能未被配置 `firstNightOrder`，导致首夜不出现在队列中：

**阎王「生死簿」**：首夜需编写死亡名单
- `firstNightOrder: null` → `6` — 首夜出现在队列中编写生死簿
- `firstNightBlocked: true` 保持不变 — 阻止首夜触发每晚杀人

**红孩儿「三昧真火」**：首夜得知三个在场角色并选一人焚烧
- `firstNightOrder: null` → `6` — 首夜出现在队列中获知信息+选焚烧目标
- `firstNightBlocked: true` 保持不变 — 阻止首夜触发每晚杀人

### 变更文件
- `admin/data/roles.js` — 阎王 + 红孩儿 `firstNightOrder` 修正

## v1.8.10 (2026-06-02)

### 审计并修复白天/被动技能角色的 nightOrder 配置

全量审计 84 个角色的技能发动时机，修复 6 个错误配置了 `nightOrder` 的爪牙：

**白天技能（不应有 nightOrder）：**
- **黄风怪**「三昧神风」— 早晨发动 → `nightOrder: 5` → `null`
- **青狮精**「睚眦+负隅」— 提名触发+处决触发（全被动） → `nightOrder: 5` → `null`

**首夜一次性技能（后续每夜无需出现）：**
- **水神共工**「宿敌」— 仅首夜选择链接目标 → `nightOrder: 5` → `null`
- **玉兔精**「结亲」— 仅首夜结亲 + 处决触发(白天) → `nightOrder: 5` → `null`
- **鲤鱼精**「莲台泡影」— 一次性触发 → `nightOrder: 5` → `null`
- **千年树妖**「极度魔界」— 仅首夜标记 → `nightOrder: 5` → `null`

> 保留妲己 `nightOrder: 5`（目标死亡当夜可更换目标，属条件性夜间行动）
> 被动提醒型 nightOrder（陈光蕊9、白龙马2、元始天尊12）保留不变，仅用于主持人步骤提醒

### 变更文件
- `admin/data/roles.js` — 6 个爪牙 `nightOrder` 修正

## v1.8.9 (2026-06-02)

### 修复释迦夜间行动顺序

释迦的「超度」是早晨技能（宣布天亮后触发），并非夜间杀人。此前错误配置了 `nightOrder: 11`（恶魔通用杀人位），导致其出现在夜间队列中。

- `admin/data/roles.js`：释迦 `nightOrder: 11` → `null`（保留 `firstNightOrder: 6` 用于首夜学习爪牙信息）

## v1.8.8 (2026-06-02)

### 修复首夜队列过滤遗漏（第二版）

v1.8.7 补全了 10 个恶魔的 `firstNightBlocked: true`，但 `firstNightOrder` 不为 `null` 的角色仍会出现在首夜队列的 `pre`（信息位）列表中。

**根因**：10 个恶魔的 `firstNightOrder: 6` 代表"学习爪牙和伪装"通用设定步骤，并非角色专属能力。该步骤对所有恶魔生效，但队伍中有 `✳` 标记恶魔时，主持人不需要在队列中看到它们。

**修复方案**（v1.8.8 第二版）：
- 将 10 个 `✳` 恶魔的 `firstNightOrder` 从 `6` 改为 `null`（仅影响队列显示，不影响游戏规则）
- **保留** 狐狸精（firstNightOrder:4，魅惑）和金角大王（firstNightOrder:4，金葫芦）— 它们的首夜技能是主动目标选择，不应屏蔽
- **保留** 毗蓝婆（firstNightOrder:7）— 首夜被动信息获取
- **保留** 释迦、黑山老妖的 `firstNightOrder: 6` — 它们无 `✳` 标记，首夜可发动

### 变更文件
- `admin/data/roles.js` — 10 个恶魔 `firstNightOrder: 6` → `null`
- `admin/js/queue.js` — 回退 v1.8.8 第一版的 pre 列表过滤（避免误伤）

## v1.8.7 (2026-06-02)

### 修复首夜封锁数据缺失

v1.8.4 引入 `firstNightBlocked` 规则时，仅标记了 21 个角色，**遗漏了 10 个带 `✳` 的恶魔**，导致它们在首夜错误出现在技能队列中。

- **补全 10 个恶魔**的 `firstNightBlocked: true`：白骨精、九头虫、牛魔王、金翅大鹏、地涌夫人、红孩儿、阎王、黄眉老祖、通天教主、纣王
- 释迦、黑山老妖无 `✳` 标记，保持首夜可发动（不受影响）
- 24 个 `✳` 标记角色现已全部正确封锁

### 变更文件
- `admin/data/roles.js` — 10 个恶魔补全 `firstNightBlocked: true`
- `admin/js/queue.js` — 还原过滤逻辑（`!e.roleObj.firstNightBlocked` 维持 opt-out 设计）

## v1.8.6 (2026-06-02)

### 新增
- **快捷回复新增「选元素」按钮**：私聊回复区新增 🌪️ 选元素 快捷回复，点击发送"风火雷电请选择一个你想要的元素"，用于主持人询问玩家元素选择


、
### 变更文件
- `admin/index.html` — 快捷回复模板区新增一个按钮

## v1.8.5 (2026-06-02)

### 夜间队列显示优化

**技能简写：**
- 行动描述列从 `角色名 · 能力全文(截20字)` 改为仅显示技能简称（如"威仪"），角色名已在独立列显示，不再重复

**已处理项高亮：**
- 处理完成的队列行从 `opacity: 0.5` 变暗改为绿色左边框 + 微绿背景高亮
- 触发行/被动行完成态各有独立配色

**备注标签高亮：**
- `.queue-resolution` 改为金色边框+底色的标签样式（`#e8d070`），替代原来的灰色斜体

**手动处理目标输入：**
- 输入提示改为自由文本模式（如：3、3和4、5号），不再强制 `parseInt` 解析
- 原始输入存入 `item.targetRaw`，纯数字时额外匹配玩家ID
- 目标显示为青蓝色高亮文本（`.queue-target`），紧贴技能名右侧
- 备注标签紧贴目标右侧，三者形成连续信息流：`技能名 → 目标 [备注]`

### 变更文件
- `admin/js/queue.js` — 技能简写 + 目标自由文本 + 目标/备注紧贴布局
- `admin/style.css` — 已处理行高亮 + 目标青蓝色 + 备注金色标签

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
