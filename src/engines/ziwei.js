import { astro } from 'iztro';
import { MAJOR_STARS, MUTAGEN, PALACE_DOMAIN } from '../data/stars';

/** HH:mm -> iztro timeIndex（0 早子 … 12 晚子） */
export function timeToIndex(time) {
  if (!time) return 6; // 时辰不确定时以午时占位，界面须标注
  const [h] = time.split(':').map(Number);
  if (h >= 23) return 12;
  return Math.floor((h + 1) / 2);
}

/**
 * 构建紫微盘。
 * @param {{date:string, time?:string, gender?:'男'|'女', timeUnknown?:boolean}} input
 */
export function buildZiwei(input) {
  const { date, time, gender = '男', timeUnknown = false } = input;
  const [y, m, d] = date.split('-').map(Number);
  const timeIndex = timeToIndex(timeUnknown ? null : time);
  const a = astro.bySolar(`${y}-${m}-${d}`, timeIndex, gender, true, 'zh-CN');

  const palaces = a.palaces.map((p, i) => ({
    index: i,
    name: p.name,
    stem: p.heavenlyStem,
    branch: p.earthlyBranch,
    isSoul: p.name === '命宫',
    isBody: p.isBodyPalace,
    domain: PALACE_DOMAIN[p.name] || 'self',
    majorStars: p.majorStars.map(s => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen, isMajor: !!MAJOR_STARS[s.name] })),
    minorStars: p.minorStars.map(s => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen })),
    adjectiveStars: p.adjectiveStars.map(s => s.name),
    decadalRange: p.decadal.range,
    decadalStem: p.decadal.heavenlyStem,
    decadalBranch: p.decadal.earthlyBranch
  }));

  const soulPalace = palaces.find(p => p.isSoul);
  const soulMajors = soulPalace.majorStars.filter(s => MAJOR_STARS[s.name]);
  // 命宫无主星时借对宫（迁移宫）
  let borrowedFrom = null;
  let effectiveMajors = soulMajors;
  if (!soulMajors.length) {
    const opposite = palaces[(soulPalace.index + 6) % 12];
    effectiveMajors = opposite.majorStars.filter(s => MAJOR_STARS[s.name]);
    borrowedFrom = opposite.name;
  }

  return {
    system: 'ziwei',
    input: { date, time: timeUnknown ? null : time, gender, timeUnknown, timeIndex },
    fiveElementsClass: a.fiveElementsClass,
    soul: a.soul,
    body: a.body,
    lunarDate: a.lunarDate,
    chineseDate: a.chineseDate,
    zodiac: a.zodiac,
    sign: a.sign,
    palaces,
    soulPalace,
    soulMajors: effectiveMajors,
    borrowedFrom,
    _astro: a
  };
}

/** 取某一年的大限 / 流年信息 */
export function ziweiAtYear(ziwei, year, month = 6, day = 15) {
  const h = ziwei._astro.horoscope(`${year}-${month}-${day}`);
  const decadalPalace = ziwei.palaces[h.decadal.index];
  const yearlyPalace = ziwei.palaces[h.yearly.index];
  return {
    year,
    decadal: {
      index: h.decadal.index,
      palaceName: decadalPalace.name,
      range: decadalPalace.decadalRange,
      ganZhi: h.decadal.heavenlyStem + h.decadal.earthlyBranch,
      mutagen: h.decadal.mutagen,
      // 大限命宫落在本命的哪个宫位 -> 该阶段的人生重心
      palaceNames: h.decadal.palaceNames
    },
    yearly: {
      index: h.yearly.index,
      palaceName: yearlyPalace.name,
      ganZhi: h.yearly.heavenlyStem + h.yearly.earthlyBranch,
      mutagen: h.yearly.mutagen,
      palaceNames: h.yearly.palaceNames
    }
  };
}

/** 四化落宫：给定四化星名数组，找出它们分别落在哪个宫 */
export function locateMutagens(ziwei, mutagenStars) {
  const labels = ['禄', '权', '科', '忌'];
  return (mutagenStars || []).map((starName, i) => {
    const palace = ziwei.palaces.find(p =>
      p.majorStars.some(s => s.name === starName) ||
      p.minorStars.some(s => s.name === starName)
    );
    return {
      type: labels[i],
      star: starName,
      palace: palace ? palace.name : null,
      domain: palace ? palace.domain : null,
      meaning: MUTAGEN[labels[i]]
    };
  }).filter(x => x.palace);
}
