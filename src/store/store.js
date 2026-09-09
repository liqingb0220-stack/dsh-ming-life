import { buildBazi, buildBaziFromPillars } from '../engines/bazi';
import { buildZiwei } from '../engines/ziwei';
import { correctedBirth } from '../engines/solar';

const KEY = 'ming-life-v1';

const uid = prefix => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const EMPTY = {
  version: 3,
  user: null,
  profiles: [],           // 可以建多个档案：自己、孩子、朋友…
  activeProfileId: null,
  settings: { theme: 'dark' }
};

/** 一个档案自带它全部的事件与记录，切换档案就是切换整个工作台。 */
export function blankProfile(patch = {}) {
  const now = new Date().toISOString();
  return {
    profile_id: uid('prof'),
    name: '',
    relation: 'self',
    source: 'birth',
    birth_date: null,
    birth_time: null,
    time_unknown: false,
    birth_place: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    gender: '男',
    manual_pillars: null,
    birth_lng: null,      // 手填经度（地名认不出时）
    revealSeen: false,
    calibration: {},
    interpretations: {},  // DSH 写回的解读：{ [key]: { status, request:{hash,at}, text, at } }
    events: [],
    persons: [],
    timelines: [],
    namings: [],
    timings: [],
    created_at: now,
    updated_at: now,
    ...patch
  };
}

export const RELATIONS = [
  { key: 'self', label: '我自己' },
  { key: 'child', label: '孩子' },
  { key: 'family', label: '家人' },
  { key: 'partner', label: '伴侣' },
  { key: 'friend', label: '朋友' },
  { key: 'other', label: '其他' }
];

export const activeProfile = state =>
  (state.profiles || []).find(p => p.profile_id === state.activeProfileId) || (state.profiles || [])[0] || null;

/** 旧版本（单档案）数据迁移到多档案结构 */
function migrate(data) {
  if (!data || data.version >= 3) return data;
  const now = new Date().toISOString();
  const old = data.profile;
  if (!old) return { ...EMPTY, user: data.user || null };
  const prof = blankProfile({
    ...old,
    name: data.user?.nickname || '我',
    relation: 'self',
    events: data.events || [],
    persons: data.persons || [],
    timelines: data.timelines || [],
    namings: data.namings || [],
    timings: data.timings || [],
    updated_at: now
  });
  return {
    version: 3,
    user: data.user || null,
    profiles: [prof],
    activeProfileId: prof.profile_id,
    settings: { theme: 'dark' }
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const data = migrate(JSON.parse(raw));
    return { ...EMPTY, ...data, settings: { ...EMPTY.settings, ...(data.settings || {}) } };
  } catch {
    return { ...EMPTY };
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 存储不可用时静默降级 */ }
  return state;
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
  return { ...EMPTY };
}

/** 新建档案。四柱路径也会带上反推出的公历日期，因此两条路径的档案是等价的。 */
export function createProfile(state, patch) {
  const prof = blankProfile(patch);
  const now = new Date().toISOString();
  return {
    state: {
      ...state,
      user: state.user || { user_id: uid('user'), created_at: now },
      profiles: [...(state.profiles || []), prof],
      activeProfileId: prof.profile_id
    },
    profile: prof
  };
}

export function updateProfile(state, profileId, patch) {
  return {
    ...state,
    profiles: state.profiles.map(p =>
      p.profile_id === profileId ? { ...p, ...patch, updated_at: new Date().toISOString() } : p)
  };
}

export function removeProfile(state, profileId) {
  const rest = state.profiles.filter(p => p.profile_id !== profileId);
  return {
    ...state,
    profiles: rest,
    activeProfileId: state.activeProfileId === profileId ? (rest[0]?.profile_id || null) : state.activeProfileId
  };
}

export function switchProfile(state, profileId) {
  return { ...state, activeProfileId: profileId };
}

export function setTheme(state, theme) {
  return { ...state, settings: { ...state.settings, theme } };
}

/** 对当前档案内的某个集合做增删改 */
function patchActive(state, fn) {
  const id = state.activeProfileId;
  return {
    ...state,
    profiles: state.profiles.map(p => (p.profile_id === id ? { ...fn(p), updated_at: new Date().toISOString() } : p))
  };
}

/** 由档案派生命盘。两条录入路径都有公历日期，所以八字与紫微都能排。 */
export function deriveCharts(profile) {
  if (!profile || !profile.birth_date) return { bazi: null, ziwei: null, corr: null };
  // 出生地能定位经度时，按真太阳时排盘
  const corr = correctedBirth(profile);
  const args = {
    date: corr.date || profile.birth_date,
    time: corr.time || profile.birth_time,
    gender: profile.gender,
    timeUnknown: profile.time_unknown
  };
  return { bazi: buildBazi(args), ziwei: buildZiwei(args), corr };
}

// ---------- DSH 解读（写回协议） ----------
export function requestInterpretation(state, profileId, key, hash, meta = {}) {
  const p = state.profiles.find(x => x.profile_id === profileId);
  const old = p?.interpretations?.[key] || {};
  return updateProfile(state, profileId, {
    interpretations: { ...(p?.interpretations || {}), [key]: { ...old, ...meta, status: 'pending', request: { hash, at: new Date().toISOString() } } }
  });
}
export function setInterpretation(state, profileId, key, patch) {
  const p = state.profiles.find(x => x.profile_id === profileId);
  return updateProfile(state, profileId, { interpretations: { ...(p?.interpretations || {}), [key]: { ...(p?.interpretations?.[key] || {}), ...patch } } });
}

/** 「我有事想问」：一个问题就是一件事。卦在建立时起好，事实固定下来。 */
export function createQuestion(state, { question, cast }) {
  const now = new Date().toISOString();
  const q = String(question || '').trim();
  const event = {
    event_id: uid('evt'),
    title: q.length > 40 ? `${q.slice(0, 39)}…` : q,
    question: q, description: q,
    event_type: 'question', status: 'open',
    options: [], readings: [], outcome: null,
    cast: cast || null,
    created_at: now, updated_at: now
  };
  return { state: patchActive(state, p => ({ ...p, events: [event, ...p.events] })), event };
}
export function removeEvent(state, eventId) {
  return patchActive(state, p => ({ ...p, events: p.events.filter(e => e.event_id !== eventId) }));
}

// ---------- 事件 ----------
export const EVENT_TYPES = [
  { key: 'decision', label: '选择', desc: '在两个以上的选项之间做决定', page: 'choose', ready: true },
  { key: 'timing', label: '时间', desc: '哪一天做这件事更合适', page: 'when', ready: true },
  { key: 'location', label: '地点', desc: '去哪里、住哪里', page: 'where', ready: true },
  { key: 'relationship', label: '关系', desc: '我和某个人的互动', page: 'who-with', ready: true }
];

export const EVENT_STATUS = {
  open: { label: '进行中', color: 'var(--azure)' },
  chosen: { label: '已选择', color: 'var(--jade)' },
  waiting: { label: '等待结果', color: 'var(--gold)' },
  reviewed: { label: '已回看', color: 'var(--violet)' },
  archived: { label: '已归档', color: 'var(--t3)' }
};

export function createEvent(state, { title, description, event_type }) {
  const now = new Date().toISOString();
  const event = {
    event_id: uid('evt'),
    title, description: description || '',
    event_type: event_type || 'decision',
    status: 'open',
    options: [], readings: [], outcome: null,
    created_at: now, updated_at: now
  };
  return { state: patchActive(state, p => ({ ...p, events: [event, ...p.events] })), event };
}

const mapEvent = (p, eventId, fn) => ({
  ...p,
  events: p.events.map(e => (e.event_id === eventId ? { ...fn(e), updated_at: new Date().toISOString() } : e))
});

export function updateEvent(state, eventId, patch) {
  return patchActive(state, p => mapEvent(p, eventId, e => ({ ...e, ...patch })));
}

export function addOption(state, eventId, { name, description }) {
  const option = { option_id: uid('opt'), name, description: description || '', user_notes: '' };
  return patchActive(state, p => mapEvent(p, eventId, e => ({ ...e, options: [...e.options, option] })));
}

export function removeOption(state, eventId, optionId) {
  return patchActive(state, p => mapEvent(p, eventId, e => ({ ...e, options: e.options.filter(o => o.option_id !== optionId) })));
}

/** 保存一次解读。原始解读永不覆盖。 */
export function addReading(state, eventId, { system, input, result, evidence }) {
  const reading = {
    reading_id: uid('rd'), system,
    input: input || null, result: result || null, evidence: evidence || null,
    created_at: new Date().toISOString()
  };
  return patchActive(state, p => mapEvent(p, eventId, e => ({ ...e, readings: [...e.readings, reading] })));
}

export function setOutcome(state, eventId, { final_choice, actual_result, reflection }) {
  const now = new Date().toISOString();
  return patchActive(state, p => mapEvent(p, eventId, e => ({
    ...e,
    outcome: {
      outcome_id: e.outcome?.outcome_id || uid('out'),
      final_choice, actual_result, reflection,
      created_at: e.outcome?.created_at || now, updated_at: now
    },
    status: actual_result ? 'reviewed' : final_choice ? 'waiting' : e.status
  })));
}

// ---------- 谁与我同行 ----------
export function addPerson(state, { nickname, kind, birthDate, birthTime, timeUnknown, gender, birthPlace, birthLng }) {
  const person = {
    person_id: uid('per'),
    nickname, kind: kind || 'friend',
    birth_date: birthDate,
    birth_time: timeUnknown ? null : birthTime,
    time_unknown: !!timeUnknown,
    birth_place: birthPlace || '',
    birth_lng: Number.isFinite(Number(birthLng)) && Number(birthLng) !== 0 ? Number(birthLng) : null,
    gender: gender || '男',
    created_at: new Date().toISOString()
  };
  return { state: patchActive(state, p => ({ ...p, persons: [person, ...p.persons] })), person };
}
export function removePerson(state, id) {
  return patchActive(state, p => ({ ...p, persons: p.persons.filter(x => x.person_id !== id) }));
}
export function personCharts(person) {
  const corr = correctedBirth({ ...person, source: 'birth' });
  const args = { date: corr.date || person.birth_date, time: corr.time || person.birth_time, gender: person.gender, timeUnknown: person.time_unknown };
  return { bazi: buildBazi(args), ziwei: buildZiwei(args) };
}

// ---------- 另一条时间线 ----------
export function saveTimeline(state, timeline) {
  return patchActive(state, p => {
    const exists = p.timelines.some(t => t.timeline_id === timeline.timeline_id);
    return {
      ...p,
      timelines: exists
        ? p.timelines.map(t => (t.timeline_id === timeline.timeline_id ? { ...timeline, updated_at: new Date().toISOString() } : t))
        : [{ ...timeline, created_at: new Date().toISOString() }, ...p.timelines]
    };
  });
}
export function newTimelineId() { return uid('tl'); }
/** 另一条时间线：只固定一个前提「如果当年我……」 */
export function addTimeline(state, { premise, from_year }) {
  const t = { timeline_id: uid('tl'), premise: String(premise || '').trim(), from_year: Number(from_year) || new Date().getFullYear(), created_at: new Date().toISOString() };
  return { state: patchActive(state, p => ({ ...p, timelines: [t, ...p.timelines] })), timeline: t };
}
export function removeTimeline(state, id) {
  return patchActive(state, p => ({ ...p, timelines: p.timelines.filter(t => t.timeline_id !== id) }));
}

// ---------- 起名 / 择日 ----------
export function saveNaming(state, project) {
  return patchActive(state, p => {
    const exists = p.namings.some(n => n.naming_id === project.naming_id);
    return { ...p, namings: exists ? p.namings.map(n => (n.naming_id === project.naming_id ? project : n)) : [project, ...p.namings] };
  });
}
export function newNamingId() { return uid('nm'); }
/** 起名的一次运行：只存输入（姓氏／用途／参考／字数），候选按同样输入重新生成，DSH 的推荐按 key 写在 interpretations 里 */
export function addNaming(state, { surname, scene, brief, length }) {
  const run = { naming_id: uid('nm'), surname, scene, brief: brief || '', length: Number(length) || 2, created_at: new Date().toISOString() };
  return { state: patchActive(state, p => ({ ...p, namings: [run, ...p.namings.filter(n => !(n.surname === surname && n.scene === scene && (n.brief || '') === (brief || '') && n.length === run.length))] })), run };
}
export function removeNaming(state, id) {
  return patchActive(state, p => ({ ...p, namings: p.namings.filter(n => n.naming_id !== id) }));
}
export function saveTiming(state, plan) {
  return patchActive(state, p => {
    const exists = p.timings.some(t => t.timing_id === plan.timing_id);
    return { ...p, timings: exists ? p.timings.map(t => (t.timing_id === plan.timing_id ? plan : t)) : [plan, ...p.timings] };
  });
}
export function newTimingId() { return uid('tm'); }

/** 导出为 §22 的目录结构，每个档案一个子目录 */
export function exportTree(state) {
  const tree = {};
  (state.profiles || []).forEach(p => {
    const base = `/ming-life/profiles/${p.profile_id}`;
    const { bazi, ziwei } = deriveCharts(p);
    tree[`${base}/birth.json`] = {
      profile_id: p.profile_id, name: p.name, relation: p.relation, source: p.source,
      birth_date: p.birth_date, birth_time: p.birth_time, time_unknown: p.time_unknown,
      birth_place: p.birth_place, timezone: p.timezone, gender: p.gender, manual_pillars: p.manual_pillars
    };
    tree[`${base}/bazi.json`] = bazi;
    tree[`${base}/ziwei.json`] = ziwei ? { ...ziwei, _astro: undefined } : null;
    p.events.forEach(e => {
      tree[`${base}/events/${e.event_id}/event.json`] = { ...e, readings: undefined, outcome: undefined };
      e.readings.forEach(r => { tree[`${base}/events/${e.event_id}/readings/${r.reading_id}.json`] = r; });
      if (e.outcome) tree[`${base}/events/${e.event_id}/outcome.json`] = e.outcome;
    });
    p.persons.forEach(x => { tree[`${base}/persons/${x.person_id}.json`] = x; });
    p.timelines.forEach(x => { tree[`${base}/timelines/${x.timeline_id}.json`] = x; });
    p.namings.forEach(x => { tree[`${base}/naming/${x.naming_id}.json`] = x; });
    p.timings.forEach(x => { tree[`${base}/timings/${x.timing_id}.json`] = x; });
  });
  return tree;
}

/** 结论卡认领 */
export function setCalibration(state, profileId, key, value) {
  return updateProfile(state, profileId, {
    calibration: { ...(state.profiles.find(p => p.profile_id === profileId)?.calibration || {}), [key]: value }
  });
}
export function markRevealSeen(state, profileId) {
  return updateProfile(state, profileId, { revealSeen: true });
}

// ---------- DSH 宿主模式：一个项目文件夹 = 一份档案 ----------
/** 把宿主给的单份档案铺成界面用的整棵 state */
export function stateFromHosted(profile) {
  const p = blankProfile({ ...profile, profile_id: profile.profile_id || uid('prof') });
  return {
    version: 3,
    user: { user_id: 'dsh', created_at: p.created_at },
    profiles: [p],
    activeProfileId: p.profile_id,
    settings: { theme: profile.settings?.theme || 'light' }
  };
}
/** 反过来：把当前档案（连同主题设置）交还给宿主保存 */
export function hostedFromState(state) {
  const p = activeProfile(state);
  return p ? { ...p, settings: { theme: state.settings?.theme || 'light' } } : null;
}
