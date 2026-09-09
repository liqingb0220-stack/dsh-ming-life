import { analyzeName, generateNames, continueFrom, analyzeSound } from '../src/engines/naming.js';
import { NAME_CHARS } from '../src/data/nameChars.js';
import { buildBazi } from '../src/engines/bazi.js';
const b = buildBazi({ date: '1990-05-20', time: '14:30', gender: '男' }); // 乙木偏弱，喜木、水

console.log('== 单名分析 ==');
const a = analyzeName({ surname: '林', chars: ['清', '澜'], bazi: b });
console.log(a.full, '| 气质:', a.vibes.join(' '), '| 音律:', a.sound.level, a.sound.pattern, '|', a.sound.pinyin);
console.log(' 摘要:', a.insight.summary);
a.insight.systems.forEach(s => console.log('  ·', s.label, '→', s.interpretation.slice(0, 80), `(${s.evidence.length}条依据)`));

console.log('\n== 拗口检测 ==');
[['张','子','杰'],['李','丽','莉'],['王','雨','宇'],['沈','诗','思']].forEach(([s,x,y])=>{
  const n = analyzeName({ surname: s, chars: [x,y], bazi: null });
  if(n) console.log(` ${n.full}: ${n.sound.level} | 问题: ${n.sound.issues.map(i=>i.text).join(' ')||'无'}`);
});
// 手工构造三声连读与叠韵
const t3 = analyzeSound(NAME_CHARS.find(c=>c.c==='雅'), [NAME_CHARS.find(c=>c.c==='静')]);
console.log(' 雅(3)静(4):', t3.pattern, t3.issues.map(i=>i.key).join()||'无问题');

console.log('\n== 生成（喜木水，气质清朗）==');
const gen = generateNames({ surname: '林', vibes: ['清朗'], bazi: b, limit: 8 });
gen.forEach(n => console.log(` ${n.full} [${n.vibes.slice(0,2).join('/')}] 音律${n.sound.level} 五行${n.chars.map(c=>c.c+c.wuxing).join('')} 喜用命中${n.wuxing.hits.length}`));
console.log(' 全部命中喜用五行:', gen.every(n => n.wuxing.hits.length > 0));

console.log('\n== 锁字 + 沿方向继续 ==');
const anchor = gen[0];
const more = continueFrom({ name: anchor, keepIndex: 0, surname: '林', bazi: b, limit: 6 });
console.log(` 锁定「${anchor.chars[0].c}」:`, more.map(n=>n.full).join(' '));
console.log(' 首字全部一致:', more.every(n => n.chars[0].c === anchor.chars[0].c));
console.log(' 未重复原名:', !more.some(n => n.full === anchor.full));

console.log('\n== 排除字 ==');
const ex = generateNames({ surname: '陈', bazi: b, dislikes: ['清','澜','沐'], limit: 10 });
console.log(' 排除后不含被排除字:', !ex.some(n => n.chars.some(c => ['清','澜','沐'].includes(c.c))));
console.log(' 样例:', ex.slice(0,5).map(n=>n.full).join(' '));

console.log('\n== 无命盘也可用 ==');
const nb = generateNames({ surname: '苏', vibes: ['雅致'], bazi: null, limit: 4 });
console.log(' ', nb.map(n=>n.full).join(' '), '| 命理层缺省:', nb[0].insight.systems.length === 3);
