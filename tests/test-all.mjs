// 回归：MVP 主链 + 边界情况
import { buildBazi, buildBaziFromPillars, baziAtYear } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { buildPortrait } from '../src/engines/portrait.js';
import { buildStages, buildYears, explainYear } from '../src/engines/timeline.js';
import { runDecision } from '../src/engines/decision.js';
import * as S from '../src/store/store.js';

// node 环境没有 localStorage，垫一个用于迁移测试
if (typeof localStorage === 'undefined') {
  const mem = {};
  globalThis.localStorage = {
    getItem: k => (k in mem ? mem[k] : null),
    setItem: (k, v) => { mem[k] = String(v); },
    removeItem: k => { delete mem[k]; }
  };
}

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { cond ? (pass++, console.log('  ✓', name)) : (fail++, console.log('  ✗', name, extra)); };

console.log('\n[1] 出生档案 → 基础盘');
const cases = [
  { date: '1990-05-20', time: '14:30', gender: '男' },
  { date: '1985-01-01', time: '00:10', gender: '女' },   // 早子时
  { date: '2000-12-31', time: '23:50', gender: '女' },   // 晚子时跨日
  { date: '1976-02-29', time: '06:00', gender: '男' },   // 闰日
  { date: '2024-02-29', time: '12:00', gender: '女' },
  { date: '1990-05-20', timeUnknown: true, gender: '男' } // 时辰不确定
];
cases.forEach(c => {
  const b = buildBazi(c);
  const z = buildZiwei(c);
  ok(`${c.date} ${c.time || '时辰不确定'} ${c.gender}`,
    b.pillars.length === 4 && b.tenGods.length > 0 && b.daYun.length > 0 && z.palaces.length === 12,
    `柱${b.pillars.length} 十神${b.tenGods.length} 大运${b.daYun.length} 宫${z.palaces?.length}`);
});

console.log('\n[2] 画像 / 时间轴 / 决策');
const b = buildBazi(cases[0]), z = buildZiwei(cases[0]);
const p = buildPortrait(b, z);
ok('六维画像齐全且分值在 0-100', p.dimensions.length === 6 && p.dimensions.every(d => d.score >= 0 && d.score <= 100));
ok('每个维度都有可展开的体系依据', p.dimensions.every(d => d.insight.systems.length >= 1 && d.insight.systems.every(s => s.evidence.length >= 1)));
ok('五条人生主题且都可追溯', p.themes.length === 5 && p.themes.every(t => t.systems.some(s => s.evidence.length >= 1)));
ok('无「必然/一定/注定」等断言措辞',
  ![...p.themes, ...p.dimensions.map(d => d.insight)].some(i => /必然|一定会|注定/.test(i.summary)));

const stages = buildStages(b, z, '男');
ok('大运阶段覆盖全部大运', stages.length === b.daYun.length && stages.every(s => s.domains.length === 6));
const years = buildYears(b, z, '男', 2026, 2045);
ok('逐年数据 20 年无缺口', years.length === 20 && years.every(y => y.ganZhi && y.domains.length === 6));
ok('迁移维度在冲支年份被触发', years.some(y => y.domains.find(d => d.key === 'move').score > 0));
const ey = explainYear(b, z, '男', 2029);
ok('年份解释含共识与分歧文本', !!ey.consensusText && !!ey.divergenceText && ey.insight.systems.length === 2);

const evt = { id: 'e1', title: '换不换工作', description: '' };
const opts = [
  { id: 'a', name: '留在大厂', description: '工资高、稳定、熟悉' },
  { id: 'b', name: '去创业', description: '自由、成长、新领域' },
  { id: 'c', name: '先休息半年', description: '' }
];
const r = runDecision({ bazi: b, ziwei: z, gender: '男', event: evt, options: opts });
ok('三选项均得到独立卦象', r.liuyao.length === 3 && new Set(r.liuyao.map(l => l.gua.ben.no)).size >= 2);
ok('输出共识/分歧/变量三段', !!r.consensus.text && r.divergence.length >= 1 && r.variables.length >= 2);
ok('不输出「建议选 X」', !/建议选|你应该选|最好选/.test(JSON.stringify(r)));
ok('决策结果可复现（同事件同选项）', JSON.stringify(runDecision({ bazi: b, ziwei: z, gender: '男', event: evt, options: opts, now: new Date('2026-09-08') }).liuyao.map(l => l.gua.ben.no)) === JSON.stringify(runDecision({ bazi: b, ziwei: z, gender: '男', event: evt, options: opts, now: new Date('2026-09-08') }).liuyao.map(l => l.gua.ben.no)));

console.log('\n[3] 方式 B：直接输入四柱');
const b2 = buildBaziFromPillars({ year: '庚午', month: '辛巳', day: '乙酉', hour: '癸未', gender: '男' });
ok('与出生信息路径的五行统计一致', JSON.stringify(b2.wuxingPct) === JSON.stringify(b.wuxingPct));
ok('与出生信息路径的十神一致', JSON.stringify(b2.tenGods.map(t => [t.god, t.weight])) === JSON.stringify(b.tenGods.map(t => [t.god, t.weight])));
ok('无大运（缺公历日期）且被标记 limited', b2.daYun.length === 0 && b2.limited === true);
ok('仅八字也能生成画像', buildPortrait(b2, null).dimensions.length === 6);

console.log('\n[4] 存储与事件生命周期（多档案）');
let st = { ...S.EMPTY };
const c1 = S.createProfile(st, { name: '我', relation: 'self', birth_date: '1990-05-20', birth_time: '14:30', gender: '男' });
st = c1.state;
ok('档案已创建且带姓名', st.profiles.length === 1 && st.profiles[0].name === '我' && st.activeProfileId === c1.profile.profile_id);
const charts = S.deriveCharts(S.activeProfile(st));
ok('档案可派生双盘', !!charts.bazi && !!charts.ziwei);

// 多档案
const c2 = S.createProfile(st, { name: '小满', relation: 'child', birth_date: '2019-08-08', birth_time: '09:00', gender: '女' });
st = c2.state;
ok('可以建第二个档案', st.profiles.length === 2 && st.activeProfileId === c2.profile.profile_id);
ok('两个档案的盘不同',
  S.deriveCharts(st.profiles[0]).bazi.pillars.map(x=>x.gan+x.zhi).join('') !==
  S.deriveCharts(st.profiles[1]).bazi.pillars.map(x=>x.gan+x.zhi).join(''));

const created = S.createEvent(st, { title: '测试事件', event_type: 'decision' });
st = created.state;
const eid = created.event.event_id;
st = S.addOption(st, eid, { name: 'A' });
st = S.addOption(st, eid, { name: 'B' });
st = S.addReading(st, eid, { system: 'multi', result: { summary: '第一次解读' } });
st = S.addReading(st, eid, { system: 'bazi', result: { summary: '第二次解读' } });
const cur = () => S.activeProfile(st);
ok('事件挂在当前档案下', cur().events.length === 1 && st.profiles[0].events.length === 0);
ok('多次解读并存、不覆盖', cur().events[0].readings.length === 2 && cur().events[0].readings[0].result.summary === '第一次解读');
st = S.setOutcome(st, eid, { final_choice: 'A', actual_result: '', reflection: '' });
ok('记录选择后状态 → 等待结果', cur().events[0].status === 'waiting');
st = S.setOutcome(st, eid, { final_choice: 'A', actual_result: '后来去了 A', reflection: '当时低估了通勤' });
ok('补充结果后状态 → 已回看', cur().events[0].status === 'reviewed');
ok('补充结果未覆盖原始解读', cur().events[0].readings[0].result.summary === '第一次解读');

st = S.switchProfile(st, st.profiles[0].profile_id);
ok('切换档案后事件互不干扰', S.activeProfile(st).events.length === 0);
st = S.switchProfile(st, c2.profile.profile_id);
ok('切回去事件还在', S.activeProfile(st).events.length === 1);

const tree = S.exportTree(st);
ok('导出目录按档案分区', Object.keys(tree).filter(k => k.includes('/profiles/')).length > 0
  && new Set(Object.keys(tree).map(k => k.split('/')[3])).size === 2);
ok('导出含解读文件', Object.keys(tree).some(k => k.includes('/readings/')));

st = S.removeProfile(st, c2.profile.profile_id);
ok('删除档案后自动切到剩下的', st.profiles.length === 1 && st.activeProfileId === st.profiles[0].profile_id);

console.log('\n[5] 修改出生信息后重算');
let st2 = S.updateProfile(st, st.profiles[0].profile_id, { birth_date: '1988-03-15', birth_time: '08:00', gender: '女' });
const c3 = S.deriveCharts(S.activeProfile(st2));
ok('基础盘随出生信息变化', c3.bazi.pillars.map(x => x.gan + x.zhi).join('') !== charts.bazi.pillars.map(x => x.gan + x.zhi).join(''));
ok('档案姓名保留', S.activeProfile(st2).name === '我');

console.log('\n[6] 旧数据迁移');
const legacy = {
  version: 2, user: { user_id: 'u1', nickname: '老用户' },
  profile: { profile_id: 'p_old', source: 'birth', birth_date: '1990-05-20', birth_time: '14:30', time_unknown: false, gender: '男' },
  events: [{ event_id: 'e_old', title: '旧事件', options: [], readings: [{ reading_id: 'r1', result: { summary: '旧解读' } }], outcome: null, status: 'open' }],
  persons: [], timelines: [], namings: [], timings: []
};
localStorage.setItem('ming-life-v1', JSON.stringify(legacy));
const loaded = S.load();
ok('旧单档案迁移成多档案', loaded.version === 3 && loaded.profiles.length === 1);
ok('迁移保留姓名与出生信息', loaded.profiles[0].name === '老用户' && loaded.profiles[0].birth_date === '1990-05-20');
ok('迁移保留事件与解读', loaded.profiles[0].events.length === 1 && loaded.profiles[0].events[0].readings.length === 1);
ok('迁移后可正常排盘', !!S.deriveCharts(loaded.profiles[0]).bazi);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
