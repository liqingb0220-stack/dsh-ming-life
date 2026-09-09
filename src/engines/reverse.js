import { Solar } from 'lunar-javascript';
import { isValidPillar } from './ganzhi';

/** 十二时辰。startHour 为该时辰的起始小时（晚子时归到 23 点）。 */
export const SHICHEN = [
  { zhi: '子', label: '子时', range: '23:00–00:59', probe: 0, display: '00:30' },
  { zhi: '丑', label: '丑时', range: '01:00–02:59', probe: 1, display: '01:30' },
  { zhi: '寅', label: '寅时', range: '03:00–04:59', probe: 3, display: '03:30' },
  { zhi: '卯', label: '卯时', range: '05:00–06:59', probe: 5, display: '05:30' },
  { zhi: '辰', label: '辰时', range: '07:00–08:59', probe: 7, display: '07:30' },
  { zhi: '巳', label: '巳时', range: '09:00–10:59', probe: 9, display: '09:30' },
  { zhi: '午', label: '午时', range: '11:00–12:59', probe: 11, display: '11:30' },
  { zhi: '未', label: '未时', range: '13:00–14:59', probe: 13, display: '13:30' },
  { zhi: '申', label: '申时', range: '15:00–16:59', probe: 15, display: '15:30' },
  { zhi: '酉', label: '酉时', range: '17:00–18:59', probe: 17, display: '17:30' },
  { zhi: '戌', label: '戌时', range: '19:00–20:59', probe: 19, display: '19:30' },
  { zhi: '亥', label: '亥时', range: '21:00–22:59', probe: 21, display: '21:30' }
];

export const shichenOfHour = h => {
  if (h >= 23 || h < 1) return SHICHEN[0];
  return SHICHEN[Math.floor((h + 1) / 2) % 12];
};

/**
 * 由四柱反推公历出生日期。
 * 六十甲子每 60 年一循环，因此 1900–2100 内通常有 2–3 个解，交给用户挑年份。
 * 无解说明这组四柱在历法上不成立（例如年干支与月干支不匹配）。
 */
export function solarFromPillars({ year, month, day, hour }, fromYear = 1900, toYear = 2100) {
  if (![year, month, day, hour].every(isValidPillar)) {
    return { ok: false, reason: 'invalid', candidates: [] };
  }

  // 年柱按立春分界、月柱按节气分界，两者都与出生时刻有关，
  // 因此不能用日历层面的年/月干支预筛，只能逐个时辰用 EightChar 校验全部四柱。
  // 唯一可靠的廉价预筛是日柱：它 60 天一循环，且与时刻无关（晚子时另行处理）。
  const yearGZ = {};
  for (let y = fromYear - 1; y <= toYear; y++) {
    yearGZ[y] = Solar.fromYmd(y, 6, 1).getLunar().getYearInGanZhi();
  }

  const candidates = [];
  const seen = new Set();

  const tryProbe = (sy, sm, sd, probeHour, sc) => {
    const probe = Solar.fromYmdHms(sy, sm, sd, probeHour, 30, 0);
    const ec = probe.getLunar().getEightChar();
    if (ec.getYear() !== year || ec.getMonth() !== month || ec.getDay() !== day || ec.getTime() !== hour) return;
    const key = `${probe.getYear()}-${probe.getMonth()}-${probe.getDay()}-${probeHour}`;
    if (seen.has(key)) return;
    seen.add(key);
    const l = probe.getLunar();
    candidates.push({
      date: `${probe.getYear()}-${String(probe.getMonth()).padStart(2, '0')}-${String(probe.getDay()).padStart(2, '0')}`,
      year: probe.getYear(),
      shichen: sc,
      time: `${String(probeHour).padStart(2, '0')}:30`,
      lateZi: probeHour === 23,
      lunarText: `${l.getYearInChinese()}年${l.getMonthInChinese()}月${l.getDayInChinese()}`
    });
  };

  let jd = Solar.fromYmd(fromYear, 1, 1).getJulianDay();
  const end = Solar.fromYmd(toYear, 12, 31).getJulianDay();
  while (jd <= end) {
    const s = Solar.fromJulianDay(jd);
    if (s.getLunar().getDayInGanZhi() === day) {
      const y = s.getYear();
      // 该日期的八字年柱只可能是当年或上一年的（立春前算上一年）
      if (yearGZ[y] === year || yearGZ[y - 1] === year) {
        // 早子 … 亥：本日 0–21 点
        for (const sc of SHICHEN) tryProbe(y, s.getMonth(), s.getDay(), sc.probe, sc);
        // 晚子时：本日 23 点。lunar-javascript 的约定是日柱仍取当日，
        // 时柱按次日日干推，因此它与早子时的时柱不同，必须单独试。
        tryProbe(y, s.getMonth(), s.getDay(), 23, SHICHEN[0]);
      }
      jd += 59;
    }
    jd += 1;
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date));
  return { ok: candidates.length > 0, reason: candidates.length ? null : 'impossible', candidates };
}

export const REVERSE_HINT = {
  invalid: '四柱需要各填一个完整的干支。',
  impossible: '这组四柱在历法上不成立——年、月、日、时干支之间有固定的推导关系，不能任意组合。请检查是否抄错了。'
};
