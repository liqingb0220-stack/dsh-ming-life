import { NAME_CHARS, RARITY_LABEL, WUXING_RULE, surnameOf } from '../data/nameChars';
import { relation as wuxingRelation } from '../data/trigrams';
import { makeInsight, ev, SYSTEM_LABEL } from './insight';

export const charOf = c => NAME_CHARS.find(x => x.c === c);

/* ---------------- 音律 ---------------- */
// 声调：1 阴平 2 阳平 3 上声 4 去声。1/2 为平，3/4 为仄。
const isPing = t => t <= 2;

export function analyzeSound(surnameChar, chars) {
  const all = [surnameChar, ...chars].filter(Boolean);
  const tones = all.map(c => c.tone);
  const issues = [], goods = [];

  // 全同调
  if (tones.length >= 2 && new Set(tones).size === 1) {
    issues.push({ key: 'flat', text: `${all.map(c => c.c).join('')} 三字同为${tones[0]}声，念起来会平板。` });
  }
  // 平仄有起伏
  const pattern = tones.map(t => (isPing(t) ? '平' : '仄')).join('');
  if (new Set(pattern.split('')).size > 1) goods.push({ key: 'pingze', text: `平仄为「${pattern}」，读起来有起伏。` });
  else issues.push({ key: 'pingze', text: `平仄全为「${pattern[0]}」，缺少起伏。` });

  // 声母重复（拗口）
  for (let i = 1; i < all.length; i++) {
    if (all[i].initial && all[i].initial === all[i - 1].initial) {
      issues.push({ key: 'initial', text: `${all[i - 1].c}${all[i].c} 声母都是「${all[i].initial}」，连读会绕口。` });
    }
  }
  // 韵母重复（叠韵）
  for (let i = 1; i < all.length; i++) {
    if (all[i].final && all[i].final === all[i - 1].final) {
      issues.push({ key: 'final', text: `${all[i - 1].c}${all[i].c} 韵母都是「${all[i].final}」，念起来含混。` });
    }
  }
  // 三声连读
  for (let i = 1; i < tones.length; i++) {
    if (tones[i] === 3 && tones[i - 1] === 3) {
      issues.push({ key: 'tone3', text: `${all[i - 1].c}${all[i].c} 连续两个三声，实际会变调，不好念。` });
    }
  }
  // 末字去声收尾干脆
  if (tones[tones.length - 1] === 4) goods.push({ key: 'end', text: '末字为去声，收尾干脆有力。' });
  if (tones[tones.length - 1] === 2) goods.push({ key: 'end', text: '末字为阳平，收尾舒展。' });

  return {
    pinyin: all.map(c => `${c.pinyin}${c.tone}`).join(' '),
    pattern, tones, issues, goods,
    level: issues.length === 0 ? '顺口' : issues.length === 1 ? '基本顺口' : '有拗口处'
  };
}

/* ---------------- 字形 ---------------- */
export function analyzeShape(surnameChar, chars) {
  const all = [surnameChar, ...chars].filter(Boolean);
  const strokes = all.map(c => c.strokes);
  const total = strokes.reduce((a, b) => a + b, 0);
  const max = Math.max(...strokes), min = Math.min(...strokes);
  const notes = [];
  if (max - min >= 12) notes.push(`${all[strokes.indexOf(max)].c}（${max}画）与 ${all[strokes.indexOf(min)].c}（${min}画）繁简差距大，写出来重心会偏。`);
  if (strokes.every(s => s >= 13)) notes.push('每个字都偏繁，手写和小字号显示都会糊。');
  if (strokes.every(s => s <= 6)) notes.push('每个字都很简，视觉上偏轻，但好写好认。');
  if (!notes.length) notes.push('繁简搭配比较均衡。');
  return { strokes: all.map(c => ({ c: c.c, n: c.strokes })), total, notes };
}

/* ---------------- 五行与命理视角 ---------------- */
export function analyzeWuxing(chars, bazi) {
  const list = chars.filter(Boolean);
  const counts = {};
  list.forEach(c => { counts[c.wuxing] = (counts[c.wuxing] || 0) + 1; });
  if (!bazi) {
    return { counts, favor: null, hits: [], conflicts: [], text: '未绑定命盘，只显示字本身的五行归属。' };
  }
  const favor = bazi.strength.favor;
  const hits = list.filter(c => favor.includes(c.wuxing));
  const dayWx = bazi.dayMaster.wuxing;
  const conflicts = list.filter(c => {
    const r = wuxingRelation(c.wuxing, dayWx);
    return r.key === 'ke_out' && !favor.includes(c.wuxing); // 字的五行克日主，且不在喜用内
  });
  return {
    counts, favor, hits, conflicts, dayWx,
    text: hits.length
      ? `${hits.map(c => c.c).join('、')} 的五行（${[...new Set(hits.map(c => c.wuxing))].join('、')}）落在日主所喜的 ${favor.join('、')} 上。`
      : `所选字都不在日主所喜的 ${favor.join('、')} 之内。`
  };
}

/* ---------------- 单个名字的完整分析 ---------------- */
export function analyzeName({ surname, chars, bazi, scene = 'baby' }) {
  // 姓氏优先查姓氏表，再查通用字库；都查不到时不参与音律与字形分析，并明确说明
  const sc = surnameOf(surname) || charOf(surname) || null;
  const cs = chars.map(charOf).filter(Boolean);
  if (!cs.length) return null;

  const sound = analyzeSound(sc, cs);
  const shape = analyzeShape(sc, cs);
  const surnameKnown = !!sc;
  const wx = analyzeWuxing(cs, bazi);
  const full = surname + cs.map(c => c.c).join('');

  const rarityScore = cs.filter(c => c.rarity === 'low').length;
  const vibes = [...new Set(cs.flatMap(c => c.vibes))];

  const insight = makeInsight({
    title: full,
    summary: `「${full}」读起来${sound.level}，整体气质偏${vibes.slice(0, 3).join('、')}。${wx.hits.length ? `其中${wx.hits.map(c => c.c).join('、')}的五行正好是命里所喜的那一类。` : ''}`,
    note: '这四层是分开看的，没有合成总分——名字好不好，最后是你自己的判断，不是算出来的。',
    systems: [
      {
        system: 'sound', label: '音律怎么看',
        interpretation: `念作 ${sound.pinyin}。一二声算「平」，三四声算「仄」，这个名字的平仄是「${sound.pattern}」。${surnameKnown ? '' : `（姓氏「${surname}」不在内置的姓氏表里，所以下面只分析了名字部分。）`}${sound.goods.map(g => g.text).join('')}${sound.issues.map(i => i.text).join('')}`,
        evidence: [
          ev('rule', `平仄 ${sound.pattern}`, '一二声为平，三四声为仄'),
          ...sound.issues.map(i => ev('rule', '拗口处', i.text)),
          ...sound.goods.map(g => ev('rule', '顺口处', g.text))
        ]
      },
      {
        system: 'shape', label: '字形怎么看',
        interpretation: `${shape.strokes.map(s => `${s.c} ${s.n} 画`).join('、')}，一共 ${shape.total} 画。${shape.notes.join('')}`,
        evidence: [ev('rule', '笔画', `${shape.strokes.map(s => `${s.c} ${s.n}`).join(' / ')}（简体笔画，不做五格剖象）`)]
      },
      {
        system: 'meaning', label: '字义与出处',
        interpretation: cs.map(c => `${c.c}：${c.meaning}${c.source ? `（${c.source}）` : ''}`).join('；'),
        evidence: cs.map(c => ev('rule', `${c.c} · ${RARITY_LABEL[c.rarity]}`, `${c.meaning}${c.source ? ` · 出处 ${c.source}` : ''}`))
      },
      bazi && {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: `你的日主是${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}），${bazi.strength.label}，${bazi.strength.label === '偏弱' ? '所以传统上会挑能帮扶它的五行来用字' : bazi.strength.label === '偏强' ? '所以传统上会挑能消耗它的五行来用字' : '强弱居中，用字上没什么硬限制'}。${wx.text}`,
        evidence: [
          ...cs.map(c => ev('wuxing', `${c.c} 属${c.wuxing}`, `按${c.basis}归行；${WUXING_RULE[c.wuxing] || ''}`)),
          ev('strength', `日主${bazi.strength.label}，喜 ${bazi.strength.favor.join('、')}`, bazi.strength.basis),
          ...wx.conflicts.map(c => ev('rule', `${c.c} 属${c.wuxing}，克日主${wx.dayWx}`, '并不必然是坏事，但传统上会额外说明'))
        ]
      }
    ].filter(Boolean)
  });

  return {
    id: full,
    full, surname, surnameChar: sc, surnameKnown, chars: cs, vibes,
    sound, shape, wuxing: wx,
    rarityScore,
    insight
  };
}

/* ---------------- 生成 ---------------- */
function scoreCandidate(a) {
  // 只用于排序，不作为对用户展示的「总分」
  let s = 0;
  s -= a.sound.issues.length * 2;
  s += a.sound.goods.length;
  s += a.wuxing.hits.length * 2;
  s -= a.wuxing.conflicts.length;
  if (a.shape.notes[0].includes('均衡')) s += 1;
  return s;
}

/**
 * 生成候选名字。
 * @param opts.locked  锁定的字（位置 0 / 1），undefined 表示不锁
 * @param opts.pool    候选字池（字符数组）；为空则用全库
 */
export function generateNames({ surname, length = 2, vibes = [], likes = [], dislikes = [], bazi, pool = [], locked = {}, limit = 24, favorFirst = true }) {
  const banned = new Set(dislikes);
  let base = (pool.length ? pool.map(charOf).filter(Boolean) : NAME_CHARS)
    .filter(c => !banned.has(c.c));
  if (vibes.length) {
    const matched = base.filter(c => c.vibes.some(v => vibes.includes(v)));
    if (matched.length >= 6) base = matched;
  }
  if (bazi && favorFirst) {
    const favor = bazi.strength.favor;
    const fav = base.filter(c => favor.includes(c.wuxing));
    if (fav.length >= 6) base = [...fav, ...base.filter(c => !favor.includes(c.wuxing))].slice(0, Math.max(40, fav.length));
  }
  // 喜欢的字优先进入
  const liked = likes.map(charOf).filter(Boolean);
  const cand = [...new Map([...liked, ...base].map(c => [c.c, c])).values()];

  const out = [];
  if (length === 1) {
    cand.forEach(c => {
      if (locked[0] && locked[0] !== c.c) return;
      const a = analyzeName({ surname, chars: [c.c], bazi });
      if (a) out.push(a);
    });
  } else {
    const firsts = locked[0] ? [charOf(locked[0])].filter(Boolean) : cand;
    const seconds = locked[1] ? [charOf(locked[1])].filter(Boolean) : cand;
    firsts.forEach(a1 => {
      seconds.forEach(a2 => {
        if (a1.c === a2.c) return;
        const a = analyzeName({ surname, chars: [a1.c, a2.c], bazi });
        if (a) out.push(a);
      });
    });
  }
  const ranked = out
    .map(a => ({ ...a, _rank: scoreCandidate(a) }))
    .sort((x, y) => y._rank - x._rank || x.full.localeCompare(y.full));

  // 多样性：不锁字时，同一个首字最多出现 2 次，否则列表会被同一个字刷屏
  if (locked[0] || length === 1) return ranked.slice(0, limit);
  const seen = {}, picked = [], spill = [];
  ranked.forEach(a => {
    const k = a.chars[0].c;
    seen[k] = (seen[k] || 0) + 1;
    (seen[k] <= 2 ? picked : spill).push(a);
  });
  return [...picked, ...spill].slice(0, limit);
}

/** 「沿这个方向继续生成」：以某个名字为锚，换掉其中一个字 */
export function continueFrom({ name, keepIndex, surname, bazi, vibes, dislikes = [], limit = 16 }) {
  const keepChar = name.chars[keepIndex].c;
  const locked = keepIndex === 0 ? { 0: keepChar } : { 1: keepChar };
  const seedVibes = vibes && vibes.length ? vibes : name.chars[keepIndex].vibes;
  return generateNames({
    surname, length: name.chars.length, vibes: seedVibes, bazi,
    dislikes: [...dislikes, ...name.chars.filter((_, i) => i !== keepIndex).map(c => c.c)],
    locked, limit
  });
}


// ---------- 由 DSH 起名时，工作台负责的三件事：给事实与材料、解析它起的名字、逐个核对 ----------


/** 姓氏的事实：读音、声调、五行、笔画。不在姓氏表里就只给字。 */
export function surnameFacts(surname) {
  const sc = surnameOf(surname);
  if (!sc) return { c: surname, known: false, text: `姓氏「${surname}」不在内置姓氏表里，读音与五行请你自行判断` };
  return { ...sc, known: true, text: `姓氏「${surname}」读 ${sc.pinyin}${sc.tone}（${isPing(sc.tone) ? '平' : '仄'}声），五行属${sc.wuxing}，${sc.strokes} 画` };
}

/** 用字材料：按命局喜用五行从字库里抽一批（不是答案，是参考） */
export function nameMaterial(bazi, brief = '', limit = 28) {
  const favor = bazi ? bazi.strength.favor : [];
  const mentioned = [...new Set((String(brief).match(/[一-龥]/g) || []))].map(charOf).filter(Boolean);
  const fav = NAME_CHARS.filter(c => favor.includes(c.wuxing) && !mentioned.some(m => m.c === c.c));
  // 均匀取样，避免总是同一批字
  const step = Math.max(1, Math.floor(fav.length / Math.max(1, limit - mentioned.length)));
  const picked = fav.filter((_, i) => i % step === 0).slice(0, limit - mentioned.length);
  return [...mentioned, ...picked].map(c => ({ c: c.c, pinyin: `${c.pinyin}${c.tone}`, wuxing: c.wuxing, meaning: c.meaning }));
}

/** 起名的规则说明（写给 DSH，也显示给用户） */
export function nameRules(bazi, surname) {
  const sf = surnameFacts(surname);
  const rules = [];
  if (bazi) {
    const st = bazi.strength;
    rules.push(`日主 ${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}）${st.label}，传统上用字偏向 ${st.favor.join('、')}（${st.favor.map(w => WUXING_RULE[w] || '').filter(Boolean).join('；')}）`);
  }
  if (sf.known) rules.push(`姓氏是${isPing(sf.tone) ? '平' : '仄'}声，名字里最好有一个${isPing(sf.tone) ? '仄' : '平'}声字，读起来才有起伏；避免和姓氏同声母（${sf.initial || '零声母'}）连读`);
  rules.push('避开生僻字、多音字歧义、谐音不雅；两字名首字避免与姓氏同五行相克');
  return rules;
}

/** 从 DSH 写回的 Markdown 里把名字抠出来：优先 ## 标题，其次 **加粗** */
export function parseNamesFromText(text, surname) {
  if (!text) return [];
  const out = [];
  const re = new RegExp(`(?:^#{1,4}\\s*|\\*\\*)\\s*(?:\\d+[.、)]\\s*)?(${surname}[一-龥]{1,2})(?![一-龥])`, 'gm');
  let m;
  while ((m = re.exec(text))) { if (!out.includes(m[1])) out.push(m[1]); }
  return out.slice(0, 8);
}

/** 逐个核对 DSH 起的名字：字库里有的字给五行/读音/笔画/平仄，没有的标出来 */
export function checkName(surname, full, bazi) {
  const chars = full.slice(surname.length).split('');
  const known = chars.map(c => charOf(c));
  const sc = surnameOf(surname);
  const soundChars = known.every(Boolean) ? known : null;
  const a = known.every(Boolean) ? analyzeName({ surname, chars, bazi }) : null;
  return {
    full, chars: chars.map((c, i) => known[i] ? { c, known: true, wuxing: known[i].wuxing, pinyin: `${known[i].pinyin}${known[i].tone}`, strokes: known[i].strokes, meaning: known[i].meaning } : { c, known: false }),
    unknown: chars.filter((_, i) => !known[i]),
    pattern: soundChars && sc ? [sc, ...soundChars].map(c => (isPing(c.tone) ? '平' : '仄')).join('') : null,
    soundIssues: a ? a.sound.issues.map(x => x.text) : [],
    favorHits: bazi ? chars.filter((_, i) => known[i] && bazi.strength.favor.includes(known[i].wuxing)).length : 0,
    strokes: known.every(Boolean) ? (sc ? sc.strokes : 0) + known.reduce((n, c) => n + c.strokes, 0) : null
  };
}
