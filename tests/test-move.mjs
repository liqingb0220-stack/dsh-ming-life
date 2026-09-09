import { buildBazi } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { buildYears } from '../src/engines/timeline.js';
const b = buildBazi({ date: '1990-05-20', time: '14:30', gender: '男' });
const z = buildZiwei({ date: '1990-05-20', time: '14:30', gender: '男' });
console.log('日支', b.pillars[2].zhi, '年支', b.pillars[0].zhi, '→ 冲支应为 卯 / 子');
buildYears(b, z, '男', 2026, 2037).forEach(y => {
  const m = y.domains.find(d => d.key === 'move');
  console.log(` ${y.year} ${y.ganZhi} 迁移=${m.score}(${m.level.label})${m.baziWhy.length ? ' ← ' + m.baziWhy[0] : ''}${m.ziweiWhy.length ? ' ← ' + m.ziweiWhy[0] : ''}`);
});
