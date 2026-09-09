# dsh-ming-life

**Eastern Metaphysics Life Workbench** · a DeepSeek Harness (DSH) plugin

[简体中文](README.md) | **English**

[![Release](https://img.shields.io/github/v/release/liqingb0220-stack/dsh-ming-life?label=release&color=2f855a)](https://github.com/liqingb0220-stack/dsh-ming-life/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933)](package.json)
[![DSH plugin](https://img.shields.io/badge/DSH-plugin-a3701a)](#installation)

> Chart engines compute the facts. A rule engine flags the signals. DSH writes the reading.

`dsh-ming-life` adds a complete Chinese metaphysics workbench to the DSH Desktop sidebar. BaZi (Four Pillars), Zi Wei Dou Shu, Liu Yao, Mei Hua Yi Shu and the traditional almanac are all computed by local engines. A rule engine marks the structures worth attention. Every paragraph of interpretation is written live by the DSH conversation you are in, saved back to the profile and rendered immediately. The workbench itself ships with no pre-written readings.

---

## Contents

- [Highlights](#highlights)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Features](#features)
- [How it works](#how-it-works)
- [Data and privacy](#data-and-privacy)
- [Write-back protocol](#write-back-protocol)
- [Configuration](#configuration)
- [Requirements](#requirements)
- [Development](#development)
- [Project layout](#project-layout)
- [FAQ](#faq)
- [Known limitations](#known-limitations)
- [Update and uninstall](#update-and-uninstall)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Highlights

- **Three layers, traceable readings.** The chart engines only compute facts, the rule engine only flags signals, and DSH only writes interpretation. Any page can expand "chart facts and signals" to show which Ten God, which star or which year's stems and branches a sentence rests on.
- **Five systems, all computed locally.** BaZi (basic and professional chart), Zi Wei Dou Shu with the twelve palaces and Four Transformations, Liu Yao with Na Jia, Mei Hua body/use analysis, almanac do's and don'ts with date selection. Everything runs offline with no third-party service.
- **True solar time.** Once a birthplace is entered, the birth hour is corrected for longitude and the equation of time. Over 200 Chinese cities and 60 overseas cities are built in, overseas cities use their own time zones, and unknown places accept a manual longitude.
- **Automatic write-back by DSH.** Opening any page sends an interpretation request to the bound conversation. When DSH finishes it writes to `profile.json`, and the workbench renders the Markdown through long polling. When the facts change (for example a corrected birthplace), the request is sent again automatically.
- **No prophecy, no scores, no decisions made for you.** Output describes structure and tendency. There is no "luck score" or "compatibility percentage". The wording rules live in `CONTEXT.md` and DSH follows them.
- **Multiple profiles.** One profile per person, so family and friends can each have their own. Switch from the dropdown at the top of the panel. All data stays on the local file system.
- **A good citizen inside DSH.** The plugin injects one button at the bottom of the sidebar and mounts one panel on the shell overlay. It coexists with any sidebar plugin and does not require disabling `ui-sidebar`.

---

## Installation

The plugin targets **DSH Desktop** and installs into the `web` profile. The repository already contains build output (`dist/`, `dsh/engines.mjs`), so no build step is needed after installing.

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

Then edit `package.json` in that directory and add `"ming-life"` to the `dsh.profile.bundles` array:

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

Restart DSH Desktop. A "☯ 玄学工作台" button at the bottom of the sidebar means the install succeeded.

<details>
<summary>Install for local development (link mode)</summary>

```bash
git clone https://github.com/liqingb0220-stack/dsh-ming-life.git ~/ming-life
cd ~/ming-life && npm install && npm run build:dsh

cd "$HOME/Library/Application Support/dsh-desktop/harness/profiles/web"
../../.desktop-bin/pnpm add link:$HOME/ming-life
# add "ming-life" to dsh.profile.bundles as above, then restart DSH Desktop
```

- Changed front-end or engine code under `src/`: run `npm run build:dsh` and refresh the panel.
- Changed `dsh/index.js`, `lib/client.js` or the `CONTEXT.md` generator: restart DSH Desktop.

</details>

---

## Quick start

1. Click "☯ 玄学工作台" at the bottom of the sidebar, choose "New profile" at the top of the panel and enter a name, birth date and time (24-hour) and birthplace.
2. The workbench binds the current conversation to that profile and pre-fills an opening line in the input box. Press Enter to send it. DSH reads `CONTEXT.md` and takes on the role.
3. The first screen, "Chart Opening", automatically sends the chart facts and signals to DSH. The page shows a loading state and the reading appears when DSH has written it.
4. Every page you open afterwards (Who I Am, Where I'm Heading, Places, ...) sends one request. A page whose facts have not changed is not requested again.
5. "Ask a Question" takes a question in your own words. Any chart result in the Toolbox has an "Ask DSH" button.

---

## Features

| Page | Provided by the workbench | Written by DSH |
| --- | --- | --- |
| **Chart Opening** | Four Pillars, Day Master strength and favorable elements, Life Palace, this year's signals across six domains | An overall judgement, one or two sentences per domain |
| **Who I Am** | Five-element and Ten-God proportions (colored by element relative to the Day Master), six dimensions, the twelve Zi Wei palaces | When I am most myself / where I most easily lose out / recurring conflicts; how I decide and where I feel comfortable |
| **Where I'm Heading** | Current luck cycle and annual signals across six domains; year-by-year and cycle tables with a life map; click any year for its facts | The most concentrated stretches of now and the next ten years; a reading for any single year |
| **Ask a Question** | One input box; a Liu Yao and a Mei Hua hexagram cast for the question, plus this year's chart | What the question is really asking; clarifying questions when needed; how the chart, the timing and the hexagrams read. Each follow-up becomes the next round of the same question and can be switched to inside the reading; outcomes can be recorded |
| **Who Walks With Me** | Side-by-side structure of two people (six dimensions, Day Master relation, Day Branch relation); the other person gets true solar time from their birthplace too | Where you are alike, where you differ and rub, what can be divided up; no compatibility score |
| **My Other Timeline** | One fixed premise, "if back then I had...", with the luck cycle and year of the fork | The first years after the fork, where it leads today, what would not change, what is gained and lost |
| **Places** (domestic / international) | Eight-direction trigrams and elements centered on the birthplace, peach-blossom and travelling-horse directions, the Travel Palace, and cities under each direction | Places for love, for turning points, for serendipity, for settling; ask about any named place |
| **Naming** | Surname phonetics and element, favorable elements, traditional naming rules, a batch of candidate characters | Five names with meaning, sound and element explained; the workbench verifies pronunciation, element and stroke count one by one |
| **Toolbox** | BaZi (basic / professional), Zi Wei Dou Shu, Liu Yao, Mei Hua, the 64 hexagrams of the I Ching, almanac, date selection (free-text purpose), places, naming | "Ask DSH" everywhere |

The six domains are fixed: Career, Wealth, Relationships, Relocation, Creativity, Body & Mind.

---

## How it works

```
User opens a page
      │
      ▼
┌──────────────┐  pillars · luck cycles · palaces and stars · hexagrams · true solar time
│ Chart engine │ ─────────────────────────────────────────────────┐
└──────────────┘                                                  │
      │                                                           ▼
┌──────────────┐  Ten-God excess/absence · stem-branch      ┌──────────────────────────────┐
│ Rule engine  │ ─ relations · transformations · six ─────▶ │ [Workbench request #key]     │
└──────────────┘   domains per year                         │  facts + signals + what to   │
                                                            │  write                       │
                                                            └──────────────┬───────────────┘
                                                                           │ sent to the bound conversation
                                                                           ▼
                                                            ┌──────────────────────────────┐
                                                            │             DSH              │
                                                            │  writes the reading →        │
                                                            │  profile.json                │
                                                            │  interpretations[key]        │
                                                            └──────────────┬───────────────┘
                                                                           │ file change (long polling)
                                                                           ▼
                                                            workbench renders Markdown with facts and signals
```

| Layer | Responsibility | Code |
| --- | --- | --- |
| Chart engine | Computes **facts**: Four Pillars, hidden stems and Ten Gods, luck cycles and annual pillars, Zi Wei palaces and Four Transformations, Liu Yao Na Jia, Mei Hua body/use, almanac, true solar time | `src/engines/bazi.js` `ziwei.js` `liuyao.js` `meihua.js` `almanac.js` `solar.js` |
| Rule engine | Flags **signals** without explaining them: Ten-God excess and absence, stem-branch combinations and clashes, key Zi Wei palaces and transformations, tensions in the chart, strength of six domains per year | `src/engines/signals.js` `places.js` `naming.js` |
| DSH | Writes the **reading**: understands the question, picks the systems, asks back, weighs agreement and disagreement, chooses the form | `src/dsh/facts.js` (request builder) · `CONTEXT.md` (division of labor and rules) |

DSH acts as an interpreter, not a help desk. Users do not classify their question. The question, the facts and the signals go to DSH together, and it decides which systems to use and whether to ask back.

---

## Data and privacy

All data stays on your machine. The plugin connects to no third-party service.

```
~/Documents/DSH 玄学项目/<profile name>/
├── profile.json     the profile: birth data, questions, relationship charts, timelines, naming runs, readings written by DSH
└── CONTEXT.md       context for DSH: division of labor, wording rules, chart facts and signals, pending requests, editing boundaries
```

- Every change in the workbench is saved to `profile.json`. When anything else (including DSH) edits the file, the workbench refreshes within two or three seconds.
- Deleting a profile moves it to `.trash/` rather than removing it.
- Interpretation requests go only to the conversation you bound in DSH and use the model DSH is configured with.
- The wording rules in `CONTEXT.md`: leave room, avoid "certain / destined / calamity / disaster / ominous", never decide for the user, never manufacture anxiety, refer to other people only as "partner / family / colleague", never repeat the user's private details.

---

## Write-back protocol

The workbench and DSH share `profile.json` as the single source of truth. Each request starts with `【工作台请求解读 #key】`. After answering, DSH writes the same content into:

```jsonc
"interpretations": {
  "reveal": {                                // key
    "status": "done",                        // the workbench writes pending; DSH sets done when finished
    "request": { "hash": "…", "at": "…" },   // written by the workbench, never modified by DSH; the hash changes when facts change
    "text": "## Career\n……",                 // DSH's answer, Markdown
    "at": "2026-09-09T03:12:00Z"
  }
}
```

| key | Page |
| --- | --- |
| `reveal` · `who` · `where-to` | Chart Opening / Who I Am / Where I'm Heading |
| `year:YYYY` | A single year |
| `event:<id>` | Ask a Question |
| `event:<id>#N` | Ask a Question · follow-up round N (N starts at 2) |
| `person:<id>` | Who Walks With Me |
| `alt:<id>` | My Other Timeline |
| `places` · `places:intl` | Places, domestic / international |
| `naming:<hash>` | Naming |

Follow-ups inside "Ask a Question" use the same protocol: each round is its own key and the message carries the earlier rounds. Messages starting with `【工具阁】` (Toolbox) are answered in the conversation only and never written to file. DSH may write only `interpretations[key].status / text / at` and `events[].outcome`. Birth data, the original question, the hexagrams and every `request` field are off limits.

---

## Configuration

| Environment variable | Default | Meaning |
| --- | --- | --- |
| `DSH_MING_LIFE_ROOT` | `~/Documents/DSH 玄学项目` | Root directory for profiles |
| `DSH_MING_LIFE_DIST` | `dist/` inside the plugin | Location of the front-end build |

URL parameters (for debugging):

| Parameter | Meaning |
| --- | --- |
| `?project=<profile name>` | Open a specific profile directly |
| `&shot=1` | Screenshot mode: no long polling, no automatic requests |
| `#who` and other anchors | Jump straight to a page |

---

## Requirements

| Item | Requirement |
| --- | --- |
| Host | DSH Desktop (DeepSeek Harness desktop app), `web` profile |
| Node.js | ≥ 20 (development and build only) |
| Peer dependencies | `@deepseek-ai/cordis`, `@deepseek-ai/dsh-host-webserver` (provided by DSH) |
| Client injection | `dsh-client-ui-slots`, `dsh-client-ui-conversation`, `dsh-client-ui-layout`, `dsh-api-session-controller` |

---

## Development

```bash
npm install
npm run dev            # standalone mode (localStorage), http://localhost:5173
npm run dev:host 5199  # simulate the host with a bare http server, no DSH needed: /api/ming-life/app/?project=<profile>
npm run build:dsh      # build the front end (base=/api/ming-life/app/) and bundle engines.mjs for the node side
npm run check          # syntax check + node-side plugin tests
npm run test:dsh       # node side: routes, CONTEXT generation, session binding, watch, static hosting, migration
./runtest.sh tests/test-v2.mjs   # true solar time, rule engine, request builder, write-back protocol, places, naming
./runtest.sh tests/test-all.mjs  # chart and core regression; see also test-p1 / test-reverse / test-reveal
./checkhooks.sh        # static check for missing React hook imports
```

Engine tests use no test framework. They are bundled with esbuild and run directly with node. The full list is in [`tests/README.md`](tests/README.md).

The plugin follows DSH's cordis plugin conventions:

| File | Responsibility |
| --- | --- |
| `dsh/index.js` | Node side. Registers `/api/ming-life/*`: `projects` (list / create / rename / delete), `bootstrap`, `save`, `action`, `watch` (long polling), `app/*` (hosts the SPA) |
| `lib/client.js` | Browser side. Sidebar button, overlay panel, profile dropdown, iframe; submits interpretation requests straight into the bound conversation |
| `cordis.patch.yml` + `package.json#dsh` | Plugin declaration and client injection |

---

## Project layout

```
src/
├── engines/        charts and rules: bazi ziwei liuyao meihua almanac solar signals places naming reverse …
├── dsh/            facts.js (requests) · context-entry.js (CONTEXT.md) · bridge.js (host adapter)
├── pages/          Reveal WhoAmI Timeline Ask WhoWithMe Alternate WhereToGo Naming WhenToGo Tools …
├── components/     Interpretation (DSH reading block) · Md · AskDSH · HexagramView · LifeMap …
├── data/           geo (city coordinates and time zones) · stars · tenGods · nameChars · hexagrams · colors …
└── store/          profile state and persistence (standalone localStorage / hosted profile.json)
dsh/index.js        plugin node side
lib/client.js       plugin browser side
dist/               front-end build (committed)
tests/              node regression suites
```

---

## FAQ

**A reading page keeps loading.**
DSH has not written back yet. Check that the current conversation is bound to this profile and that the opening line was sent. A pending request is not resent automatically. After about 150 seconds the page offers "Send again", and any finished reading has a "Reinterpret" button.

**I changed the birth time or birthplace but the old reading is still there.**
When the facts change, `request.hash` changes and the workbench sends a new request. The old reading is replaced by the new one.

**My birthplace is not recognized.**
Enter the longitude by hand for places outside the built-in city table. True solar time is computed from longitude.

**Can I use it for several people?**
Yes. One profile per person, switched from the dropdown at the top of the panel. The other person in "Who Walks With Me" is stored inside the current profile and does not need a profile of their own.

**What happens if I switch models or conversations?**
Requests go only to the currently bound conversation. After rebinding, pending requests need "Send again" on the page to reach the new conversation. Readings already written stay in the profile.

---

## Known limitations

- Zi Wei Dou Shu needs a Gregorian birth date. A profile entered only as Four Pillars gets candidate dates inferred, and the user must confirm the year.
- True solar time depends on the built-in city table. Unknown places need a manual longitude.
- Reading quality depends on the model DSH is configured with.
- "My Other Timeline" is a narrative what-if. It is stored apart from the real profile and never written into events.

---

## Update and uninstall

**Update**

```bash
cd "$HOME/Library/Application Support/dsh-desktop/harness/profiles/web"
../../.desktop-bin/pnpm update ming-life
```

Restart DSH Desktop.

**Uninstall**

1. Remove `"ming-life"` from `dsh.profile.bundles` in `package.json`.
2. In the same directory run `../../.desktop-bin/pnpm remove ming-life`.
3. Restart DSH Desktop.

The profile directory `~/Documents/DSH 玄学项目/` is left untouched and can be deleted by hand.

---

## Disclaimer

All metaphysics and divination content is offered as traditional culture and entertainment. It is not a scientific judgement and not medical, legal, investment, educational or any other real-world advice.

---

## License

[MIT](LICENSE) © liqingb0220-stack
