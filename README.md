# dsh-ming-life

**东方玄学人生工作台** · DeepSeek Harness (DSH) 插件

**简体中文** | [English](README.en.md)

[![Release](https://img.shields.io/github/v/release/liqingb0220-stack/dsh-ming-life?label=release&color=2f855a)](https://github.com/liqingb0220-stack/dsh-ming-life/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933)](package.json)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-a3701a)](#安装)

> 排盘引擎算事实，规则引擎标信号，DSH 写解读。

`dsh-ming-life` 在 DSH Desktop 侧栏中提供一个完整的命理工作台。八字、紫微斗数、六爻、梅花易数、黄历由本地引擎排出，规则引擎标出值得关注的结构，每一段解读都由当前对话中的 DSH 现场撰写、自动写回档案并即时渲染。工作台本身不包含任何预写的解读文案。

---

## 目录

- [核心特性](#核心特性)
- [安装](#安装)
- [快速上手](#快速上手)
- [功能一览](#功能一览)
- [工作原理](#工作原理)
- [数据与隐私](#数据与隐私)
- [写回协议](#写回协议)
- [配置](#配置)
- [环境要求](#环境要求)
- [开发](#开发)
- [项目结构](#项目结构)
- [常见问题](#常见问题)
- [已知限制](#已知限制)
- [更新与卸载](#更新与卸载)
- [免责声明](#免责声明)
- [许可](#许可)

---

## 核心特性

- **三层分工，解读可追溯。** 排盘引擎只算事实，规则引擎只标信号，DSH 只写解读。任何一页都可展开「盘面事实与信号」，看到每句判断来自哪个十神、哪颗星、哪一年的干支。
- **五套体系，本地排盘。** 八字（基础盘 / 专业盘）、紫微斗数十二宫与四化、六爻纳甲、梅花易数体用、黄历宜忌与择日，全部离线计算，不依赖任何第三方服务。
- **真太阳时校正。** 填写出生地后按经度差与均时差校正时辰。内置 200 余个中国城市与 60 余个海外城市，海外城市按各自时区处理；认不出的地名可手填经度。
- **DSH 自动写回。** 打开任意页面即自动向绑定对话发出解读请求；DSH 完成后写回 `profile.json`，工作台通过长轮询即时渲染 Markdown。事实变化（如修改出生地）会自动重新请求。
- **不预言、不打分、不替人做决定。** 输出的是结构与倾向，没有「运势分」或「契合度」。措辞规则写在 `CONTEXT.md` 中，由 DSH 遵循。
- **多档案管理。** 一个档案对应一个人，可为家人、朋友分别建档，面板顶部下拉切换。所有数据保存在本机文件系统。
- **好公民式集成。** 只向侧栏底部注入一个按钮、向 shell overlay 挂载一个面板，与任何侧栏插件并存，无需停用 `ui-sidebar`。

---

## 安装

本插件面向 **DSH Desktop**，安装到 DSH 的 `web` profile。仓库已包含构建产物（`dist/`、`dsh/engines.mjs`），安装后无需再执行 build。

**macOS**

```bash
cd "$HOME/Library/Application Support/dsh-desktop/harness/profiles/web"
../../.desktop-bin/pnpm add github:liqingb0220-stack/dsh-ming-life
```

**Windows (PowerShell)**

```powershell
cd "$env:APPDATA\dsh-desktop\harness\profiles\web"
..\..\.desktop-bin\pnpm add github:liqingb0220-stack/dsh-ming-life
```

然后编辑该目录下的 `package.json`，将 `"ming-life"` 加入 `dsh.profile.bundles` 数组：

```jsonc
{
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "ming-life"
      ]
    }
  }
}
```

重启 DSH Desktop。侧栏底部出现「☯ 玄学工作台」即安装成功。

<details>
<summary>以本地开发方式安装（link 模式）</summary>

```bash
git clone https://github.com/liqingb0220-stack/dsh-ming-life.git ~/ming-life
cd ~/ming-life && npm install && npm run build:dsh

cd "$HOME/Library/Application Support/dsh-desktop/harness/profiles/web"
../../.desktop-bin/pnpm add link:$HOME/ming-life
# 同样把 "ming-life" 加入 dsh.profile.bundles，然后重启 DSH Desktop
```

- 修改 `src/` 下的前端或引擎代码：执行 `npm run build:dsh`，刷新面板即可。
- 修改 `dsh/index.js`、`lib/client.js` 或 `CONTEXT.md` 生成逻辑：需要重启 DSH Desktop。

</details>

---

## 快速上手

1. 点击侧栏底部「☯ 玄学工作台」，在面板顶部选择「新建档案」，填写姓名、出生日期时间（24 小时制）与出生地。
2. 工作台会把当前对话绑定到该档案，并在输入框预填一段开场白。按回车发送，DSH 即读取 `CONTEXT.md` 并进入角色。
3. 首屏「命盘开卷」会自动把盘面事实与信号发给 DSH。页面显示加载状态，DSH 写完后解读自动出现。
4. 之后每打开一页（我是谁、我将去向何方、地点……）都会自动发出一次请求；同一页面事实未变化时不会重复请求。
5. 「我有事想问」直接用自己的话提问；工具阁中任何排盘结果都可点「请 DSH 解读」。

---

## 功能一览

| 页面 | 工作台提供 | DSH 撰写 |
| --- | --- | --- |
| **命盘开卷** | 四柱、日主强弱与喜用、命宫、今年六个方面的信号 | 总体判断，六个方面各一两句 |
| **我是谁** | 五行占比、十神占比（按相对日主的五行上色）、六个维度、紫微十二宫 | 最像自己的时候 / 最容易吃亏的地方 / 反复出现的矛盾；决策方式与舒适环境 |
| **我将去向何方** | 当前大运流年与六个方面；逐年 / 大运表格与人生地图；点击任一年查看该年事实 | 现在与未来十年信号最集中的几段；单独某一年的解读 |
| **我有事想问** | 一个输入框；为该问题起六爻与梅花卦，摆出今年盘面 | 这件事实际在问什么；必要时追问；命局 / 时机 / 卦象怎么看。你的追问作为同一问题的下一轮，可在解读里切换查看；可记录后续 |
| **谁与我同行** | 双方结构对照（六维、日主关系、日支关系）；对方同样按出生地做真太阳时 | 相近之处、差异与摩擦、可分工的地方；不给契合度 |
| **我的另一条时间线** | 固定一个前提「如果当年我……」与分叉年的大运流年 | 分叉后的头几年、走到今天、哪些不会变、多出来与少掉的 |
| **地点**（国内版 / 国际版） | 以出生地为原点的八方位卦与五行、桃花位、驿马位、迁移宫，及各方位下的城市 | 定情之地、转折之地、奇遇之地、安顿之地；可点名询问任意地点 |
| **起名** | 姓氏读音五行、命局喜用、传统起名规则、一批用字材料 | 直接给出 5 个名字并说明字义、读音、五行；工作台逐个核对读音、五行、笔画 |
| **工具阁** | 八字（基础盘 / 专业盘）、紫微斗数、六爻、梅花易数、易经六十四卦、黄历、择日（自由描述事项）、地点、起名 | 每处均可「请 DSH 解读」 |

六个方面固定为：事业、财富、关系、迁移、创造、身心。

---

## 工作原理

```
用户打开某一页
      │
      ▼
┌──────────────┐  四柱 · 大运流年 · 宫位星曜 · 卦象 · 真太阳时
│   排盘引擎    │ ─────────────────────────────────────────┐
└──────────────┘                                          │
      │                                                   ▼
┌──────────────┐  十神偏重/缺失 · 干支关系 · 四化      ┌──────────────────────────┐
│   规则引擎    │ ─ 每年六个方面的强弱 ──────────────▶ │ 【工作台请求解读 #key】   │
└──────────────┘                                      │   事实 + 信号 + 写什么    │
                                                      └────────────┬─────────────┘
                                                                   │ 自动发送到绑定的对话
                                                                   ▼
                                                      ┌──────────────────────────┐
                                                      │           DSH            │
                                                      │  写解读 → 写回            │
                                                      │  profile.json            │
                                                      │  interpretations[key]    │
                                                      └────────────┬─────────────┘
                                                                   │ 文件变化（长轮询）
                                                                   ▼
                                                      工作台渲染 Markdown，附事实与信号
```

| 层 | 职责 | 代码 |
| --- | --- | --- |
| 排盘引擎 | 算**事实**：四柱、藏干十神、大运流年、紫微十二宫与四化、六爻纳甲、梅花体用、黄历宜忌、真太阳时 | `src/engines/bazi.js` `ziwei.js` `liuyao.js` `meihua.js` `almanac.js` `solar.js` |
| 规则引擎 | 标**信号**：只标记，不解释。十神偏重与缺失、干支合冲刑害、紫微关键宫位与四化、命局张力、每年六个方面的强弱 | `src/engines/signals.js` `places.js` `naming.js` |
| DSH | 写**解读**：理解问题、选择体系、追问、综合共识与分歧、选择表达形式 | `src/dsh/facts.js`（请求构造）· `CONTEXT.md`（分工与规则） |

DSH 是理解者而非客服：用户不需要为问题分类，问题、事实、信号一起交给 DSH，由它决定用哪几套体系、要不要追问。

---

## 数据与隐私

全部数据保存在本机，插件不连接任何第三方服务。

```
~/Documents/DSH 玄学项目/<档案名>/
├── profile.json     档案本体：出生信息、问题、合盘对象、时间线、起名记录、DSH 写回的解读
└── CONTEXT.md       写给 DSH 的上下文：分工、措辞规则、盘面事实与信号、待写回的请求、编辑边界
```

- 工作台每次改动都写回 `profile.json`；外部（包括 DSH）修改该文件后，工作台 2 到 3 秒内自动刷新。
- 删除档案是移动到 `.trash/`，不是物理删除。
- 解读请求只发送到你在 DSH 中绑定的那个对话，使用 DSH 自身配置的模型。
- 措辞规则写在 `CONTEXT.md` 中：留有余地、不使用「必然 / 注定 / 劫 / 灾 / 凶」、不替用户做决定、不制造焦虑、关系人一律使用「伴侣 / 家人 / 同事」等中性称谓、不复述用户的私人细节。

---

## 写回协议

工作台与 DSH 共用 `profile.json` 作为唯一事实源。每条解读请求以 `【工作台请求解读 #key】` 开头，DSH 回答后将同样内容写入：

```jsonc
"interpretations": {
  "reveal": {                                // key
    "status": "done",                        // 工作台发请求时写 pending，DSH 完成后改为 done
    "request": { "hash": "…", "at": "…" },   // 工作台写入，DSH 不修改；事实变化时 hash 会变
    "text": "## 事业\n……",                   // DSH 的回答，Markdown
    "at": "2026-09-09T03:12:00Z"
  }
}
```

| key | 页面 |
| --- | --- |
| `reveal` · `who` · `where-to` | 命盘开卷 / 我是谁 / 我将去向何方 |
| `year:YYYY` | 某一年 |
| `event:<id>` | 我有事想问 |
| `event:<id>#N` | 我有事想问 · 第 N 轮追问（N 从 2 起） |
| `person:<id>` | 谁与我同行 |
| `alt:<id>` | 我的另一条时间线 |
| `places` · `places:intl` | 地点 国内版 / 国际版 |
| `naming:<hash>` | 起名 |

「我有事想问」中的追问同样走写回协议：每一轮是独立的 key，消息里带着前几轮问答。以 `【工具阁】` 开头的消息只在对话中回答，不写入文件。DSH 可写的字段仅限 `interpretations[key].status / text / at` 与 `events[].outcome`；出生信息、问题原文、卦象、`request` 均不允许修改。

---

## 配置

| 环境变量 | 默认值 | 说明 |
| --- | --- | --- |
| `DSH_MING_LIFE_ROOT` | `~/Documents/DSH 玄学项目` | 档案根目录 |
| `DSH_MING_LIFE_DIST` | 插件内的 `dist/` | 前端构建产物位置 |

URL 参数（调试用）：

| 参数 | 说明 |
| --- | --- |
| `?project=<档案名>` | 直接打开指定档案 |
| `&shot=1` | 截图模式：不开启长轮询、不自动发出请求 |
| `#who` 等锚点 | 直达某一页 |

---

## 环境要求

| 项目 | 要求 |
| --- | --- |
| 宿主 | DSH Desktop（DeepSeek Harness 桌面版），`web` profile |
| Node.js | ≥ 20（仅开发与构建需要） |
| 对等依赖 | `@deepseek-ai/cordis`、`@deepseek-ai/dsh-host-webserver`（由 DSH 提供） |
| 客户端注入 | `dsh-client-ui-slots`、`dsh-client-ui-conversation`、`dsh-client-ui-layout`、`dsh-api-session-controller` |

---

## 开发

```bash
npm install
npm run dev            # 单机模式（localStorage），http://localhost:5173
npm run dev:host 5199  # 不开 DSH，用裸 http 服务模拟宿主：/api/ming-life/app/?project=<档案>
npm run build:dsh      # 构建前端（base=/api/ming-life/app/）并打包 node 侧使用的 engines.mjs
npm run check          # 语法检查 + 插件 node 侧测试
npm run test:dsh       # 插件 node 侧：路由、CONTEXT 生成、会话绑定、watch、静态托管、迁移
./runtest.sh tests/test-v2.mjs   # 真太阳时、规则引擎、请求构造、写回协议、地点、起名
./runtest.sh tests/test-all.mjs  # 排盘与基础链路回归；另有 test-p1 / test-reverse / test-reveal
./checkhooks.sh        # 静态检查 React hook 是否漏导入
```

引擎测试不依赖测试框架，用 esbuild 打包后由 node 直接运行，完整清单见 [`tests/README.md`](tests/README.md)。

插件遵循 DSH 的 cordis 插件约定：

| 文件 | 职责 |
| --- | --- |
| `dsh/index.js` | node 侧。注册 `/api/ming-life/*`：`projects`（列出 / 新建 / 重命名 / 删除）、`bootstrap`、`save`、`action`、`watch`（长轮询）、`app/*`（托管 SPA） |
| `lib/client.js` | 浏览器侧。侧栏按钮、覆盖层面板、档案下拉、iframe；把解读请求直接 submit 到绑定的对话 |
| `cordis.patch.yml` + `package.json#dsh` | 插件声明与客户端注入 |

---

## 项目结构

```
src/
├── engines/        排盘与规则：bazi ziwei liuyao meihua almanac solar signals places naming reverse …
├── dsh/            facts.js（解读请求）· context-entry.js（CONTEXT.md）· bridge.js（宿主适配）
├── pages/          Reveal WhoAmI Timeline Ask WhoWithMe Alternate WhereToGo Naming WhenToGo Tools …
├── components/     Interpretation（DSH 解读块）· Md · AskDSH · HexagramView · LifeMap …
├── data/           geo（城市经纬度与时区）· stars · tenGods · nameChars · hexagrams · colors …
└── store/          档案状态与持久化（单机 localStorage / 宿主 profile.json）
dsh/index.js        插件 node 侧
lib/client.js       插件浏览器侧
dist/               前端构建产物（已提交）
tests/              node 回归套件
```

---

## 常见问题

**解读页面一直显示加载？**
说明 DSH 尚未写回。请确认当前对话已绑定到该档案，且开场白已发送。处于等待中的请求不会自动重发；等待超过约 150 秒后页面会出现「再发一次」，已完成的解读可随时点「重新解读」。

**修改了出生时间或出生地，旧解读还在？**
事实变化后 `request.hash` 会变，工作台自动重新发出请求，旧解读被新解读覆盖。

**出生地认不出来？**
内置城市表未覆盖的地名可直接手填经度，真太阳时按经度计算。

**能否用于多人？**
可以。一个档案对应一个人，面板顶部下拉切换；合盘（谁与我同行）中的对方信息保存在当前档案内，不单独建档。

**换了模型或换了对话会怎样？**
解读请求只发到当前绑定的对话。换绑后，等待中的请求需要在页面上点「再发一次」才会发到新对话；已写回的解读保留在档案中，不受影响。

---

## 已知限制

- 紫微斗数依赖公历出生日期；仅录入四柱的档案会反推候选日期，需要用户确认年份。
- 真太阳时校正依赖内置城市表；认不出的地名需手填经度。
- 解读质量取决于 DSH 所配置的模型。
- 「我的另一条时间线」是叙事性的可能性推演，与真实档案分开存放，不写入事件。

---

## 更新与卸载

**更新**

```bash
cd "$HOME/Library/Application Support/dsh-desktop/harness/profiles/web"
../../.desktop-bin/pnpm update ming-life
```

重启 DSH Desktop。

**卸载**

1. 从 `package.json` 的 `dsh.profile.bundles` 中移除 `"ming-life"`。
2. 在同一目录执行 `../../.desktop-bin/pnpm remove ming-life`。
3. 重启 DSH Desktop。

档案目录 `~/Documents/DSH 玄学项目/` 不受影响，可手动删除。

---

## 免责声明

所有命理与占卜内容仅作为传统文化与娱乐体验，不构成科学判断，也不构成医疗、法律、投资、教育或其他现实决策建议。

---

## 许可

[MIT](LICENSE) © liqingb0220-stack
