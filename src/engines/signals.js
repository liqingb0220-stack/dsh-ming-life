/**
 * 规则引擎：从排盘事实里挑出「信号」。
 * 只标出来，不解释——解释是 DSH 的活。每条信号都能追溯到盘面上的一处。
 */
import { analyzeDistribution } from './distribution';
import { detectConflicts } from './portrait';
import { branchSetRelations } from './branches';
import { explainYear } from './timeline';
import { stageOf } from './compose';
import { DOMAINS } from '../data/stars';

export function chartSignals(bazi, ziwei) {
  const out = [];
  const push = (group, label, value, detail = '') => out.push({ group, label, value, detail });

  push('日主', `${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}）`, bazi.strength.label, `${bazi.strength.basis}喜 ${bazi.strength.favor.join('、')}`);

  const wx = Object.entries(bazi.wuxingPct || {}).sort((a, b) => b[1] - a[1]);
  if (wx.length) {
    push('五行', '最旺', `${wx[0][0]} ${wx[0][1]}%`);
    const weak = wx[wx.length - 1];
    push('五行', weak[1] === 0 ? '缺' : '最弱', `${weak[0]} ${weak[1]}%`);
  }

  const dist = analyzeDistribution(bazi);
  dist.strong.forEach(s => push('十神', '偏重', `${s.god} ${s.pct}%`));
  if (dist.absent.length) push('十神', '缺失', dist.absent.map(s => s.god).join('、'));
  if (dist.scarce.length) push('十神', '偏少', dist.scarce.map(s => `${s.god} ${s.pct}%`).join('、'));
  if (dist.monthGod && dist.monthGod !== '日主') push('十神', '月令透出', dist.monthGod);

  branchSetRelations(bazi.pillars.map(p => ({ zhi: p.zhi, pos: p.pos }))).forEach(r => {
    push('干支', r.label, `${r.pair}${r.between ? `（${r.between.map(b => b.pos).join('')}柱）` : ''}`, r.plain);
  });

  if (ziwei) {
    const star = s => `${s.name}${s.brightness ? `(${s.brightness})` : ''}${s.mutagen ? `化${s.mutagen}` : ''}`;
    push('紫微', '五行局', ziwei.fiveElementsClass);
    push('紫微', '命宫', `${ziwei.soulPalace.stem}${ziwei.soulPalace.branch} · ${ziwei.soulMajors.map(star).join('、') || '无主星'}${ziwei.borrowedFrom ? `（借${ziwei.borrowedFrom}）` : ''}`);
    const body = ziwei.palaces.find(p => p.isBody);
    if (body) push('紫微', '身宫', `${body.name} · ${body.majorStars.filter(s => s.isMajor).map(star).join('、') || '无主星'}`);
    ['官禄', '财帛', '夫妻', '迁移', '疾厄', '福德'].forEach(n => {
      const p = ziwei.palaces.find(x => x.name === n);
      if (p) push('紫微', `${n}宫`, p.majorStars.filter(s => s.isMajor).map(star).join('、') || '无主星');
    });
    ziwei.palaces.forEach(p => [...p.majorStars, ...p.minorStars].filter(s => s.mutagen).forEach(s => push('紫微', `化${s.mutagen}`, `${s.name} 在${p.name}`)));
  }

  detectConflicts(bazi, ziwei).forEach(c => push('张力', c.name, c.plain, c.basis));
  return out;
}

/** 某一年：六个方面全部列出，不只挑最强的 */
export function yearSignals(bazi, ziwei, gender, year) {
  if (!bazi?.daYun?.length) return null;
  const ey = explainYear(bazi, ziwei, gender, year);
  const ss = [ey.liuNian.shiShenGan, ey.liuNian.shiShenZhi].filter(Boolean).join('/');
  return {
    year, age: ey.age, stage: stageOf(ey.age).label,
    daYun: ey.daYun ? `${ey.daYun.ganZhi}（${ey.daYun.startAge}–${ey.daYun.endAge} 岁）` : null,
    liuNian: `${ey.liuNian.ganZhi}${ss ? `（对日主为 ${ss}）` : ''}`,
    ziweiYear: ey.at ? `大限走${ey.at.decadal.palaceName}宫，流年落${ey.at.yearly.palaceName}宫` : null,
    domains: DOMAINS.map(d => {
      const dom = ey.domains.find(x => x.key === d.key);
      return { key: d.key, label: d.label, level: dom.level.label, color: dom.level.color, score: dom.score, why: [...dom.baziWhy, ...dom.ziweiWhy].slice(0, 3) };
    }),
    consensus: ey.consensus.map(d => d.label),
    divergence: ey.divergence.map(d => d.label)
  };
}

export const signalsToText = list => list.map(s => `- ${s.group}｜${s.label}：${s.value}${s.detail ? `（${s.detail}）` : ''}`).join('\n');

export const yearToText = ys => ys ? [
  `${ys.year} 年，${ys.age} 岁，${ys.stage}。${ys.daYun ? `大运 ${ys.daYun}，` : ''}流年 ${ys.liuNian}。${ys.ziweiYear ? `紫微：${ys.ziweiYear}。` : ''}`,
  ...ys.domains.map(d => `- ${d.label}：${d.level}${d.why.length ? `——${d.why.join('；')}` : ''}`),
  ys.consensus.length ? `两套体系都标出的：${ys.consensus.join('、')}` : '两套体系没有同时标出同一方面',
  ys.divergence.length ? `只有一套体系标出的：${ys.divergence.join('、')}` : ''
].filter(Boolean).join('\n') : '';
