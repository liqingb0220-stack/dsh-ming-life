import { buildBazi } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { runDecision } from '../src/engines/decision.js';
const b = buildBazi({ date: '1990-05-20', time: '14:30', gender: '男' });
const z = buildZiwei({ date: '1990-05-20', time: '14:30', gender: '男' });
const event = { id: 'evt_test1', title: '两份工作选哪个', description: '一份大厂稳定，一份创业公司' };
const options = [
  { id: 'o1', name: 'A：留在大厂', description: '工资高、五险一金、稳定，但重复性强' },
  { id: 'o2', name: 'B：去创业公司', description: '自由度高、能成长、可以自己做主，但风险大' }
];
const r = runDecision({ bazi: b, ziwei: z, gender: '男', event, options, now: new Date('2026-09-08T15:20:00') });
console.log('== 共识 ==\n', r.consensus.text, '\n 来源:', r.consensus.sources.join('、'));
console.log('\n== 分歧 ==');
r.divergence.forEach(d => console.log(' -', d.text));
console.log('\n== 需要你决定的变量 ==');
r.variables.forEach(v => console.log(` [${v.poles.join(' vs ')}]${v.discriminating ? '' : '（选项描述未拉开差距）'}\n   ${v.statement}\n   ${v.hint}`));
console.log('\n== 选项视图 ==');
r.optionViews.forEach(o => console.log(` ${o.option.name} → ${o.tendency} | ${o.summary}`));
console.log('\n== 总判断 ==\n', r.insight.summary, '\n', r.insight.note);
r.insight.systems.forEach(s => console.log('\n ·', s.label, '\n   ', s.interpretation, '\n    证据:', s.evidence.map(e => e.label + '=' + e.value).join(' | ')));
