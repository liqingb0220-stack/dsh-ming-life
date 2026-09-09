/**
 * 我的另一条时间线（PRD §13）。
 * 这是明确的娱乐模拟：状态是游戏系统变量，不声称有任何预测意义，
 * 也不会写回真实档案（存储上位于 state.timelines，与 events 完全分离）。
 */

export const SIM_STATS = [
  { key: 'city', label: '城市', type: 'text' },
  { key: 'job', label: '职业', type: 'text' },
  { key: 'income', label: '收入', type: 'num', unit: 'k/月', max: 200 },
  { key: 'assets', label: '资产', type: 'num', unit: '万', max: 2000 },
  { key: 'freedom', label: '自由度', type: 'bar', max: 100 },
  { key: 'network', label: '关系网络', type: 'bar', max: 100 },
  { key: 'life', label: '生活状态', type: 'bar', max: 100 },
  { key: 'skill', label: '技能', type: 'bar', max: 100 }
];

export const DEFAULT_STATE = {
  city: '上海', job: '产品经理', income: 25, assets: 40,
  freedom: 45, network: 50, life: 55, skill: 55
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, Math.round(v)));

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// 事件库。每个事件给 2–3 个选择，各自改变状态。
const EVENT_POOL = [
  {
    id: 'promo', when: s => s.skill >= 55, weight: 3,
    title: '公司要提拔你带一个新团队',
    desc: '管理岗，收入涨一截，但自己动手做事的时间会被会议吃掉。',
    options: [
      { label: '接下来', effects: { income: +8, freedom: -12, network: +10, skill: -3 }, note: '位置换来了资源，也换走了时间。' },
      { label: '婉拒，继续做专业线', effects: { skill: +8, freedom: +3, income: +1, network: -4 }, note: '专业深度保住了，晋升窗口关上了一次。' }
    ]
  },
  {
    id: 'offer', weight: 3,
    title: '另一个城市来了个 offer',
    desc: '薪水高一档，但要重新建立生活圈。',
    options: [
      { label: '去', effects: { income: +12, assets: -8, network: -20, life: -10, freedom: +5 }, city: 'move', note: '换了地方，一切从零开始。' },
      { label: '留下', effects: { life: +5, network: +5 }, note: '生活的连续性被保住了。' }
    ]
  },
  {
    id: 'side', weight: 3,
    title: '有个副业机会找上门',
    desc: '不确定能不能做起来，但确实占用晚上和周末。',
    options: [
      { label: '投入进去', effects: { skill: +10, income: +4, life: -12, freedom: -8 }, note: '多了一条线，也少了休息。' },
      { label: '先放着', effects: { life: +6 }, note: '生活节奏没被打乱。' }
    ]
  },
  {
    id: 'startup', when: s => s.assets >= 30 && s.skill >= 60, weight: 2,
    title: '朋友叫你一起创业',
    desc: '要投一笔积蓄，也要全职进去。',
    options: [
      { label: '加入', effects: { assets: -30, income: -10, freedom: +25, skill: +15, life: -10, network: +12 }, job: '创业者', note: '把稳定的收入换成了不确定的可能。' },
      { label: '只投钱不参与', effects: { assets: -15, network: +5 }, note: '风险小了，参与感也没了。' },
      { label: '不参与', effects: { life: +4 }, note: '维持原样。' }
    ]
  },
  {
    id: 'rest', when: s => s.life <= 45, weight: 4,
    title: '身体开始给你发信号',
    desc: '连续几个月睡不好，效率明显下滑。',
    options: [
      { label: '请长假调整', effects: { life: +22, income: -5, skill: -2 }, note: '把状态换回来了。' },
      { label: '硬扛过去', effects: { life: -12, income: +2, skill: +2 }, note: '短期扛住了，账记在后面。' }
    ]
  },
  {
    id: 'buy', when: s => s.assets >= 60, weight: 2,
    title: '要不要把积蓄换成一套房',
    desc: '首付掏空大半，月供会绑住未来几年的选择。',
    options: [
      { label: '买', effects: { assets: -50, freedom: -18, life: +8 }, note: '有了根，也有了绳。' },
      { label: '继续租', effects: { freedom: +8, assets: +5 }, note: '灵活，但一直在飘。' }
    ]
  },
  {
    id: 'study', weight: 2,
    title: '有个进修/读书的机会',
    desc: '要脱产一年，或者边工作边熬。',
    options: [
      { label: '脱产去读', effects: { skill: +18, income: -20, assets: -15, network: +10, freedom: +5 }, note: '停下来换了一次升级。' },
      { label: '边工作边读', effects: { skill: +9, life: -10 }, note: '两头都要，两头都紧。' },
      { label: '不去', effects: {}, note: '什么都没变。' }
    ]
  },
  {
    id: 'relation', weight: 3,
    title: '一段重要关系走到了要决定的时候',
    desc: '继续投入，还是各自往前走。',
    options: [
      { label: '认真投入', effects: { life: +12, freedom: -10, network: +8 }, note: '生活重心挪了一块过去。' },
      { label: '保持现状', effects: { life: -4, freedom: +2 }, note: '悬着的事还悬着。' },
      { label: '结束', effects: { life: -14, freedom: +12, network: -6 }, note: '轻了，也空了。' }
    ]
  },
  {
    id: 'layoff', when: s => s.income >= 30, weight: 2,
    title: '公司裁员，你在名单边缘',
    desc: '可以争取留下，也可以拿补偿走人。',
    options: [
      { label: '争取留下', effects: { income: -3, life: -8, network: +3 }, note: '保住了位置，气氛回不去了。' },
      { label: '拿补偿离开', effects: { assets: +12, income: -25, freedom: +15, life: -5 }, job: '待业', note: '空窗期开始了。' }
    ]
  },
  {
    id: 'invite', when: s => s.network >= 60, weight: 2,
    title: '有人邀请你做一件更公开的事',
    desc: '出面、署名、被更多人看见，也被更多人评价。',
    options: [
      { label: '接受', effects: { network: +18, skill: +5, freedom: -6, life: -5 }, note: '知名度上来了，暴露面也上来了。' },
      { label: '拒绝', effects: { life: +3 }, note: '继续待在舒服的位置。' }
    ]
  }
];

const CITIES_POOL = ['杭州', '深圳', '成都', '北京', '广州', '新加坡', '大理', '上海', '苏州', '厦门'];

/** 从真实事件分叉出一条模拟时间线 */
export function createBranch({ sourceEvent, notTakenOption, startYear, initial }) {
  return {
    branchPoint: {
      year: startYear,
      sourceEventId: sourceEvent?.event_id || null,
      sourceTitle: sourceEvent?.title || '一个假设的分叉点',
      actualChoice: sourceEvent?.outcome?.final_choice || null,
      simulatedChoice: notTakenOption || '另一条路'
    },
    state: { ...DEFAULT_STATE, ...(initial || {}) },
    history: [],
    year: startYear
  };
}

/** 按当前状态抽下一个事件 */
export function nextEvent(timeline, salt = 0) {
  const seed = hash(`${timeline.branchPoint.sourceTitle}|${timeline.year}|${timeline.history.length}|${salt}`);
  const r = rng(seed);
  const used = timeline.history.slice(-3).map(h => h.eventId);
  const pool = EVENT_POOL.filter(e => (!e.when || e.when(timeline.state)) && !used.includes(e.id));
  const bag = [];
  (pool.length ? pool : EVENT_POOL).forEach(e => { for (let i = 0; i < (e.weight || 1); i++) bag.push(e); });
  const picked = bag[Math.floor(r() * bag.length)];
  return {
    ...picked,
    options: picked.options.map((o, i) => ({ ...o, index: i }))
  };
}

/** 应用一个选择，推进一年 */
export function applyChoice(timeline, event, optionIndex) {
  const opt = event.options[optionIndex];
  const before = { ...timeline.state };
  const after = { ...timeline.state };

  Object.entries(opt.effects || {}).forEach(([k, v]) => {
    const meta = SIM_STATS.find(s => s.key === k);
    if (!meta) return;
    after[k] = meta.type === 'num'
      ? clamp(after[k] + v, 0, meta.max)
      : clamp(after[k] + v, 0, meta.max || 100);
  });

  if (opt.city === 'move') {
    const r = rng(hash(`${timeline.year}|${event.id}|${optionIndex}`));
    const pool = CITIES_POOL.filter(c => c !== after.city);
    after.city = pool[Math.floor(r() * pool.length)];
  }
  if (opt.job) after.job = opt.job;

  const changes = SIM_STATS
    .filter(s => s.type !== 'text' && after[s.key] !== before[s.key])
    .map(s => ({ key: s.key, label: s.label, from: before[s.key], to: after[s.key], delta: after[s.key] - before[s.key] }));
  if (before.city !== after.city) changes.push({ key: 'city', label: '城市', from: before.city, to: after.city, delta: null });
  if (before.job !== after.job) changes.push({ key: 'job', label: '职业', from: before.job, to: after.job, delta: null });

  return {
    ...timeline,
    year: timeline.year + 1,
    state: after,
    history: [...timeline.history, {
      year: timeline.year,
      eventId: event.id,
      eventTitle: event.title,
      choice: opt.label,
      note: opt.note,
      changes,
      stateAfter: after
    }]
  };
}

/** 回退到第 n 步（n 为 history 长度） */
export function rewind(timeline, step) {
  if (step < 0 || step >= timeline.history.length) return timeline;
  const history = timeline.history.slice(0, step);
  const state = step === 0
    ? { ...DEFAULT_STATE, ...(timeline.initialState || {}) }
    : { ...history[history.length - 1].stateAfter };
  return { ...timeline, history, state, year: timeline.branchPoint.year + history.length };
}

/** 一句话概括这条线现在的样子 */
export function describeTimeline(t) {
  const s = t.state;
  const high = SIM_STATS.filter(x => x.type === 'bar').map(x => ({ ...x, v: s[x.key] })).sort((a, b) => b.v - a.v);
  return `${t.year} 年，在${s.city}做${s.job}，月收入约 ${s.income}k，资产约 ${s.assets} 万。${high[0].label}是这条线上最突出的部分（${high[0].v}），${high[high.length - 1].label}最弱（${high[high.length - 1].v}）。`;
}
