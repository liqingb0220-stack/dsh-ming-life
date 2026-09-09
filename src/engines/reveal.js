/**
 * 命盘开卷：建档完成后的第一屏。
 *
 * 目的只有一个——让人在十秒内看到「它是不是在说我」。
 * 所以这里不摆维度、不摆表格，只给：四柱、一句判词、两三个场景、两套体系共同指向的东西。
 * 措辞刻意留余地：这是一种读法，不是宣判。
 */
import { analyzeDistribution } from './distribution';
import { TEN_GODS_FULL } from '../data/readings';
import { STAR_SCENES } from '../data/scenes';
import { MAJOR_STARS } from '../data/stars';
import { buildYears } from './timeline';
import { stageOf } from './compose';

const trimDot = t => (t || '').replace(/。$/, '');
// 缺失描述的第一句去掉「命里X缺失，说明」这个引子，接在「命里没有X」后面
const absentGist = t => trimDot((t || '').split('。')[0]).replace(/^命里[^，]*，(说明)?/, '');

export function buildReveal(bazi, ziwei, gender, name = '你') {
  const dist = analyzeDistribution(bazi);
  const sorted = dist.shares.slice().sort((a, b) => b.pct - a.pct).filter(x => x.pct > 0);
  const lead = sorted[0], second = sorted[1];
  const L = TEN_GODS_FULL[lead.god], S = second ? TEN_GODS_FULL[second.god] : null;

  // 判词：直接用最重十神的 headline，不加「不是 X 而是 Y」这种修辞——那会暗示系统排除过什么
  const verdict = L.headline;
  const verdictLead = '从盘面上看，你身上分量最重的一股劲，多半是这个——';

  // 场景：最重的两条 + 次重的一条
  const scenes = [...L.scenes.slice(0, 2), ...(S ? S.scenes.slice(0, 1) : [])];

  // 两套体系共同指向：八字最重十神 + 紫微命宫主星，各一句
  const soul = ziwei ? ziwei.soulMajors.map(s => s.name) : [];
  const star = soul.map(n => STAR_SCENES[n]).filter(Boolean)[0];
  const converge = [
    `八字里${lead.god}占 ${lead.pct}%——${trimDot(L.headline)}`,
    star ? `紫微命宫坐${soul[0]}——${trimDot(star.headline)}` : null,
    dist.absent.length ? `命里没有${dist.absent.map(a => a.god).join('、')}——${absentGist(TEN_GODS_FULL[dist.absent[0].god].absent)}` : null
  ].filter(Boolean);

  // 当下：今年在哪个阶段、信号落在哪
  const year = new Date().getFullYear();
  const age = year - bazi.solar.y;
  const stage = stageOf(age);
  let now = null;
  if (bazi.daYun.length) {
    const [y] = buildYears(bazi, ziwei, gender, year, year);
    const top = y.domains.slice().sort((a, b) => b.score - a.score)[0];
    now = {
      year, age, stage: stage.label,
      text: top.score >= 2
        ? `今年你 ${age} 岁，在${stage.label}。这一年盘面上信号最集中的是${top.label}，多半会落在${stage.context.主线}这类事情上。`
        : `今年你 ${age} 岁，在${stage.label}。这一年盘面上没有特别集中的信号，是比较安静的一年——安静的年份往往是攒东西的年份。`
    };
  }

  return {
    name,
    pillars: bazi.pillars.map(p => p.gan + p.zhi),
    dayMaster: bazi.dayMaster,
    strength: bazi.strength.label,
    verdictLead, verdict, scenes, converge, now,
    lead, second,
    footnote: '这是命理体系对盘面结构的一种读法，不是定论。每一句都可以在后面的页面里点开，看它是从哪几个字推出来的。'
  };
}

/**
 * 未来十年里信号最集中的两三段。给「我将去向何方」做第一层，表格退到第二层。
 * 相邻年份合并成一段；标题写「哪方面的信号最集中」，不写「会发生什么」。
 */
export function buildHighlights(bazi, ziwei, gender, fromYear = new Date().getFullYear(), span = 10) {
  if (!bazi.daYun.length) return [];
  const years = buildYears(bazi, ziwei, gender, fromYear, fromYear + span - 1);
  const ranked = years.slice().sort((a, b) => b.total - a.total).slice(0, 4);
  const picked = new Set(ranked.map(y => y.year));
  // 合并相邻
  const groups = [];
  years.forEach(y => {
    if (!picked.has(y.year)) return;
    const last = groups[groups.length - 1];
    if (last && y.year === last.to + 1) { last.to = y.year; last.years.push(y); }
    else groups.push({ from: y.year, to: y.year, years: [y] });
  });
  return groups.slice(0, 3).map(g => {
    const agg = {};
    g.years.forEach(y => y.domains.forEach(d => { agg[d.key] = (agg[d.key] || 0) + d.score; }));
    const top = Object.entries(agg).sort((a, b) => b[1] - a[1]);
    const d0 = g.years[0].domains.find(d => d.key === top[0][0]);
    const d1 = top[1] ? g.years[0].domains.find(d => d.key === top[1][0]) : null;
    const age0 = g.from - bazi.solar.y, age1 = g.to - bazi.solar.y;
    const stage = stageOf(age0);
    const why = g.years.flatMap(y => y.domains.find(d => d.key === top[0][0]).baziWhy.concat(y.domains.find(d => d.key === top[0][0]).ziweiWhy))[0] || '';
    return {
      from: g.from, to: g.to, age0, age1,
      label: g.from === g.to ? `${g.from}` : `${g.from}–${g.to}`,
      title: `${d0.label}${d1 && top[1][1] >= top[0][1] * 0.7 ? `与${d1.label}` : ''}上的信号最集中`,
      text: `${age0 === age1 ? `${age0} 岁` : `${age0}–${age1} 岁`}，${stage.label}。${why ? `盘面上的一个信号是「${why}」。` : ''}落在${stage.context.场合}这一块，多半体现为跟${stage.context.主线}有关的事——具体是好是坏，看你怎么走。`,
      domainKey: d0.key, color: d0.color,
      midYear: Math.round((g.from + g.to) / 2)
    };
  });
}
