import { buildBazi } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { buildStages, buildYears, explainYear } from '../src/engines/timeline.js';
const b = buildBazi({ date: '1990-05-20', time: '14:30', gender: '男' });
const z = buildZiwei({ date: '1990-05-20', time: '14:30', gender: '男' });
const stages = buildStages(b, z, '男');
stages.slice(0, 5).forEach(s => {
  console.log(`${s.startAge}-${s.endAge}岁 ${s.ganZhi}(${s.shiShen}) 大限${s.decadalPalace} | ` + s.domains.map(d => `${d.label}${d.score}${d.level.label}`).join(' '));
});
console.log('\n--- 2026 ---');
const e = explainYear(b, z, '男', 2026);
console.log(e.insight.summary);
console.log('共识:', e.consensusText);
console.log('分歧:', e.divergenceText);
e.insight.systems.forEach(s => { console.log(' ·', s.label, '=>', s.interpretation); s.evidence.forEach(x => console.log('     -', x.label + ':', x.value, '|', x.detail)); });
console.log('\n逐年:');
buildYears(b, z, '男', 2026, 2032).forEach(y => console.log(` ${y.year}(${y.age}岁) ${y.ganZhi} ${y.shiShen} 流年宫${y.yearlyPalace} 总${y.total} 最强:${y.topDomain.label}${y.topDomain.level.label}`));
