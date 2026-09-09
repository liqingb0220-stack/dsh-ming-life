import { buildBazi } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { buildReveal, buildHighlights } from '../src/engines/reveal.js';
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.log('  ✗', n, x)); };
const cases = [['1990-05-20','14:30','男','阿明'], ['2003-02-20','17:00','女','小满'], ['1978-11-02','07:20','女','']];
for (const [d, t, g, name] of cases) {
  const b = buildBazi({ date: d, time: t, gender: g }), z = buildZiwei({ date: d, time: t, gender: g });
  const r = buildReveal(b, z, g, name || '你');
  const h = buildHighlights(b, z, g);
  const all = JSON.stringify({ r, h });
  console.log(`\n【${d} ${name || '你'}】`);
  console.log(' 判词:', r.verdict);
  r.scenes.forEach(s => console.log('   —', s));
  r.converge.forEach(c => console.log('   ·', c));
  console.log(' 现在:', r.now?.text);
  h.forEach(x => console.log(` ${x.label}｜${x.title} — ${x.text.slice(0, 60)}…`));
  ok('判词来自最重十神，不是「不是X而是Y」句式', r.verdict.length > 4 && !/不是.*而是/.test(r.verdict));
  ok('两三个场景且不重复', r.scenes.length >= 2 && new Set(r.scenes).size === r.scenes.length);
  ok('共同指向至少两条', r.converge.length >= 2);
  ok('信号最集中的段 1–3 个', h.length >= 1 && h.length <= 3);
  ok('段标题写的是「信号最集中」而不是事件预言', h.every(x => x.title.includes('信号最集中')));
  ok('不下断言、不制造焦虑', !/必然|一定会|注定|宣判|劫(?!财)|灾|凶|必将|逃不掉|完蛋/.test(all), all.match(/.{20}(必然|一定会|注定|宣判|劫(?!财)|灾|凶|必将|逃不掉|完蛋).{20}/)?.[0]);
  ok('无 [object Object] / undefined', !/\[object Object\]|undefined|NaN/.test(all));
  ok('年龄语境出现在段落里', h.every(x => /岁/.test(x.text)));
}
console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
