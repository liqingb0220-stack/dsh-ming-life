import { createBranch, nextEvent, applyChoice, rewind, describeTimeline, SIM_STATS, DEFAULT_STATE } from '../src/engines/simulation.js';
let t = createBranch({ sourceEvent: { event_id: 'e1', title: '两份工作选哪个', outcome: { final_choice: 'A：留在大厂' } }, notTakenOption: 'B：去创业公司', startYear: 2026 });
console.log('分叉点:', t.branchPoint.sourceTitle, '| 现实选了:', t.branchPoint.actualChoice, '| 模拟走:', t.branchPoint.simulatedChoice);
console.log('起始:', describeTimeline(t));
for (let i = 0; i < 8; i++) {
  const e = nextEvent(t);
  const pick = i % e.options.length;
  t = applyChoice(t, e, pick);
  const h = t.history[t.history.length - 1];
  console.log(` ${h.year} ${h.eventTitle} → ${h.choice}`);
  console.log(`     ${h.note}  变化: ${h.changes.map(c => c.delta === null ? `${c.label} ${c.from}→${c.to}` : `${c.label}${c.delta > 0 ? '+' : ''}${c.delta}`).join(' ') || '无'}`);
}
console.log('\n最终:', describeTimeline(t));
console.log('状态全部在合法区间:', SIM_STATS.filter(s=>s.type!=='text').every(s => t.state[s.key] >= 0 && t.state[s.key] <= (s.max||100)));
const back = rewind(t, 3);
console.log('回退到第 3 步:', back.year, back.history.length, '步 |', describeTimeline(back));
console.log('回退到 0:', JSON.stringify(rewind(t,0).state) === JSON.stringify(DEFAULT_STATE));
// 可复现性
let t2 = createBranch({ sourceEvent: { event_id: 'e1', title: '两份工作选哪个' }, notTakenOption: 'B', startYear: 2026 });
const seq1 = [], seq2 = [];
let a = createBranch({ sourceEvent: { title: '两份工作选哪个' }, startYear: 2026 });
for (let i=0;i<5;i++){ const e=nextEvent(a); seq1.push(e.id); a=applyChoice(a,e,0); }
let b2 = createBranch({ sourceEvent: { title: '两份工作选哪个' }, startYear: 2026 });
for (let i=0;i<5;i++){ const e=nextEvent(b2); seq2.push(e.id); b2=applyChoice(b2,e,0); }
console.log('同种子事件序列可复现:', JSON.stringify(seq1)===JSON.stringify(seq2), seq1.join('→'));
