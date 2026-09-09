import { TRIGRAMS, relation } from '../data/trigrams';
import { castCoins, buildLiuYao } from './liuyao';
import { baziAtYear } from './bazi';
import { ziweiAtYear } from './ziwei';
import { Solar } from 'lunar-javascript';
import { makeInsight, ev, SYSTEM_LABEL } from './insight';
import { REAL_FACTORS } from '../data/cities';

// 后天八卦方位。以正北为 0°，顺时针每 45° 一宫。
export const DIRECTIONS = [
  { from: 337.5, to: 22.5,  key: 'kan',  name: '正北', trigram: 'kan'  },
  { from: 22.5,  to: 67.5,  key: 'gen',  name: '东北', trigram: 'gen'  },
  { from: 67.5,  to: 112.5, key: 'zhen', name: '正东', trigram: 'zhen' },
  { from: 112.5, to: 157.5, key: 'xun',  name: '东南', trigram: 'xun'  },
  { from: 157.5, to: 202.5, key: 'li',   name: '正南', trigram: 'li'   },
  { from: 202.5, to: 247.5, key: 'kun',  name: '西南', trigram: 'kun'  },
  { from: 247.5, to: 292.5, key: 'dui',  name: '正西', trigram: 'dui'  },
  { from: 292.5, to: 337.5, key: 'qian', name: '西北', trigram: 'qian' }
];

const rad = d => (d * Math.PI) / 180;
const deg = r => (r * 180) / Math.PI;

/** 大圆航向角（0–360，正北为 0） */
export function bearing(from, to) {
  const φ1 = rad(from.lat), φ2 = rad(to.lat);
  const Δλ = rad(to.lng - from.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** 大圆距离（km） */
export function distanceKm(from, to) {
  const R = 6371;
  const φ1 = rad(from.lat), φ2 = rad(to.lat);
  const Δφ = rad(to.lat - from.lat), Δλ = rad(to.lng - from.lng);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

export function directionOf(b) {
  return DIRECTIONS.find(d => (d.from > d.to ? b >= d.from || b < d.to : b >= d.from && b < d.to)) || DIRECTIONS[0];
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/**
 * 比较多个候选地点。
 * @param origin {name, lat, lng} 当前所在地
 * @param places [{id, name, lat, lng, factors:{key:1-5}, notes}]
 */
export function compareLocations({ origin, places, bazi, ziwei, gender, caseId = 'loc', now = new Date() }) {
  const year = now.getFullYear();
  const lunar = Solar.fromDate(now).getLunar();
  const dayGan = lunar.getDayGan(), dayZhi = lunar.getDayZhi();
  const { daYun, liuNian } = bazi.daYun.length ? baziAtYear(bazi, year) : { daYun: null, liuNian: null };
  const at = ziwei ? ziweiAtYear(ziwei, year) : null;

  const views = places.map((p, i) => {
    const b = bearing(origin, p);
    const dir = directionOf(b);
    const tri = TRIGRAMS[dir.trigram];
    const dist = distanceKm(origin, p);

    // 方位五行 与 日主喜用 的关系
    const favor = bazi.strength.favor;
    const rel = relation(tri.wuxing, bazi.dayMaster.wuxing); // 方位五行 对 日主
    const isFavor = favor.includes(tri.wuxing);

    // 每个地点单独起一卦
    const cast = castCoins(hashSeed(`${caseId}|${p.id || p.name}|${i}`));
    const gua = buildLiuYao({ ...cast, dayGan, dayZhi, question: p.name });

    // 现实因素总分（用户自评，等权）
    const factorVals = REAL_FACTORS.map(f => Number(p.factors?.[f.key] || 0));
    const realScore = factorVals.filter(v => v > 0).length
      ? +(factorVals.reduce((a, b2) => a + b2, 0) / factorVals.filter(v => v > 0).length).toFixed(1)
      : null;

    return {
      place: p,
      bearing: +b.toFixed(1),
      distance: dist,
      direction: dir,
      trigram: tri,
      isFavor,
      relation: rel,
      gua,
      tendency: gua.ben.tendency,
      realScore,
      factors: REAL_FACTORS.map(f => ({ ...f, value: Number(p.factors?.[f.key] || 0) })),
      insight: makeInsight({
        title: p.name,
        summary: `从${origin.name}出发，${p.name}在${dir.name}方向，直线约 ${dist} 公里。传统上把这个方向归到${tri.name}位，五行属${tri.wuxing}${isFavor ? `——正好是你日主所喜的那一类（${favor.join('、')}）` : `——不在你日主所喜的 ${favor.join('、')} 里面`}。`,
        note: '本工作台的立场是现实因素优先：上面你自己填的成本、机会、关系，权重应该比这一层方位判断高得多。',
        systems: [
          {
            system: 'bazi', label: SYSTEM_LABEL.bazi,
            interpretation: `八卦把方向分成八块，${dir.name}属${tri.name}，五行是${tri.wuxing}。你的日主是${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}），两者的关系是「${rel.label}」——${rel.desc}${liuNian ? `另外今年配的是 ${liuNian.ganZhi}${daYun ? `，大运在 ${daYun.ganZhi}` : ''}。` : ''}`,
            evidence: [
              ev('rule', `${dir.name} ${b.toFixed(0)}°`, `以当前所在地 ${origin.name} 为原点计算的航向角，落在${tri.name}宫（${dir.from}°–${dir.to}°）`),
              ev('wuxing', `${tri.name}位属${tri.wuxing}`, `后天八卦方位五行；日主喜 ${favor.join('、')}`),
              ev('strength', `日主${bazi.strength.label}`, bazi.strength.basis),
              liuNian && ev('liu_nian', `${year} 年 ${liuNian.ganZhi}`, `十神 ${[liuNian.shiShenGan, liuNian.shiShenZhi].filter(Boolean).join(' / ')}`)
            ].filter(Boolean)
          },
          at && {
            system: 'ziwei', label: SYSTEM_LABEL.ziwei,
            interpretation: `${year} 流年命宫落本命${at.yearly.palaceName}宫；大限走${at.decadal.palaceName}宫（${at.decadal.range.join('–')} 岁）。${at.yearly.palaceName === '迁移' || at.decadal.palaceName === '迁移' ? '迁移宫被引动，紫微层面对「换地方」这件事是有信号的。' : '本年重心并不在迁移宫，紫微层面对搬迁没有特别指向。'}`,
            evidence: [
              ev('palace', `流年命宫 ${at.yearly.palaceName}`, `流年 ${at.yearly.ganZhi}`),
              ev('decadal', `大限 ${at.decadal.palaceName}宫`, `${at.decadal.range.join('–')} 岁`)
            ]
          },
          {
            system: 'liuyao', label: SYSTEM_LABEL.liuyao,
            interpretation: `就「去${p.name}」单独起一卦，得「${gua.ben.name}」${gua.bian ? `之「${gua.bian.name}」` : '（六爻皆静）'}，主题为${gua.ben.theme}：${gua.ben.plain}`,
            evidence: [
              ev('hexagram', `本卦 ${gua.ben.name}`, `${gua.ben.meta.palaceName}宫${gua.ben.meta.posLabel} · 倾向${gua.ben.tendency}`),
              gua.bian && ev('hexagram', `变卦 ${gua.bian.name}`, `动爻 ${gua.moving.map(x => x + 1).join('、')}`),
              ev('rule', `世应 ${gua.shiYingRel.label}`, gua.shiYingRel.desc)
            ].filter(Boolean)
          }
        ]
      })
    };
  });

  // 现实因素与命理视角是否指向同一个地方
  const byReal = [...views].filter(v => v.realScore !== null).sort((a, b) => b.realScore - a.realScore);
  const byFavor = views.filter(v => v.isFavor);
  const conflict = byReal.length && byFavor.length && !byFavor.some(v => v.place.name === byReal[0].place.name);

  return {
    origin, views, year,
    summaryText: byReal.length
      ? `按你自己填的现实因素，${byReal[0].place.name} 目前得分最高（${byReal[0].realScore}/5）。${byFavor.length ? `命理方位层面落在日主所喜五行上的是 ${byFavor.map(v => v.place.name).join('、')}。` : '命理方位层面没有候选地落在日主所喜的五行上。'}`
      : '还没有填写现实因素。命理方位只是一层参考，先把现实条件填上，比较才有意义。',
    conflictText: conflict
      ? `注意：现实因素得分最高的是 ${byReal[0].place.name}，而方位五行相合的是 ${byFavor.map(v => v.place.name).join('、')}。两者不一致时，本工作台的立场是现实因素优先——命理不应该用来推翻你已经算清楚的账。`
      : byReal.length && byFavor.length
        ? `现实因素与方位视角这次指向一致，但这只是巧合层面的一致，不构成加强论证。`
        : ''
  };
}
