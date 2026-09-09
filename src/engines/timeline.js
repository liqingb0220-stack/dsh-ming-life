import { baziAtYear } from './bazi';
import { ziweiAtYear, locateMutagens } from './ziwei';
import { DOMAINS, PALACE_DOMAIN } from '../data/stars';
import { TEN_GODS } from '../data/tenGods';
import { makeInsight, ev, SYSTEM_LABEL } from './insight';
import { stageOf, stripLead } from './compose';
import { TEN_GODS_FULL } from '../data/readings';

const CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };

export const LEVELS = [
  { key: 'calm', label: '平稳', color: 'var(--t3)', min: -99 },
  { key: 'notice', label: '值得关注', color: 'var(--azure)', min: 2 },
  { key: 'active', label: '活跃', color: 'var(--jade)', min: 4 },
  { key: 'shift', label: '变化较多', color: 'var(--gold)', min: 6 }
];
export const levelOf = score => [...LEVELS].reverse().find(l => score >= l.min) || LEVELS[0];

/** 八字侧：一组干支（大运或流年）对六维度的贡献 */
function baziDomainScore(bazi, gz, gender) {
  const acc = {}; const why = {};
  DOMAINS.forEach(d => { acc[d.key] = 0; why[d.key] = []; });
  const add = (k, n, reason) => { acc[k] += n; why[k].push(reason); };

  const gods = [gz.shiShenGan, gz.shiShenZhi].filter(Boolean);
  gods.forEach(g => {
    if (g === '正官' || g === '七杀') add('career', 2, `${gz.ganZhi} 见${g}，责任与位置的分量加重`);
    if (g === '正财' || g === '偏财') add('wealth', 2, `${gz.ganZhi} 见${g}，与钱和资源相关的动作变多`);
    if (g === '食神' || g === '伤官') { add('creation', 2, `${gz.ganZhi} 见${g}，表达与产出的冲动变强`); add('career', 1, `${g} 也会推动事业上的自主尝试`); }
    if (g === '比肩' || g === '劫财') { add('relation', 1, `${gz.ganZhi} 见${g}，同辈与合作关系上的互动增加`); add('wealth', 1, `${g} 常伴随资源分配上的摩擦`); }
    if (g === '正印' || g === '偏印') add('body', 1, `${gz.ganZhi} 见${g}，偏向休整、学习与内在消化`);
    // 关系：男命以财为伴侣星，女命以官杀为伴侣星
    if (gender === '女' && (g === '正官' || g === '七杀')) add('relation', 2, `女命以官杀为伴侣星，${gz.ganZhi} 见${g}`);
    if (gender !== '女' && (g === '正财' || g === '偏财')) add('relation', 2, `男命以财星为伴侣星，${gz.ganZhi} 见${g}`);
  });

  // 迁移：与日支、年支相冲
  const dayZhi = bazi.pillars[2].zhi, yearZhi = bazi.pillars[0].zhi;
  if (CHONG[gz.zhi] === dayZhi) add('move', 3, `${gz.zhi} 冲日支 ${dayZhi}，与自身处境相关的变动信号`);
  if (CHONG[gz.zhi] === yearZhi) add('move', 2, `${gz.zhi} 冲年支 ${yearZhi}，与环境、根基相关的变动信号`);

  // 身心：日主偏弱而运程持续耗身
  const drain = gods.filter(g => ['正官', '七杀', '食神', '伤官', '正财', '偏财'].includes(g)).length;
  if (bazi.strength.label === '偏弱' && drain >= 2) add('body', 2, `日主偏弱，而 ${gz.ganZhi} 两位都属耗身一类，节奏容易过载`);
  if (bazi.strength.favor.includes(gz.wuxing[0]) || bazi.strength.favor.includes(gz.wuxing[1])) add('body', 1, `${gz.ganZhi} 的五行（${gz.wuxing.join('/')}）落在日主所喜的 ${bazi.strength.favor.join('、')} 上`);

  return { acc, why };
}

/** 紫微侧：大限 / 流年宫位与四化的贡献 */
function ziweiDomainScore(ziwei, at, useDecadal) {
  const acc = {}; const why = {};
  DOMAINS.forEach(d => { acc[d.key] = 0; why[d.key] = []; });
  if (!ziwei) return { acc, why, mutagens: [] };
  const add = (k, n, reason) => { if (!(k in acc)) return; acc[k] += n; why[k].push(reason); };

  const part = useDecadal ? at.decadal : at.yearly;
  const dom = PALACE_DOMAIN[part.palaceName];
  if (dom) add(dom, 2, `${useDecadal ? '大限' : '流年'}命宫落本命${part.palaceName}宫，该阶段重心偏向此处`);

  const mutagens = locateMutagens(ziwei, part.mutagen);
  mutagens.forEach(m => {
    const d = PALACE_DOMAIN[m.palace];
    if (!d) return;
    add(d, m.type === '忌' ? 2 : 1, `${part.ganZhi} 使 ${m.star} 化${m.type}，落${m.palace}宫 — ${m.meaning.plain}`);
  });
  return { acc, why, mutagens };
}

/** 生成大运阶段（10 年一段） */
export function buildStages(bazi, ziwei, gender) {
  return bazi.daYun.map(dy => {
    const gz = { ganZhi: dy.ganZhi, zhi: dy.zhi, shiShenGan: dy.shiShenGan, shiShenZhi: dy.shiShenZhi, wuxing: dy.wuxing };
    const b = baziDomainScore(bazi, gz, gender);
    const midYear = Math.round((dy.startYear + dy.endYear) / 2);
    const at = ziwei ? ziweiAtYear(ziwei, midYear) : null;
    const z = ziweiDomainScore(ziwei, at, true);

    const domains = DOMAINS.map(d => {
      const score = b.acc[d.key] + z.acc[d.key];
      return { ...d, score, level: levelOf(score), baziWhy: b.why[d.key], ziweiWhy: z.why[d.key] };
    });
    return {
      kind: 'stage',
      ganZhi: dy.ganZhi,
      shiShen: [dy.shiShenGan, dy.shiShenZhi].filter(Boolean).join(' / '),
      startAge: dy.startAge, endAge: dy.endAge,
      startYear: dy.startYear, endYear: dy.endYear,
      decadalPalace: at ? at.decadal.palaceName : null,
      decadalRange: at ? at.decadal.range : null,
      domains,
      topDomain: [...domains].sort((a, c) => c.score - a.score)[0]
    };
  });
}

/** 生成逐年数据 */
export function buildYears(bazi, ziwei, gender, fromYear, toYear) {
  const birthYear = bazi.solar.y;
  const out = [];
  for (let y = fromYear; y <= toYear; y++) {
    const { daYun, liuNian } = baziAtYear(bazi, y);
    const b = baziDomainScore(bazi, liuNian, gender);
    const at = ziwei ? ziweiAtYear(ziwei, y) : null;
    const z = ziweiDomainScore(ziwei, at, false);
    const domains = DOMAINS.map(d => {
      const score = b.acc[d.key] + z.acc[d.key];
      return { ...d, score, level: levelOf(score), baziWhy: b.why[d.key], ziweiWhy: z.why[d.key] };
    });
    const total = domains.reduce((a, d) => a + d.score, 0);
    out.push({
      kind: 'year',
      year: y,
      age: y - birthYear,
      ganZhi: liuNian.ganZhi,
      shiShen: [liuNian.shiShenGan, liuNian.shiShenZhi].filter(Boolean).join(' / '),
      daYun: daYun ? daYun.ganZhi : null,
      yearlyPalace: at ? at.yearly.palaceName : null,
      decadalPalace: at ? at.decadal.palaceName : null,
      mutagens: z.mutagens,
      domains,
      total,
      topDomain: [...domains].sort((a, c) => c.score - a.score)[0]
    });
  }
  return out;
}

/** 点击某一年时的完整解释：共识 / 分歧 */
export function explainYear(bazi, ziwei, gender, year) {
  const { daYun, liuNian } = baziAtYear(bazi, year);
  const age = year - bazi.solar.y;
  const stage = stageOf(age);
  const at = ziwei ? ziweiAtYear(ziwei, year) : null;
  const b = baziDomainScore(bazi, liuNian, gender);
  const bStage = daYun ? baziDomainScore(bazi, { ganZhi: daYun.ganZhi, zhi: daYun.zhi, shiShenGan: daYun.shiShenGan, shiShenZhi: daYun.shiShenZhi, wuxing: daYun.wuxing }, gender) : null;
  const z = ziweiDomainScore(ziwei, at, false);

  const domains = DOMAINS.map(d => {
    const bs = b.acc[d.key] + (bStage ? bStage.acc[d.key] * 0.5 : 0);
    const zs = z.acc[d.key];
    return { ...d, baziScore: bs, ziweiScore: zs, score: bs + zs, level: levelOf(bs + zs), baziWhy: [...b.why[d.key], ...(bStage ? bStage.why[d.key].map(x => `（大运）${x}`) : [])], ziweiWhy: z.why[d.key] };
  });

  const marked = domains.filter(d => d.score >= 2).sort((a, c) => c.score - a.score);
  const consensus = domains.filter(d => d.baziScore >= 2 && d.ziweiScore >= 2);
  const divergence = domains.filter(d => (d.baziScore >= 2 && d.ziweiScore === 0) || (d.ziweiScore >= 2 && d.baziScore === 0));

  const insight = makeInsight({
    title: `${year} 年`,
    summary: marked.length
      ? `${year} 年你 ${age} 岁，正在${stage.label}。这一年的信号集中在${marked.slice(0, 2).map(d => d.label).join('和')}上——在${stage.context.场合}这个阶段，它多半体现为跟${stage.context.主线}有关的事。命盘只能说这几处「有话可讲」，具体发生什么还是看你怎么走。`
      : `${year} 年你 ${age} 岁，六个方面都没有特别集中的信号，是命盘上比较安静的一年。安静未必是坏事——${stage.label}里，没有大动静的年份往往是攒东西的年份。`,
    systems: [
      {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: `${daYun ? `你现在走的是 ${daYun.ganZhi} 大运，覆盖 ${daYun.startAge} 到 ${daYun.endAge} 岁，这是这十年的大背景。` : ''}${year} 年本身配的是 ${liuNian.ganZhi}，跟你的日主一比是${[liuNian.shiShenGan, liuNian.shiShenZhi].filter(Boolean).join('和')}。${liuNian.shiShenGan && TEN_GODS_FULL[liuNian.shiShenGan] ? `${liuNian.shiShenGan}代表的是${stripLead(TEN_GODS_FULL[liuNian.shiShenGan].because)}` : ''}这一年你 ${age} 岁，正处在${stage.label}，所以这些信号多半会落在${stage.context.场合}，或者跟${stage.context.同伴}有关的事情上——${stage.context.主线}。`,
        evidence: [
          daYun && ev('da_yun', `${daYun.ganZhi}（${daYun.startAge}–${daYun.endAge} 岁）`, `与日主比对后是 ${[daYun.shiShenGan, daYun.shiShenZhi].filter(Boolean).join(' / ')}`),
          ev('liu_nian', `${year} 年 ${liuNian.ganZhi}`, `与日主比对后是 ${[liuNian.shiShenGan, liuNian.shiShenZhi].filter(Boolean).join(' / ')}，五行属 ${liuNian.wuxing.join('、')}`),
          ev('strength', `日主${bazi.strength.label}，喜 ${bazi.strength.favor.join('、')}`, bazi.strength.basis),
          ...domains.filter(d => d.baziWhy.length).slice(0, 3).map(d => ev('rule', d.label, d.baziWhy[0]))
        ].filter(Boolean)
      },
      ziwei && at && {
        system: 'ziwei', label: SYSTEM_LABEL.ziwei,
        interpretation: `紫微这边，你 ${at.decadal.range.join('–')} 岁这十年的大限走在${at.decadal.palaceName}宫，也就是说这十年的重心偏向${at.decadal.palaceName}这一块。${year} 这一年则落在${at.yearly.palaceName}宫。`,
        evidence: [
          ev('decadal', `大限 ${at.decadal.ganZhi} · ${at.decadal.palaceName}宫`, `${at.decadal.range.join('–')} 岁`),
          ev('palace', `流年命宫落 ${at.yearly.palaceName}`, `流年干支 ${at.yearly.ganZhi}`),
          ...z.mutagens.map(m => ev('mutagen', `${m.star} 化${m.type} 落${m.palace}`, m.meaning.plain))
        ]
      }
    ]
  });

  return {
    year, age: year - bazi.solar.y, daYun, liuNian, at,
    domains, marked, consensus, divergence, insight,
    consensusText: consensus.length
      ? `八字和紫微这两套完全不同的体系，都把这一年的${consensus.map(d => d.label).join('、')}标了出来。两边独立算出同一个方向，这种重合值得多看一眼。`
      : '八字和紫微没有在同一个方面同时给出明显信号。这不是矛盾，只是两套体系关注的东西本来就不一样。',
    divergenceText: divergence.length
      ? divergence.map(d => `${d.label}这一项，${d.baziScore >= 2 ? `八字有信号（${d.baziWhy[0] || ''}），紫微这一年却没指向这里` : `紫微有信号（${d.ziweiWhy[0] || ''}），八字这一年却没指向这里`}`).join('；') + '。分歧本身也是信息：说明这件事没有那么确定。'
      : '两套体系在各方面都没有明显对立。'
  };
}
