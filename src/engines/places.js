/**
 * 地点：工作台算死的部分。
 * 以出生地（或指定参照点）为原点，八个方位各自的卦、五行、是否喜用，以及命主的桃花位、驿马位；
 * 每个方位下列出内置城市表里落在该方向的城市。哪儿是「定情之地」「转折之地」，交给 DSH 说。
 */
import { CITIES } from '../data/cities';
import { PLACES } from '../data/geo';
import { TRIGRAMS, relation } from '../data/trigrams';
import { DIRECTIONS, bearing, distanceKm, directionOf } from './location';
import { resolvePlace } from './solar';

const SANHE = [
  { zhis: ['申', '子', '辰'], taohua: '酉', yima: '寅' },
  { zhis: ['寅', '午', '戌'], taohua: '卯', yima: '申' },
  { zhis: ['巳', '酉', '丑'], taohua: '午', yima: '亥' },
  { zhis: ['亥', '卯', '未'], taohua: '子', yima: '巳' }
];
export const ZHI_DIRECTION = { 子: '正北', 丑: '东北', 寅: '东北', 卯: '正东', 辰: '东南', 巳: '东南', 午: '正南', 未: '西南', 申: '西南', 酉: '正西', 戌: '西北', 亥: '西北' };

export function originFor(profile) {
  const r = resolvePlace(profile?.birth_place);
  if (r && Number.isFinite(r.lat)) return { name: r.name.replace(/（.*$/, ''), lat: r.lat, lng: r.lng, source: 'birth' };
  return { name: '北京', lat: 39.9, lng: 116.4, source: 'default' };
}

/** 城市表：内置候选 + 地理表里的中国城市（去重） */
export function knownCities() {
  const seen = new Set();
  const out = [];
  [...CITIES, ...PLACES.map(p => ({ name: p.n.replace(/市$/, ''), lat: p.lat, lng: p.lng, country: p.tz === 8 && !['新加坡', '吉隆坡', '槟城', '巴厘岛', '马尼拉'].includes(p.n) ? '中国' : '海外' }))].forEach(c => {
    if (!c.lat || seen.has(c.name)) return; seen.add(c.name); out.push(c);
  });
  return out;
}

/** scope: 'cn' 只看国内（含港澳台）；'intl' 只看海外 */
export function placeFacts(bazi, ziwei, profile, scope = 'cn') {
  const origin = originFor(profile);
  const favor = bazi.strength.favor;
  const cities = knownCities().filter(c => c.name !== origin.name && (scope === 'intl' ? c.country !== '中国' : c.country === '中国'));
  const byDir = {};
  DIRECTIONS.forEach(d => { byDir[d.key] = []; });
  cities.forEach(c => {
    const b = bearing(origin, c);
    const d = directionOf(b);
    byDir[d.key].push({ name: c.name, distance: distanceKm(origin, c), bearing: Math.round(b), country: c.country });
  });
  const directions = DIRECTIONS.map(d => {
    const tri = TRIGRAMS[d.trigram];
    const list = byDir[d.key].sort((a, b) => a.distance - b.distance);
    return {
      key: d.key, name: d.name, trigram: tri.name, wuxing: tri.wuxing, trait: tri.trait,
      isFavor: favor.includes(tri.wuxing),
      relation: relation(tri.wuxing, bazi.dayMaster.wuxing).label,
      near: list.filter(c => c.distance <= (scope === 'intl' ? 4000 : 1500)).slice(0, 5).map(c => c.name),
      far: list.filter(c => c.distance > (scope === 'intl' ? 4000 : 1500)).slice(0, 5).map(c => c.name)
    };
  });
  const yearZhi = bazi.pillars[0].zhi, dayZhi = bazi.pillars[2].zhi;
  const grp = z => SANHE.find(g => g.zhis.includes(z));
  const taohua = [...new Set([grp(yearZhi)?.taohua, grp(dayZhi)?.taohua].filter(Boolean))];
  const yima = [...new Set([grp(yearZhi)?.yima, grp(dayZhi)?.yima].filter(Boolean))];
  const move = ziwei?.palaces.find(p => p.name === '迁移');
  return {
    origin, favor, scope,
    directions,
    taohua: taohua.map(z => ({ zhi: z, direction: ZHI_DIRECTION[z] })),
    yima: yima.map(z => ({ zhi: z, direction: ZHI_DIRECTION[z] })),
    movePalace: move ? `${move.stem}${move.branch} · ${move.majorStars.filter(s => s.isMajor).map(s => `${s.name}${s.mutagen ? `化${s.mutagen}` : ''}`).join('、') || '无主星'}` : null
  };
}

export function placeFactsText(f) {
  return [
    `参照点：${f.origin.name}（${f.origin.source === 'birth' ? '出生地' : '未填出生地，默认北京'}）；范围：${f.scope === 'intl' ? '海外' : '国内'}；日主喜 ${f.favor.join('、')}`,
    ...f.directions.map(d => `- ${d.name}｜${d.trigram}位属${d.wuxing}${d.isFavor ? '（喜用）' : ''}，对日主${d.relation}；近处：${d.near.join('、') || '—'}；远处：${d.far.join('、') || '—'}`),
    f.taohua.length ? `桃花位（按年支/日支三合）：${f.taohua.map(t => `${t.zhi}（${t.direction}）`).join('、')}` : '',
    f.yima.length ? `驿马位：${f.yima.map(t => `${t.zhi}（${t.direction}）`).join('、')}` : '',
    f.movePalace ? `紫微迁移宫：${f.movePalace}` : ''
  ].filter(Boolean).join('\n');
}

/** 用户点名问某个地方：算出它相对参照点的方位事实 */
export function cityFacts(name, f) {
  const c = knownCities().find(x => x.name === name || name.includes(x.name));
  if (!c) return `${name}：不在内置城市表里，只知道名字`;
  const b = bearing(f.origin, c); const d = directionOf(b); const tri = TRIGRAMS[d.trigram];
  return `${c.name}：从${f.origin.name}看在${d.name}（${Math.round(b)}°），约 ${distanceKm(f.origin, c)} 公里，${tri.name}位属${tri.wuxing}${f.favor.includes(tri.wuxing) ? '（喜用）' : ''}`;
}
