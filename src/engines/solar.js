/**
 * 真太阳时校正。
 * 钟表时间是时区标准时（中国统一用东经 120° 的北京时间），排盘用的「时辰」按的是当地太阳位置。
 * 差两部分：经度差（每 1° 差 4 分钟）+ 均时差（地球轨道造成的 ±16 分钟以内的季节性偏差）。
 */
import { PLACES, PROVINCE_CAPITAL } from '../data/geo';

const norm = s => String(s || '').replace(/[\s,，、·。.\-—()（）]/g, '');

/** 从用户随手写的地名里认出一个城市。认不出返回 null。 */
export function resolvePlace(text) {
  const t = norm(text);
  if (!t) return null;
  // 最长匹配优先：「吉林市」优先于「吉林」省
  const hit = PLACES.filter(p => t.includes(p.n) || (p.n.endsWith('市') && t.includes(p.n.slice(0, -1)) && !t.includes(`${p.n.slice(0, -1)}省`)))
    .sort((a, b) => b.n.length - a.n.length)[0];
  if (hit) return { name: hit.n.replace(/市$/, ''), lng: hit.lng, lat: hit.lat, tz: hit.tz, source: 'city' };
  const prov = Object.keys(PROVINCE_CAPITAL).find(p => t.includes(p));
  if (prov) {
    const cap = PLACES.find(p => p.n === PROVINCE_CAPITAL[prov]);
    return { name: `${prov}（按省会${cap.n}）`, lng: cap.lng, lat: cap.lat, tz: cap.tz, source: 'province' };
  }
  return null;
}

/** 均时差（分钟），Spencer 近似，误差 < 1 分钟 */
export function equationOfTime(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const n = Math.floor((Date.UTC(y, m - 1, d) - start) / 86400000) + 1;
  const B = (2 * Math.PI * (n - 81)) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

const pad = n => String(n).padStart(2, '0');

/** 把钟表时间换成真太阳时。返回校正后的日期时间和拆开的两项偏差。 */
export function solarCorrection({ date, time, lng, tz = 8 }) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '12:00').split(':').map(Number);
  const lngMin = (lng - tz * 15) * 4;
  const eot = equationOfTime(y, m, d);
  const offset = Math.round(lngMin + eot);
  const t = new Date(y, m - 1, d, hh, mm + offset, 0);
  return {
    date: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    time: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
    offsetMin: offset, lngMin: Math.round(lngMin), eot: Math.round(eot),
    dayShift: t.getDate() !== d ? (t > new Date(y, m - 1, d, hh, mm) ? 1 : -1) : 0
  };
}

/**
 * 档案 → 排盘实际用的出生时刻。
 * 只在「知道出生日期 + 时间已知 + 能定位经度」时校正；四柱直录的档案不动。
 */
export function correctedBirth(profile) {
  const base = { date: profile.birth_date, time: profile.birth_time, applied: false, place: null, lng: null, offsetMin: 0, note: '' };
  if (!profile?.birth_date || profile.time_unknown || profile.source === 'pillars' || profile.solar_correction === false) return base;
  const manual = Number(profile.birth_lng);
  const place = Number.isFinite(manual) && manual !== 0 ? { name: profile.birth_place || '手填经度', lng: manual, tz: 8, source: 'manual' } : resolvePlace(profile.birth_place);
  if (!place) return { ...base, note: profile.birth_place ? `没认出「${profile.birth_place}」，未做真太阳时校正` : '' };
  const c = solarCorrection({ date: profile.birth_date, time: profile.birth_time, lng: place.lng, tz: place.tz });
  return {
    date: c.date, time: c.time, applied: true, place: place.name, lng: place.lng, offsetMin: c.offsetMin, eot: c.eot, lngMin: c.lngMin,
    original: { date: profile.birth_date, time: profile.birth_time },
    note: `已按真太阳时校正：${place.name} 东经 ${place.lng}°，钟表 ${profile.birth_time} → 真太阳时 ${c.time}${c.dayShift ? `（${c.dayShift > 0 ? '跨到次日' : '退到前一日'}）` : ''}（经度差 ${c.lngMin >= 0 ? '+' : ''}${c.lngMin} 分，均时差 ${c.eot >= 0 ? '+' : ''}${c.eot} 分）`
  };
}
