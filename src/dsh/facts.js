/**
 * 给 DSH 的话：事实 + 信号 + 要它写什么 + 写回哪里。
 * 工作台只定义「展现什么」；每一句解读都由 DSH 生成、写回档案、界面再渲染。
 */
import { chartSignals, yearSignals, signalsToText, yearToText } from '../engines/signals';
import { placeFactsText } from '../engines/places';

export const TONE = '语气留余地（多半、往往、容易），不说必然和注定；不替我做决定；讲到不顺的地方，把顺的那一面也讲出来；措辞专业克制，关系人一律用「伴侣」「家人」「同事」这类中性称谓；用小标题分段，不要铺表格。';

/** 短哈希：事实变了就重新请求 */
export function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

export function profileFacts(profile, bazi, ziwei, corr) {
  const lines = [
    `档案：${profile.name}，${profile.gender}，${profile.birth_date} ${profile.time_unknown ? '时辰不详' : profile.birth_time || ''}${corr?.applied ? `；${corr.note}` : ''}`,
    `四柱：${bazi.pillars.map(p => p.gan + p.zhi).join(' ')}　日主 ${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}）${bazi.strength.label}，喜 ${bazi.strength.favor.join('、')}`,
    bazi.daYun.length ? `大运：${bazi.daYun.map(d => `${d.ganZhi} ${d.startYear}–${d.endYear}（${d.startAge}–${d.endAge} 岁）`).join('；')}` : '大运：无法起运',
    ziwei ? `紫微：${ziwei.fiveElementsClass}，命宫 ${ziwei.soulPalace.stem}${ziwei.soulPalace.branch} 坐 ${ziwei.soulMajors.map(s => s.name).join('、') || '无主星'}` : '紫微：未排'
  ];
  return lines.join('\n');
}

const writeBack = key => `回答之后**必须**把同样的内容写进 profile.json 的 interpretations["${key}"]（这个对象已经存在，status 是 pending）：status 改成 "done"，text 填你的回答全文（Markdown，用 ## 做小标题），at 填 ISO 时间；其它字段不要动。不写回的话工作台里只会一直转圈，用户看不到你的回答。`;

const head = (key, title) => `【工作台请求解读 #${key}】${title}`;

/** 各页面的请求。返回 { key, prompt, hash } */
export function buildRequest(kind, ctx) {
  const { profile, bazi, ziwei, corr, gender } = ctx;
  const year = new Date().getFullYear();
  const facts = profileFacts(profile, bazi, ziwei, corr);
  const sig = signalsToText(chartSignals(bazi, ziwei));
  const ys = yearSignals(bazi, ziwei, gender, year);

  if (kind === 'reveal') {
    const key = 'reveal';
    const body = [
      head(key, `这是 ${profile.name} 刚建档的第一屏。`),
      '事实：', facts, '',
      '规则引擎标出的信号（只是标记，请你来解释）：', sig, '',
      ys ? `今年：\n${yearToText(ys)}` : '',
      '',
      '请写一段简短的命理解读，400 字左右：先一句总的判断（这张命局最突出的一股力量是什么），然后按 ## 事业、## 财富、## 关系、## 迁移、## 创造、## 身心 六个方面各一两句（把命局结构和今年的信号合在一起说），最后一句留余地。',
      writeBack(key), TONE
    ].join('\n');
    return { key, prompt: body, hash: hashOf(facts + sig + (ys ? ys.year : '')) };
  }

  if (kind === 'who') {
    const key = 'who';
    const body = [
      head(key, `${profile.name} 在看「我是谁」。`),
      '事实：', facts, '', '信号：', sig, '',
      '请按下面的小标题写：',
      '## 最像自己的时候（2–3 句，写具体场景）',
      '## 最容易吃亏的地方（2–3 句）',
      '## 反复出现的矛盾（2–3 句，指出是命局里哪两股力量在拉扯）',
      '## 我如何做决定（一段）',
      '## 我在什么环境里最舒服（一段）',
      '每一段都要能追溯到上面的某条信号（顺手点出是哪一条）。',
      writeBack(key), TONE
    ].join('\n');
    return { key, prompt: body, hash: hashOf(facts + sig) };
  }

  if (kind === 'where-to') {
    const key = 'where-to';
    const span = [];
    for (let y = year; y < year + 10; y++) { const s = yearSignals(bazi, ziwei, gender, y); if (s) span.push(`${y}（${s.age} 岁，流年 ${s.liuNian.split('（')[0]}）：${s.domains.filter(d => d.score >= 2).map(d => `${d.label}·${d.level}`).join('、') || '安静'}`); }
    const body = [
      head(key, `${profile.name} 在看「我将去向何方」。`),
      '事实：', facts, '',
      `今年：\n${yearToText(ys)}`, '',
      '未来十年，规则引擎逐年标出的信号：', ...span, '',
      '请写：',
      '## 现在（今年六个方面各一句，先说信号集中的，再说安静的那几面也不是坏事）',
      '## 未来十年（挑信号最集中的两三段，每段写清年份区间、集中在哪些方面、在他这个人生阶段多半会以什么形式出现；不是预言，是结构）',
      '## 值得提前留意的一件事（一句）',
      writeBack(key), TONE
    ].join('\n');
    return { key, prompt: body, hash: hashOf(facts + span.join('|')) };
  }

  if (kind === 'year') {
    const y = ctx.year; const key = `year:${y}`; const s = yearSignals(bazi, ziwei, gender, y);
    const body = [head(key, `${profile.name} 想看 ${y} 年。`), '事实：', facts, '', yearToText(s), '', '请按六个方面各写一两句（信号集中的多写，安静的少写），最后说一句这一年整体上适合做哪一类事、不必急的是哪一类。', writeBack(key), TONE].join('\n');
    return { key, prompt: body, hash: hashOf(facts + yearToText(s)) };
  }

  if (kind === 'event') {
    const e = ctx.event; const key = `event:${e.event_id}`;
    const body = [
      head(key, `${profile.name} 有一件事想问。`),
      `问题：${e.question}`, '',
      '事实：', facts, '',
      ys ? `今年：\n${yearToText(ys)}` : '',
      e.cast?.liuyao ? `\n为这一问摇的六爻：${e.cast.liuyao.text || e.cast.liuyao}` : '',
      e.cast?.meihua ? `按此刻起的梅花：${e.cast.meihua.text || e.cast.meihua}` : '',
      '',
      '请先用一两句说这件事实际在问什么；如果缺关键信息，最多追问我两个问题（写在 ## 想先问你 下面）；然后按 ## 命局怎么看 / ## 今年的时机 / ## 卦象怎么说 / ## 值得留意的地方 写，最后一句把决定留给我。',
      writeBack(key), TONE
    ].join('\n');
    return { key, prompt: body, hash: hashOf(e.question + (e.cast?.liuyao?.text || '') + (ys ? ys.year : '')) };
  }

  if (kind === 'person') {
    const p = ctx.person; const key = `person:${p.person_id}`; const r = ctx.relation;
    const body = [
      head(key, `${profile.name} 在看和「${p.nickname}」（${p.kindLabel || ''}）的合盘。`),
      `我：${bazi.pillars.map(x => x.gan + x.zhi).join(' ')}，日主 ${bazi.dayMaster.gan}${ziwei ? `，命宫 ${ziwei.soulMajors.map(s => s.name).join('、') || '无主星'}` : ''}`,
      `对方：${r.themPillars}，日主 ${r.themDayMaster}${r.themSoul ? `，命宫 ${r.themSoul}` : ''}`,
      `日主关系：${r.ganRel}`, `日支关系：${r.zhiRels || '无特殊关系'}`, r.palaceRels ? `紫微：${r.palaceRels}` : '',
      '六个维度的差距：', ...r.dims, '',
      '请写：## 相近之处 / ## 差异在哪、会如何摩擦 / ## 哪些差异可以分工 / ## 分歧最可能出现在哪类事上。不给契合度分数，不下「合不合适」的结论。',
      writeBack(key), TONE
    ].join('\n');
    return { key, prompt: body, hash: hashOf(r.themPillars + r.dims.join('|')) };
  }

  if (kind === 'alt') {
    const t = ctx.timeline; const key = `alt:${t.timeline_id}`;
    const y = Number(t.from_year) || year;
    const then = yearSignals(bazi, ziwei, gender, y);
    const stretch = bazi.daYun.filter(d => d.endYear >= y && d.startYear <= year + 5).map(d => `${d.ganZhi}（${d.startAge}–${d.endAge} 岁，${d.startYear}–${d.endYear}）`);
    const body = [
      head(key, `${profile.name} 想看另一条时间线。`),
      `如果当年……${t.premise}`, '',
      '事实：', facts, '',
      then ? `分叉那年：\n${yearToText(then)}` : '',
      stretch.length ? `分叉之后走过的大运：${stretch.join('；')}` : '',
      '',
      '请写「另一种可能性」：命盘不变，只改这一件事。按 ## 分叉之后的头几年 / ## 走到今天 / ## 哪些东西其实不会变 / ## 这条线上多出来的、和少掉的 来写，像讲一个可能的人生，不比高低，不做评判。',
      '不要引导到城市、职业、收入、资产这些指标上去——除非他的前提本身就是这些。',
      writeBack(key), TONE
    ].join('\n');
    return { key, prompt: body, hash: hashOf(t.premise + y + facts) };
  }

  if (kind === 'places') {
    const intl = ctx.places?.scope === 'intl';
    const key = intl ? 'places:intl' : 'places'; const pf = placeFactsText(ctx.places);
    const body = [
      head(key, `${profile.name} 在看「地点」（${intl ? '国际版：只看海外城市' : '国内版：只看国内城市'}）。`),
      '事实：', facts, '', '方位事实（以参照点为原点算的，城市按方位分好了）：', pf, '',
      `请挑出几个地方，每个地方给一两个具体的${intl ? '海外' : '国内'}城市（从上面各方位的城市里选，也可以是同方位的其他城市），说清楚是从哪条依据来的：`,
      '## 定情之地（桃花位、关系一面）',
      '## 转折之地（喜用方位、事业一面）',
      '## 奇遇之地（驿马位、迁移宫）',
      '## 安顿之地（适合待着不动的方向）',
      '最后一句：哪个方向暂时不急着去，为什么。都是结构上的倾向，不是要他搬家。',
      writeBack(key), TONE
    ].join('\n');
    return { key, prompt: body, hash: hashOf(pf + facts + key) };
  }

  if (kind === 'naming') {
    const n = ctx.naming; const key = `naming:${hashOf(n.surname + n.scene + (n.brief || '') + n.length)}`;
    const body = [
      head(key, `${profile.name} 请你起名。`),
      `姓氏：${n.surname}　用途：${n.sceneLabel}　字数：${n.length} 字`,
      n.brief ? `参考信息：${n.brief}` : '',
      '', '事实：', n.surnameText || '', facts, '',
      '规则（工作台按传统起名法整理的，请照着来）：', ...(n.rules || []).map(r => `- ${r}`), '',
      `可用字参考（按喜用五行从字库里抽的一批，只是材料，不必局限于此）：${(n.material || []).map(m => `${m.c}(${m.pinyin}·${m.wuxing}·${m.meaning})`).join('、')}`,
      '',
      `请你来起名：给 5 个${n.length}字名，**每个名字单独用 ## 做标题，标题就是完整姓名**（例如「## ${n.surname}〇〇」），标题下写 3 句：字义与出处、读音和平仄为什么顺、五行为什么合这张盘${n.brief ? '、怎么呼应参考信息' : ''}。最后用一段「## 取舍」说这 5 个各自适合什么倾向的人。不给分数。`,
      writeBack(key), TONE
    ].filter(x => x !== '').join('\n');
    return { key, prompt: body, hash: hashOf(n.surname + n.scene + (n.brief || '') + n.length + facts) };
  }

  throw new Error(`unknown request kind ${kind}`);
}

/** 追问的 key：event:<id>#<轮次>，轮次从 2 起（第 1 轮就是 event:<id> 本身） */
export const followKey = (eventId, round) => `event:${eventId}#${round}`;

/**
 * 「我有事想问」里的追问：同一个问题的第 N 轮。
 * 走和第一轮一样的写回协议（pending → DSH 写 done），所以工作台里能切换着看每一轮。
 * previous: [{ question, text }]，第一项是最初的问题与解读，之后是历次追问。
 */
export function buildFollowUp({ profile, bazi, ziwei, corr, event: e, round, question, previous = [] }) {
  const key = followKey(e.event_id, round);
  const facts = profileFacts(profile, bazi, ziwei, corr);
  const clip = (t, n) => { const x = String(t || '').trim(); return x.length > n ? `${x.slice(0, n)}…` : x; };
  const history = previous.map((r, i) => [
    i === 0 ? `最初的问题：${r.question}` : `第 ${i + 1} 轮追问：${r.question}`,
    r.text ? `${i === 0 ? '你的解读' : '你的回答'}：\n${clip(r.text, i === previous.length - 1 ? 2500 : 900)}` : '（你还没有回答这一轮）'
  ].join('\n')).join('\n\n');
  const body = [
    head(key, `${profile.name} 就「${clip(e.question, 60)}」继续追问（第 ${round} 轮）。`),
    '事实：', facts, '',
    '前几轮：', history, '',
    `这一轮他说：${question}`, '',
    '请直接接着上一轮说，不要从头重复。如果上一轮你在「想先问你」里向他要过信息，这一轮多半就是他的回答——请据此把解读补完整（该保留的小标题保留，结论有变的地方说清楚变在哪）；如果他是在追问某一点，就只展开那一点。最后一句把决定留给他。',
    writeBack(key), TONE
  ].join('\n');
  return { key, prompt: body, hash: hashOf(key + question), meta: { question, round, parent: `event:${e.event_id}` } };
}

/** 择日：对不上黄历条目时，把窗口交给 DSH */
export function timingPrompt(purpose, from, to) {
  return [`【工具阁】择日`, `我想在 ${from} 到 ${to} 之间找个合适的时候做这件事：${purpose}。`, '古法黄历里没有正好对应这件事的条目。请结合我的日主、这段时间的流月，以及这件事本身的性质，说说这段时间里哪几段更顺手、哪几段最好避开，并解释依据。不用给「最吉之日」，给两三个可选的窗口就行。', TONE].join('\n');
}
/** 地点：用户点名问某个地方 */
export function placeQuestionPrompt(question, cityFactsText) {
  return [`【工具阁】地点`, `我想问：${question}`, `方位事实：${cityFactsText}`, '请就这个地方说说：它在我的盘面上是什么方向、这个方向的结构倾向是什么、适合去做哪一类事，最后一句留余地。', TONE].join('\n');
}

/** 工具阁里「问问 DSH 解读」：不写回，答在对话里 */
export function toolPrompt(title, factsText, question = '') {
  return [`【工具阁】${title}`, question ? `我问的是：${question}` : '', '卦象／盘面事实：', factsText, '', '请就这个结果做解读：先说卦（或盘）本身在讲什么结构，再对应到我问的事，最后一句留余地。', TONE].filter(Boolean).join('\n');
}
