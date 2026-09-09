// P1 回归
import { buildBazi } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { almanacOf, scoreDay, buildCandidates, explainDay } from '../src/engines/almanac.js';
import { compareLocations, bearing, directionOf } from '../src/engines/location.js';
import { compareCharts } from '../src/engines/relation.js';
import { createBranch, nextEvent, applyChoice, rewind, SIM_STATS, DEFAULT_STATE } from '../src/engines/simulation.js';
import { analyzeName, generateNames, continueFrom } from '../src/engines/naming.js';
import { baziPro, ziweiPro } from '../src/engines/pro.js';
import { buildLifeMap } from '../src/engines/lifemap.js';
import { NAME_CHARS } from '../src/data/nameChars.js';
import { CITIES } from '../src/data/cities.js';
import { ACTIVITIES } from '../src/data/activities.js';
import * as S from '../src/store/store.js';
if (typeof localStorage === 'undefined') {
  const mem = {};
  globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
}

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.log('  ✗', n, x)); };
const args = { date: '1990-05-20', time: '14:30', gender: '男' };
const b = buildBazi(args), z = buildZiwei(args);

console.log('\n[P1-1] 黄历择日');
const alm = almanacOf(new Date(2026, 8, 15));
// lunar-javascript 的 getTimes() 返回 13 条：早子时与晚子时分列
ok('黄历条目齐全', alm.yi.length && alm.tianShen && alm.zhiXing && alm.xiu && alm.pengZu.length === 2 && alm.times.length === 13);
ACTIVITIES.forEach(a => {
  const s = scoreDay(alm, a.key, b);
  if (!s.level || !s.activity) { fail++; console.log('  ✗ 事件类型', a.label); }
});
ok('全部 10 类事件都能打分', true);
const cands = buildCandidates({ from: new Date(2026, 8, 1), to: new Date(2026, 9, 31), activityKey: 'wedding', bazi: b });
ok('候选覆盖整个范围', cands.length === 61);
ok('存在分档差异（不是全部同级）', new Set(cands.map(d => d.level.key)).size >= 3, [...new Set(cands.map(d=>d.level.label))].join());
ok('相忌日被单独标出', cands.some(d => d.jiHits.length) && cands.filter(d => d.jiHits.length).every(d => d.level.key === 'avoid'));
// 只禁止真的下断言；产品自己的免责声明里出现「不评最吉」是允许的
const claimTxt = JSON.stringify(cands.slice(0, 5).map(d => explainDay(d, b)));
// 允许出现在「这里不评最吉之日」这类声明里，只禁止真的断言某天最吉
ok('不下「最吉/诸事皆宜」类断言',
   !/(这一天|此日|今天)(是|为|乃)[^。]{0,6}最吉|大吉大利|诸事皆宜|万事亨通/.test(claimTxt));
ok('每天都有可核对的加减项', cands.every(d => d.plus.length + d.minus.length > 0));
// 页面会对这些字段直接 join/map，形状必须是数组（getDayXunKong 原本返回字符串）
const arrayFields = ['yi', 'ji', 'jiShen', 'xiongSha', 'pengZu', 'xunKong', 'times', 'festivals'];
ok('黄历数组字段形状正确', arrayFields.every(k => Array.isArray(alm[k])), arrayFields.filter(k => !Array.isArray(alm[k])).join());
ok('数组字段可安全 join', arrayFields.every(k => typeof alm[k].join === 'function'));

console.log('\n[P1-2] 地点选择');
const c = n => CITIES.find(x => x.name === n);
ok('方位：上海→北京 西北', directionOf(bearing(c('上海'), c('北京'))).name === '西北');
ok('方位：北京→新加坡 正南', directionOf(bearing(c('北京'), c('新加坡'))).name === '正南');
ok('方位：上海→东京 正东', directionOf(bearing(c('上海'), c('东京'))).name === '正东');
const loc = compareLocations({
  origin: c('上海'),
  places: [{ id: 'a', ...c('深圳'), factors: { cost: 2, opportunity: 5, relation: 2, climate: 4, familiar: 2 } },
           { id: 'b', ...c('北京'), factors: { cost: 3, opportunity: 5, relation: 4, climate: 2, familiar: 3 } }],
  bazi: b, ziwei: z, gender: '男'
});
ok('每个地点三层证据齐全', loc.views.every(v => v.insight.systems.length === 3 && v.insight.systems.every(s => s.evidence.length)));
ok('现实因素优先的立场写进输出', /现实因素优先|权重应当高于/.test(JSON.stringify(loc)));
ok('每个地点有独立卦象', new Set(loc.views.map(v => v.gua.ben.no)).size === 2);

console.log('\n[P1-3] 谁与我同行');
const them = { bazi: buildBazi({ date: '1992-11-03', time: '09:20', gender: '女' }), ziwei: buildZiwei({ date: '1992-11-03', time: '09:20', gender: '女' }), name: '小林' };
const rel = compareCharts({ bazi: b, ziwei: z, name: '我' }, them);
ok('四个互动面都有依据', rel.aspects.length === 4 && rel.aspects.every(a => a.insight.systems.every(s => s.evidence.length)));
ok('阈值按维度分别标定', rel.aspects.every(a => a.threshold > 0) && new Set(rel.aspects.map(a => a.threshold)).size > 1);
ok('未输出契合度数字', !/(契合度|适合度|匹配度)\s*[:：]?\s*\d/.test(JSON.stringify(rel)));
ok('日主生克方向自洽', ['我生','生我','比和','我克','克我'].includes(rel.ganRel.label) && rel.ganRelInfo.text.length > 0);
// 反向合盘：A对B说「对方生我」，则B对A应说「你生对方」
const revd = compareCharts({ bazi: them.bazi, ziwei: them.ziwei, name: '小林' }, { bazi: b, ziwei: z, name: '我' });
const fwd = rel.ganRelInfo.text, rev = revd.ganRelInfo.text;
ok('合盘方向对称一致', (fwd.includes('对方的日主生你') && rev.includes('你的日主生对方')) || (fwd.includes('你的日主生对方') && rev.includes('对方的日主生你')) || fwd.includes('同属一行'), `${fwd} / ${rev}`);

console.log('\n[P1-4] 另一条时间线');
let t = createBranch({ sourceEvent: { event_id: 'e1', title: '测试', outcome: { final_choice: 'A' } }, notTakenOption: 'B', startYear: 2026 });
for (let i = 0; i < 15; i++) { const e = nextEvent(t); t = applyChoice(t, e, i % e.options.length); }
ok('推演 15 年状态始终合法', SIM_STATS.filter(s => s.type !== 'text').every(s => t.state[s.key] >= 0 && t.state[s.key] <= (s.max || 100)));
ok('历史完整记录', t.history.length === 15 && t.history.every(h => h.eventTitle && h.choice));
ok('回退可用', rewind(t, 5).history.length === 5 && rewind(t, 0).state.income === DEFAULT_STATE.income);
// 隔离性在 [P1-7] 里连同多档案一起验证

console.log('\n[P1-5] 起名');
const n1 = analyzeName({ surname: '林', chars: ['清', '澜'], bazi: b });
ok('四层分析齐全', n1.insight.systems.length === 4 && n1.insight.systems.every(s => s.evidence.length));
ok('音律拗口能检出', analyzeName({ surname: '王', chars: ['雨', '宇'], bazi: null }).sound.issues.length >= 2);
const gen = generateNames({ surname: '林', vibes: ['清朗'], bazi: b, limit: 12 });
ok('生成结果优先命中喜用', gen.length === 12 && gen.every(g => g.wuxing.hits.length > 0));
ok('首字不被单一字刷屏', Math.max(...Object.values(gen.reduce((a, g) => { a[g.chars[0].c] = (a[g.chars[0].c] || 0) + 1; return a; }, {}))) <= 2);
const cont = continueFrom({ name: gen[0], keepIndex: 0, surname: '林', bazi: b, limit: 8 });
ok('沿方向继续：锁字生效且不重复原名', cont.every(x => x.chars[0].c === gen[0].chars[0].c) && !cont.some(x => x.full === gen[0].full));
ok('排除字生效', !generateNames({ surname: '陈', bazi: b, dislikes: ['清', '澜'], limit: 20 }).some(x => x.chars.some(ch => ['清', '澜'].includes(ch.c))));
ok('无命盘可用（命理层缺省）', generateNames({ surname: '苏', bazi: null, limit: 3 })[0].insight.systems.length === 3);
ok('字库无重复且拼音可解析', new Set(NAME_CHARS.map(x => x.c)).size === NAME_CHARS.length && NAME_CHARS.every(x => x.tone >= 1 && x.tone <= 4 && x.final));
ok('不做五格剖象（明确声明简体笔画）', /简体笔画/.test(JSON.stringify(n1.insight)));
// 姓氏表：音律分析必须带上姓，否则「沈诗思」这类问题检不出来
import('../src/data/nameChars.js').then(() => {});
const shen = analyzeName({ surname: '沈', chars: ['诗', '思'], bazi: null });
ok('姓氏参与音律分析', shen.surnameKnown && shen.sound.pinyin.startsWith('shen3'));
ok('姓氏参与后能检出声母重复', shen.sound.issues.some(i => i.key === 'initial'));
ok('拼音串无残留调号占位', !/(^|\s)\d(\s|$)/.test(shen.sound.pinyin));
ok('未知姓氏被明确标注而非编造', analyzeName({ surname: '欧阳', chars: ['清', '澜'], bazi: null }).surnameKnown === false);

console.log('\n[P1-6] 专业盘与人生地图');
const pro = baziPro(b);
ok('藏干十神全展开', pro.pillars.every(p => p.hideDetail.length && p.hideDetail.every(h => h.shiShen)));
ok('地支关系与空亡可算', pro.relations.length > 0 && pro.xunKong.kong.length === 2);
ok('十二长生四柱齐全', pro.dayMasterCS.length === 4 && pro.dayMasterCS.every(x => x.name));
const zp = ziweiPro(z, '命宫');
ok('三方四正为四宫且不重复', zp.trine.length === 4 && new Set(zp.trine.map(t2 => t2.palace.name)).size === 4);
ok('三方四正含对宫迁移', zp.trine.some(t2 => t2.role.includes('对宫')));
z.palaces.forEach(p => { const r = ziweiPro(z, p.name); if (!r || r.trine.length !== 4) { fail++; console.log('  ✗ 宫位', p.name); } });
ok('十二宫都能取三方四正', true);
const lm = buildLifeMap(b, z, '男');
ok('地图图元全在画布内', lm.bands.every(bd => bd.points.every(p => p.x0 >= lm.pad - 1 && p.x1 <= lm.width - lm.pad + 1 && p.h >= 2)));
ok('六条维度带 + 峰值', lm.bands.length === 6 && lm.peaks.length >= 1);

console.log('\n[P1-7] 存储扩展（多档案）');
let st = S.createProfile({ ...S.EMPTY }, { name: '我', birth_date: '1990-05-20', birth_time: '14:30', gender: '男' }).state;
const ap = S.addPerson(st, { nickname: '小林', kind: 'partner', birthDate: '1992-11-03', birthTime: '09:20', gender: '女' });
st = ap.state;
ok('人物可增可查', S.activeProfile(st).persons.length === 1 && !!S.personCharts(S.activeProfile(st).persons[0]).bazi);
st = S.saveTimeline(st, { ...t, timeline_id: 'tl1' });
st = S.saveNaming(st, { naming_id: 'nm1', surname: '林', starred: ['林清澜'] });
st = S.saveTiming(st, { timing_id: 'tm1', activity: 'move', starred: ['2026-09-15'] });
const tree = S.exportTree(st);
ok('导出目录含全部 P1 分区', ['persons/', 'timelines/', 'naming/', 'timings/'].every(k => Object.keys(tree).some(p => p.includes(k))));
ok('模拟与真实事件物理隔离', S.activeProfile(st).timelines.length === 1 && S.activeProfile(st).events.length === 0);
st = S.removePerson(st, ap.person.person_id);
ok('人物可删', S.activeProfile(st).persons.length === 0);
ok('删除人物不影响其他数据', S.activeProfile(st).timelines.length === 1 && S.activeProfile(st).namings.length === 1);

console.log('\n[P1-8] 文案可读性');
const { buildPortrait } = await import('../src/engines/portrait.js');
const port = buildPortrait(b, z);
const allText = [...port.themes, ...port.dimensions.map(d => d.insight)]
  .flatMap(i => [i.summary, i.note, ...i.systems.flatMap(sy => [sy.interpretation, ...sy.evidence.map(e => e.detail)])])
  .filter(Boolean).join(' ');
ok('不再出现冗长的固定前缀', !allText.includes('在当前命理体系中，这一结构通常被解释为'));
ok('不出现断言性措辞', !/必然|一定会|注定|肯定会/.test(allText));
const { findTerms, GLOSSARY } = await import('../src/data/glossary.js');
const usedTerms = findTerms(allText);
ok('画像文案里的术语都能查到白话解释', usedTerms.length >= 8 && usedTerms.every(x => GLOSSARY[x]), usedTerms.join());
// 摘要句里不应出现裸露的内部权重数字
const summaries = [...port.themes, ...port.dimensions.map(d => d.insight)].map(i => i.summary).join(' ');
ok('摘要里没有裸露的内部权重', !/\d+\.\d+/.test(summaries), summaries.match(/\d+\.\d+/g)?.join());

// 解读要有可认领的具体场景，而不只是抽象标签
const themeScenes = port.themes.flatMap(t => t.scenes);
ok('每条主题都配了具体场景', port.themes.every(t => t.scenes.length >= 2), port.themes.map(t => t.scenes.length).join());
ok('场景在主题之间不重复', new Set(themeScenes).size === themeScenes.length);
ok('主题带「为什么」「代价」或「建议」', port.themes.filter(t => t.because || t.cost || t.gift || t.advice).length >= 4);
ok('至少一条给出可操作的建议', port.themes.some(t => t.advice));
// 缺失也要讲——很多人真正想不通的是「为什么我在某种环境里不舒服」
const allTxt = port.themes.map(t => [t.summary, t.because, t.cost, t.advice].filter(Boolean).join(' ')).join(' ');
const { analyzeDistribution } = await import('../src/engines/distribution.js');
const dist = analyzeDistribution(b);
if (dist.absent.length) ok('命里缺失的十神被明确讲出来', dist.absent.some(x => allTxt.includes(x.god + '缺失') || allTxt.includes('没有' + x.god)), dist.absent.map(x=>x.god).join());
// 同一个结构在顺境逆境的两种表现
ok('给出顺境与逆境两种表现', port.themes.some(t => t.scenes.some(x => x.startsWith('顺的时候')) && t.scenes.some(x => x.startsWith('不顺的时候'))));
// 语气：不能全是短促的断言句，也不能出现叠字病
ok('文字无叠词病', !/里里|。。|，，/.test(allTxt + themeScenes.join()));
// 对象或 undefined 被拼进文案，构建期不会报错，只有肉眼才发现——用断言兜住
const everyText = [
  ...port.themes, ...port.dimensions.map(d => d.insight)
].flatMap(i => [i.summary, i.because, i.cost, i.gift, i.advice, i.note, ...i.scenes,
  ...i.systems.flatMap(sy => [sy.interpretation, ...sy.evidence.flatMap(e => [String(e.value), String(e.detail)])])
]).filter(Boolean).join(' ');
ok('文案里没有 [object Object]', !everyText.includes('[object Object]'), everyText.match(/.{25}\[object Object\]/)?.[0]);
ok('文案里没有 undefined / NaN', !/undefined|NaN/.test(everyText), everyText.match(/.{25}(undefined|NaN)/)?.[0]);
ok('用了软化措辞而非断言', /往往|通常|多半|一般来说|很多时候|容易|可能/.test(allTxt));
// 不同命盘读起来不能像同一份模板
const other = buildPortrait(buildBazi({ date: '1978-11-02', time: '07:20', gender: '女' }), buildZiwei({ date: '1978-11-02', time: '07:20', gender: '女' }));
const s1 = new Set(themeScenes), s2 = new Set(other.themes.flatMap(t => t.scenes));
const shared = [...s1].filter(x => s2.has(x)).length;
ok('两张不同命盘的场景重合度低', shared / new Set([...s1, ...s2]).size < 0.3, `重合 ${shared}`);
ok('场景是第二人称的具体描述', themeScenes.every(x => x.includes('你')));

console.log('\n[P1-10] 年龄语境');
const { explainYear: ey2 } = await import('../src/engines/timeline.js');
const young = ey2(b, z, '男', b.solar.y + 18);
const mid = ey2(b, z, '男', b.solar.y + 35);
const old2 = ey2(b, z, '男', b.solar.y + 60);
ok('少年期讲校园语境', /校园|同学|学业/.test(young.insight.summary + young.insight.systems[0].interpretation));
ok('中年期讲职场家庭语境', /职场|家庭|责任/.test(mid.insight.summary + mid.insight.systems[0].interpretation));
ok('晚年期换成另一套语境', /老友|后辈|安顿|圈子/.test(old2.insight.summary + old2.insight.systems[0].interpretation));
ok('三个阶段的语境互不相同',
   new Set([young, mid, old2].map(x => x.insight.summary.match(/正在(.{2,4})。/)?.[1])).size === 3);

console.log('\n[P1-9] 四柱路径与出生日期路径等价');
const { solarFromPillars } = await import('../src/engines/reverse.js');
const bp = { year: '庚午', month: '辛巳', day: '乙酉', hour: '癸未' };
const revRes = solarFromPillars(bp);
const pick = revRes.candidates.find(c => c.date === '1990-05-20');
const stA = S.createProfile({ ...S.EMPTY }, { name: 'A', source: 'birth', birth_date: '1990-05-20', birth_time: '14:30', gender: '男' }).state;
const stB = S.createProfile({ ...S.EMPTY }, { name: 'B', source: 'pillars', birth_date: pick.date, birth_time: pick.time, gender: '男', manual_pillars: bp }).state;
const cA = S.deriveCharts(S.activeProfile(stA)), cB = S.deriveCharts(S.activeProfile(stB));
ok('四柱路径也能排出紫微盘', !!cB.ziwei && cB.ziwei.palaces.length === 12);
ok('两条路径的八字一致', cA.bazi.pillars.map(x=>x.gan+x.zhi).join() === cB.bazi.pillars.map(x=>x.gan+x.zhi).join());
ok('两条路径的紫微命宫一致', cA.ziwei.soulPalace.branch === cB.ziwei.soulPalace.branch);
ok('四柱路径不再标记时辰不确定', S.activeProfile(stB).time_unknown === false);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
