/**
 * 可视化人生地图（PRD §20）。
 * 把大运阶段与六维强度铺成一条可读的"河道"，交给 SVG 渲染。
 */
import { DOMAINS } from '../data/stars';
import { buildStages } from './timeline';

export function buildLifeMap(bazi, ziwei, gender, { width = 900, height = 320, pad = 44 } = {}) {
  const stages = buildStages(bazi, ziwei, gender);
  if (!stages.length) return null;

  const minAge = stages[0].startAge;
  const maxAge = stages[stages.length - 1].endAge;
  // 末段要画到 endAge+1 才能占满该段宽度，所以跨度按 (maxAge+1 - minAge) 算
  const span = Math.max(1, maxAge + 1 - minAge);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const x = age => pad + ((age - minAge) / span) * innerW;

  // 各维度在所有阶段中的最大分，用于归一化（分数没有理论上限，按实际范围铺开）
  const maxScore = Math.max(3, ...stages.flatMap(s => s.domains.map(d => d.score)));

  const bandH = innerH / DOMAINS.length;
  const bands = DOMAINS.map((dom, di) => {
    const y0 = pad + di * bandH;
    const points = stages.map(s => {
      const d = s.domains.find(x2 => x2.key === dom.key);
      return {
        stage: s,
        domain: d,
        x0: x(s.startAge),
        x1: x(s.endAge + 1),
        intensity: d.score / maxScore,
        h: Math.max(2, (d.score / maxScore) * (bandH - 8))
      };
    });
    return { ...dom, y0, bandH, points };
  });

  // 关键节点：某阶段某维度分数为全局前几
  const peaks = stages
    .flatMap(s => s.domains.map(d => ({ stage: s, domain: d, score: d.score })))
    .filter(p => p.score >= Math.max(4, Math.round(maxScore * 0.6)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const ticks = [];
  for (let a = Math.ceil(minAge / 10) * 10; a <= maxAge; a += 10) ticks.push({ age: a, x: x(a) });

  return {
    width, height, pad, minAge, maxAge, maxScore,
    stages, bands, peaks, ticks,
    stageMarks: stages.map(s => ({ ...s, x0: x(s.startAge), x1: x(s.endAge + 1), mid: (x(s.startAge) + x(s.endAge + 1)) / 2 })),
    summary: peaks.length
      ? `全生涯里信号最集中的是 ${peaks.slice(0, 3).map(p => `${p.stage.startAge}–${p.stage.endAge} 岁的${p.domain.label}`).join('、')}。`
      : '各阶段之间没有特别突出的差异。'
  };
}
