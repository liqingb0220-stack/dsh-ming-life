import { buildPortrait } from './portrait';
import { branchRelations } from './branches';
import { shiShen, GAN_WUXING } from './ganzhi';
import { relation as wuxingRelation } from '../data/trigrams';
import { DIMENSIONS, TEN_GODS } from '../data/tenGods';
import { MAJOR_STARS } from '../data/stars';
import { makeInsight, ev, SYSTEM_LABEL } from './insight';

export const RELATION_KINDS = [
  { key: 'partner', label: '伴侣' },
  { key: 'family', label: '家人' },
  { key: 'friend', label: '朋友' },
  { key: 'colleague', label: '同事' },
  { key: 'boss', label: '上级 / 下属' },
  { key: 'cofounder', label: '合作伙伴' },
  { key: 'other', label: '其他' }
];

// 互动结构的四个观察面，每个由画像维度差推出
const ASPECTS = [
  {
    key: 'pace', label: '决策节奏', dims: ['drive', 'risk'],
    near: '你们做决定的快慢接近，不太会因为「一个还在想、一个已经做了」而互相埋怨。',
    far: '一个偏向先动、一个偏向先想清楚，这是你们之间最常见的时间差。',
    farTip: '这类差异真正的成本不在谁对，而在于没有事先约好「多久之内要给答复」。'
  },
  {
    key: 'stability', label: '稳定需求', dims: ['stability'],
    near: '你们对确定性的要求接近，对同一件变动的紧张程度差不多。',
    far: '一方需要更明确的结构，另一方对变动的容忍度更高，变化来临时反应会明显不同。',
    farTip: '通常不是谁太胆小或谁太冒进，而是同一个不确定性对两人的实际代价不一样。'
  },
  {
    key: 'expression', label: '表达方式', dims: ['social', 'creation'],
    near: '你们在表达上的密度接近，说与不说的默契比较容易建立。',
    far: '一方倾向说出来、往外走，另一方倾向留在心里、往里收，同样的沉默会被读出不同意思。',
    farTip: '这类差异容易被误读成「不在乎」，其实只是出口不同。'
  },
  {
    key: 'tension', label: '内在张力', dims: ['tension'],
    near: '你们内部诉求的复杂程度接近，能理解对方的自相矛盾。',
    far: '一方内部拉扯更多，另一方相对一致，后者容易觉得前者「想太多」。',
    farTip: '张力高的一方需要的往往不是解决方案，而是被允许摇摆一阵。'
  }
];

/**
 * 合盘。不输出契合度分数，只输出互动结构。
 * @param me   {bazi, ziwei, name}
 * @param them {bazi, ziwei, name, kind}
 */
export function compareCharts(me, them) {
  const pMe = buildPortrait(me.bazi, me.ziwei);
  const pThem = buildPortrait(them.bazi, them.ziwei);

  const dimPairs = DIMENSIONS.map(d => {
    const a = pMe.dimensions.find(x => x.key === d.key);
    const b = pThem.dimensions.find(x => x.key === d.key);
    return { ...d, mine: a.score, theirs: b.score, gap: Math.abs(a.score - b.score), higher: a.score >= b.score ? 'me' : 'them' };
  });

  // ---- 八字层：日主关系、日支关系、互看十神 ----
  const myGan = me.bazi.dayMaster.gan, theirGan = them.bazi.dayMaster.gan;
  const myZhi = me.bazi.pillars[2].zhi, theirZhi = them.bazi.pillars[2].zhi;
  // 一律以「我」为主语计算：我 对 对方
  const ganRel = wuxingRelation(GAN_WUXING[myGan], GAN_WUXING[theirGan]);
  const GAN_REL_TEXT = {
    same: { text: '双方日主同属一行（比和）', plain: '底色相近，容易互相理解，但也容易同时踩进同一个坑。', side: 'complement' },
    sheng_out: { text: '你的日主生对方的日主', plain: '结构上你更容易是给出去的一方，长期要留意是不是单向输出。', side: 'conflict' },
    sheng_in: { text: '对方的日主生你的日主', plain: '结构上对方更容易成为支持你的一方。', side: 'complement' },
    ke_out: { text: '你的日主克对方的日主', plain: '你更容易在这段关系里占主导，但维持主导本身要耗力。', side: 'neutral' },
    ke_in: { text: '对方的日主克你的日主', plain: '对方的行事方式容易让你感到被压制，长期下来消耗大。', side: 'conflict' }
  };
  const ganRelInfo = GAN_REL_TEXT[ganRel.key] || { text: '两个日主之间没有明显生克', plain: '', side: 'neutral' };
  const zhiRels = branchRelations(myZhi, theirZhi);
  const theyToMe = shiShen(myGan, theirGan);   // 对方日主在我命中是什么十神
  const meToThem = shiShen(theirGan, myGan);

  // 五行互补：对方命局中我所缺/所喜的五行占比
  const myFavor = me.bazi.strength.favor;
  const theirStrongWx = Object.entries(them.bazi.wuxingPct).sort((a, b) => b[1] - a[1])[0];
  const complementWx = myFavor.filter(w => (them.bazi.wuxingPct[w] || 0) >= 20);

  // ---- 紫微层：命宫地支关系与主星组合 ----
  const myPalace = me.ziwei?.soulPalace, theirPalace = them.ziwei?.soulPalace;
  const palaceRels = myPalace && theirPalace ? branchRelations(myPalace.branch, theirPalace.branch) : [];
  const myStars = me.ziwei ? me.ziwei.soulMajors.map(s => s.name) : [];
  const theirStars = them.ziwei ? them.ziwei.soulMajors.map(s => s.name) : [];

  const baziSystem = {
    system: 'bazi', label: SYSTEM_LABEL.bazi,
    interpretation: `合盘先看两个人的日主——也就是各自出生那天的第一个字，命理里用它代表这个人本身。你是${myGan}（属${GAN_WUXING[myGan]}），对方是${theirGan}（属${GAN_WUXING[theirGan]}），${ganRelInfo.text}，${ganRelInfo.plain}换成十神的说法：站在你的角度，对方是${theyToMe}；站在对方角度，你是${meToThem}。再看两人的日支，${myZhi}和${theirZhi}${zhiRels.length ? `构成${zhiRels.map(r => r.label).join('、')}` : '之间没有传统所说的合、冲、刑、害关系'}。`,
    evidence: [
      ev('pillar', `日主 ${myGan}（${GAN_WUXING[myGan]}） / ${theirGan}（${GAN_WUXING[theirGan]}）`, ganRelInfo.text),
      ev('ten_god', `对方于你为${theyToMe}`, TEN_GODS[theyToMe]?.plain || ''),
      ev('ten_god', `你于对方为${meToThem}`, TEN_GODS[meToThem]?.plain || ''),
      ...zhiRels.map(r => ev('rule', `日支 ${myZhi}${theirZhi} ${r.label}`, r.plain)),
      ev('wuxing', `对方命局最重的是${theirStrongWx[0]}（${theirStrongWx[1]}%）`, `你的日主喜 ${myFavor.join('、')}${complementWx.length ? `，其中 ${complementWx.join('、')} 在对方命局中分量不轻` : '，对方命局中这几项都不算突出'}`)
    ]
  };

  const ziweiSystem = (me.ziwei && them.ziwei) ? {
    system: 'ziwei', label: SYSTEM_LABEL.ziwei,
    interpretation: `紫微这边看两人的命宫——命宫代表一个人的基本性格。你的命宫在${myPalace.branch}，里面是${myStars.join('、') || '空的（无主星）'}；对方的在${theirPalace.branch}，里面是${theirStars.join('、') || '空的（无主星）'}。两个命宫所在的位置${palaceRels.length ? `构成${palaceRels.map(r => r.label).join('、')}` : '之间没有明显关系'}。`,
    evidence: [
      ev('palace', `命宫 ${myPalace.stem}${myPalace.branch} / ${theirPalace.stem}${theirPalace.branch}`, palaceRels.map(r => `${r.label}：${r.plain}`).join('；') || '无合冲刑害'),
      ...myStars.slice(0, 2).map(s => ev('star', `你 ${s}`, MAJOR_STARS[s]?.plain || '')),
      ...theirStars.slice(0, 2).map(s => ev('star', `对方 ${s}`, MAJOR_STARS[s]?.plain || ''))
    ]
  } : null;

  // ---- 互动结构 ----
  const aspects = ASPECTS.map(a => {
    const pairs = a.dims.map(k => dimPairs.find(d => d.key === k));
    const gap = Math.round(pairs.reduce((s, p) => s + p.gap, 0) / pairs.length);
    const threshold = Math.round(pairs.reduce((s, p) => s + p.gapThreshold, 0) / pairs.length);
    const far = gap >= threshold;
    const higher = pairs[0].higher;
    const whoMore = higher === 'me' ? me.name : them.name;
    const whoLess = higher === 'me' ? them.name : me.name;
    return {
      ...a, gap, threshold, far, pairs,
      insight: makeInsight({
        title: a.label,
        summary: far ? a.far : a.near,
        note: far ? `${a.farTip}（${pairs.map(p => `${p.label}：${me.name} ${p.mine} / ${them.name} ${p.theirs}`).join('，')}，${whoMore} 明显更高）` : '',
        systems: [
          {
            system: 'bazi', label: SYSTEM_LABEL.bazi,
            interpretation: pairs.map(p => {
              const mineTop = pMe.bItems.slice().sort((x, y) => Math.abs(y.share * (y.w[p.key] || 0)) - Math.abs(x.share * (x.w[p.key] || 0)))[0];
              const theirTop = pThem.bItems.slice().sort((x, y) => Math.abs(y.share * (y.w[p.key] || 0)) - Math.abs(x.share * (x.w[p.key] || 0)))[0];
              return `${p.label}上，${me.name}的命局以 ${mineTop.key} 为主要来源，${them.name}以 ${theirTop.key} 为主要来源。`;
            }).join(''),
            evidence: pairs.flatMap(p => [
              ev('rule', `${p.label} ${me.name} ${p.mine}`, `八字 ${pMe.dimensions.find(d => d.key === p.key).baziScore}${pMe.dimensions.find(d => d.key === p.key).ziweiScore !== null ? ` / 紫微 ${pMe.dimensions.find(d => d.key === p.key).ziweiScore}` : ''}`),
              ev('rule', `${p.label} ${them.name} ${p.theirs}`, `八字 ${pThem.dimensions.find(d => d.key === p.key).baziScore}${pThem.dimensions.find(d => d.key === p.key).ziweiScore !== null ? ` / 紫微 ${pThem.dimensions.find(d => d.key === p.key).ziweiScore}` : ''}`)
            ])
          },
          baziSystem
        ]
      })
    };
  });

  // ---- 冲突来源 ----
  const conflicts = [];
  const negZhi = zhiRels.filter(r => r.tone < 0);
  negZhi.forEach(r => conflicts.push({ source: `日支${r.label}`, plain: r.plain, from: 'bazi', basis: `你的日支 ${myZhi} 与对方日支 ${theirZhi}` }));
  palaceRels.filter(r => r.tone < 0).forEach(r => conflicts.push({ source: `命宫${r.label}`, plain: r.plain, from: 'ziwei', basis: `命宫 ${myPalace.branch} 与 ${theirPalace.branch}` }));
  aspects.filter(a => a.far).forEach(a => conflicts.push({ source: `${a.label}差距`, plain: a.farTip, from: 'portrait', basis: `两人在${a.label}相关维度上相差约 ${a.gap} 分` }));
  if (ganRelInfo.side === 'conflict') conflicts.push({ source: ganRelInfo.text, plain: ganRelInfo.plain, from: 'bazi', basis: `日主 ${myGan}(${GAN_WUXING[myGan]}) 与 ${theirGan}(${GAN_WUXING[theirGan]})` });

  // ---- 互补之处 ----
  const complements = [];
  const bigGaps = dimPairs.filter(d => d.gap >= d.gapThreshold && ['drive', 'stability', 'creation', 'social'].includes(d.key));
  bigGaps.forEach(d => complements.push({
    source: d.label,
    plain: `一个人在${d.label}上明显更高，另一个更低。同一件事里，这刚好可以分工——但只在双方都认这个分工的时候才成立。`,
    basis: `${me.name} ${d.mine} / ${them.name} ${d.theirs}`
  }));
  zhiRels.filter(r => r.tone > 0).forEach(r => complements.push({ source: `日支${r.label}`, plain: r.plain, basis: `${myZhi} 与 ${theirZhi}` }));
  if (complementWx.length) complements.push({ source: '五行互补', plain: `你的日主喜 ${myFavor.join('、')}，而对方命局中 ${complementWx.join('、')} 分量不轻。传统上会说这类组合「对方身上有你需要的那口气」。`, basis: `对方五行分布 ${Object.entries(them.bazi.wuxingPct).map(([k, v]) => k + v + '%').join(' ')}` });
  if (ganRelInfo.side === 'complement') complements.push({ source: ganRelInfo.text, plain: ganRelInfo.plain, basis: `日主 ${myGan}(${GAN_WUXING[myGan]}) 与 ${theirGan}(${GAN_WUXING[theirGan]})` });

  const overall = makeInsight({
    title: `${me.name} 与 ${them.name}`,
    summary: aspects.filter(a => a.far).length
      ? `你们最明显的差别在${aspects.filter(a => a.far).map(a => a.label).join('和')}上。这里不给「契合度百分之多少」——两个人合不合得来，取决于怎么处理这些差别，而不是差别本身有多大。`
      : '你们在几个观察面上的差别都不大。这不等于一定合得来，只是说明摩擦不太会来自性格结构本身。',
    note: '同一个差距，配合得好是分工，配合不好就是摩擦——互补和冲突常常是一件事的两面。',
    systems: [baziSystem, ziweiSystem].filter(Boolean)
  });

  return { pMe, pThem, dimPairs, aspects, conflicts, complements, overall, ganRel, ganRelInfo, zhiRels, palaceRels, theyToMe, meToThem };
}
