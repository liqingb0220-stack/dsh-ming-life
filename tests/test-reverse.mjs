import { solarFromPillars, SHICHEN, shichenOfHour } from '../src/engines/reverse.js';
import { buildBazi } from '../src/engines/bazi.js';

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.log('  ✗', n, x)); };

console.log('[反推] 往返一致性：排盘 → 四柱 → 反推 → 应能还原原日期');
const samples = [
  ['1990-05-20', '14:30'], ['1985-01-01', '00:10'], ['2000-12-31', '23:50'],
  ['1976-02-29', '06:00'], ['2024-02-29', '12:00'], ['1953-08-07', '21:15'],
  ['2011-11-11', '11:11'], ['1999-06-15', '17:40']
];
samples.forEach(([d, t]) => {
  const b = buildBazi({ date: d, time: t, gender: '男' });
  const p = {
    year: b.pillars[0].gan + b.pillars[0].zhi,
    month: b.pillars[1].gan + b.pillars[1].zhi,
    day: b.pillars[2].gan + b.pillars[2].zhi,
    hour: b.pillars[3].gan + b.pillars[3].zhi
  };
  const r = solarFromPillars(p);
  const hit = r.candidates.some(c => c.date === d);
  ok(`${d} ${t} → ${Object.values(p).join(' ')} → ${r.candidates.length} 个候选`, r.ok && hit,
     hit ? '' : `候选里没有原日期：${r.candidates.map(c => c.date).join()}`);
});

console.log('\n[反推] 反推出的日期重新排盘，四柱必须一致');
const b0 = buildBazi({ date: '1990-05-20', time: '14:30', gender: '男' });
const p0 = { year: '庚午', month: '辛巳', day: '乙酉', hour: '癸未' };
const r0 = solarFromPillars(p0);
const allMatch = r0.candidates.every(c => {
  const b2 = buildBazi({ date: c.date, time: c.time, gender: '男' });
  return b2.pillars.map(x => x.gan + x.zhi).join(' ') === Object.values(p0).join(' ');
});
ok('每个候选重新排盘都还原同一组四柱', allMatch, r0.candidates.map(c => c.date + ' ' + c.time).join(' | '));
console.log('   候选:', r0.candidates.map(c => `${c.date} ${c.shichen.label}(${c.time})`).join('  '));

console.log('\n[反推] 非法与不可能');
ok('不合法干支被拒', solarFromPillars({ year: '甲', month: '辛巳', day: '乙酉', hour: '癸未' }).reason === 'invalid');
ok('不可能组合返回 impossible', solarFromPillars({ year: '甲子', month: '甲子', day: '甲子', hour: '甲子' }).reason === 'impossible');

console.log('\n[时辰]');
ok('十二时辰齐全', SHICHEN.length === 12);
ok('0 点属子时', shichenOfHour(0).zhi === '子');
ok('23 点属子时', shichenOfHour(23).zhi === '子');
ok('14 点属未时', shichenOfHour(14).zhi === '未');
ok('每个时辰的探测点落在自己的范围内', SHICHEN.every(s => shichenOfHour(s.probe).zhi === s.zhi));

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
