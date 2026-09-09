import { buildBazi } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { buildPortrait } from '../src/engines/portrait.js';
const b = buildBazi({ date: '1990-05-20', time: '14:30', gender: '男' });
const z = buildZiwei({ date: '1990-05-20', time: '14:30', gender: '男' });
const p = buildPortrait(b, z);
p.dimensions.forEach(d => console.log(`${d.label}: ${d.score} (八字${d.baziScore}/紫微${d.ziweiScore}) — ${d.desc}`));
console.log('\n--- 主题 ---');
p.themes.forEach(t => {
  console.log('#', t.title);
  console.log('  ', t.summary);
  t.systems.forEach(s => console.log('   ·', s.label, '=>', s.interpretation.slice(0, 70), '| 证据', s.evidence.length, '条'));
  if (t.note) console.log('   note:', t.note);
});
