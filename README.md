# OC应用集市 · 官网（首页 + 应用集市页）

依据参考设计稿（蓝底 #1A6CB5 + 白色 C 形标志 + 橙色圆点 #F9A61C）还原的静态首页，纯 HTML / CSS / 原生 JS，无需构建、无外部依赖。

## 目录结构

```
index.html                    首页结构（首屏 + 下方滚动内容）
market.html                   应用集市页（公示 files/ 内的全部文件）
files/                        待公示的安装包目录（.exe 等）
tools/generate-files-data.js  扫描 files/ 生成清单数据
assets/css/style.css          全部样式（含响应式与无障碍处理）
assets/js/main.js             交互：滚动入场、数字滚动、页脚年份
assets/js/files-data.js       【自动生成】文件清单数据，勿手工修改
assets/js/market.js           应用集市页：渲染列表、搜索、排序
assets/img/logo.svg           首屏大标志（白 C + 橙点，用于深色底）
assets/img/logo-mark.svg      备用小标志（蓝 C + 橙点，当前两个页面均未引用）
assets/img/favicon.svg        站点图标（蓝底圆角 + C + 橙点）
```

## 本地预览

直接双击 `index.html` 即可；或在当前目录执行：

```powershell
python -m http.server 5173
# 首页      http://localhost:5173/index.html
# 应用集市页 http://localhost:5173/market.html
```

> 注：集市页的下载按钮指向 `files/xxx.exe`，用 `python -m http.server` 预览时可直接下载；
> 双击本地文件（file://）预览时列表与搜索依旧可用，但部分浏览器会拦截本地 `.exe` 下载。

## 页面内容（首屏向下滚动可见）

| 区块 | id | 说明 |
| --- | --- | --- |
| 首屏艺术区 | `#home` | 还原参考稿构图：左侧 C 形标志，右侧「OC应用集市 + 快捷 · 方便 · 齐全」 |
| 核心特色 | `#features` | 快捷 / 方便 / 齐全 / 安全 四张卡片 |
| 应用分类 | `#apps` | 六大应用分类卡片，带数量标签 |
| 平台数据 | `#stats` | 蓝底数据条，数字滚动动画 |
| 行动号召 | `#join` | 深蓝底 + 橙色主按钮 |
| 页脚 | `#about` | 品牌、站点导航（应用集市 / 核心特色 / 平台数据…）、联系方式 |

## 橙色「进入集市」按钮

首页现有 2 处（首屏标题下方 `btn--lg`、底部 CTA 的 `btn--lg`），统一使用 `.btn.btn--orange`，
均指向自建的集市页 `market.html`；六个分类卡片的「查看应用」也指向该页。
（导航栏内的 `btn--sm` 与移动端菜单内的按钮，已随「顶部导航栏」一并移除。）
若日后要改为外部集市域名，全局替换 `href="market.html"` 即可（例如改为 `https://market.example.com`）。

## 美术还原要点

- 主色 `#1A6CB5`、点缀橙 `#F9A61C`，与参考稿一致（见 `style.css` 顶部 CSS 变量）。
- C 形标志用 SVG 描边 + `stroke-dasharray` 画出 52° 开口，开口朝右，中心橙色圆点独立绘制，缩放不失真。
- 首屏为整屏（`100vh` / `100svh`）纯色蓝，标题字号、标志占比均用 `clamp()` 按参考稿比例换算，窄屏自动堆叠。
- 首屏不加任何装饰元素（顶部导航栏与「向下滚动」提示已按需求移除），整屏只保留标志与标题，避免干扰艺术区构图。

## 应用集市页（market.html）

与首页共用同一套设计语言（蓝底头部 + 橙色按钮 + 白色卡片），页面内容全部由数据驱动：

| 功能 | 说明 |
| --- | --- |
| 顶部统计 | 文件数量、总容量、最近更新日期、公示目录名（读取 `window.OC_MARKET_DIR`） |
| 搜索框 | 匹配应用名 / 类型 / 版本号 / 文件名，实时过滤 |
| 排序 | 按名称、按大小（升 / 降）、按更新时间（新 → 旧） |
| 文件卡片 | 首字母色块、名称、版本徽标、「最新」徽标、文件名、大小、日期、类型、下载按钮 |
| 下载说明 | 便携版 / 安装版 / 多版本共存 / SmartScreen 安全提示 |
| 空状态 | 无匹配结果时显示提示；列表容器带 `aria-live="polite"`，搜索结果可被读屏播报 |

### 文件清单如何生成

清单不写死在 HTML 中，而是由脚本扫描 `files/` 目录后生成 `assets/js/files-data.js`：

```powershell
node tools/generate-files-data.js
```

- 生成的是普通 `<script>` 数据文件，所以**双击页面（file://）也能正常显示**，无需服务器与 `fetch`。
- 新增 / 删除 `files/` 中的文件后，重新执行一次该命令即可刷新公示内容。
- 命名解析规则：`应用名-类型-版本号.ext`。例如 `CSS编辑器-便携版-1.2.1.exe` →
  应用名 `CSS编辑器`、类型 `便携版`、版本 `1.2.1`；不含版本号的文件归入「其他工具」。
- 同名的「应用 + 类型」组合中版本号最高的一项会自动标注「最新」徽标。
- 当前公示内容：**8 个 `.exe` 文件，合计 462.1 MB**，最近更新 2026-10-11。

> 说明：待公示目录原名 `fies`（拼写笔误），已重命名为 `files` 以与页面文案一致；
> 生成脚本对两种目录名都兼容（优先 `files`）。

## 元素精简说明

按需求移除了以下三处界面元素，相关样式与脚本已一并清理（不留死代码）：

| 移除内容 | 位置 | 连带清理 |
| --- | --- | --- |
| 顶部导航栏（含移动端汉堡菜单） | `index.html`、`market.html` | `style.css` 的 `.site-header` / `.brand` / `.nav` / `.nav-toggle` / `.mobile-menu` 及 `860px` 媒体查询、`--header-h` 变量、`main.js` 里的导航变色与菜单逻辑 |
| 「向下滚动」鼠标提示 | `index.html` 首屏 | `style.css` 的 `.hero__scroll` / `.hero__mouse` / `@keyframes wheel` |
| 分类筛选标签（全部 / 便携版 / 安装版 / 其他工具） | `market.html` | `style.css` 的 `.chips` / `.chip`、`market.js` 的 `renderChips()`、标签点击事件与 `state.variant` |

- 现在站点导航由**页脚**的「产品 / 支持 / 联系」栏目承担（集市页可经页脚回到首页各区块）。
- 锚点偏移量由 `--header-h`（72px）改为固定 `24px`；首屏与集市页头部的上内边距同步收紧。
