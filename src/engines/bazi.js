import { Solar } from 'lunar-javascript';
import { shiShen, GAN_WUXING, ZHI_WUXING, GAN_YIN_YANG, SUPPORTIVE, ZHI_ANIMAL, shengOf, keOf, HIDE_GAN } from './ganzhi';
import { TEN_GODS } from '../data/tenGods';

const PILLAR_MEANING = {
  年: '早年环境与家庭底色',
  月: '成长期与主要事业场域',
  日: '自身与亲密关系',
  时: '晚年与产出、子女、作品'
};

// 地支藏干权重：本气 / 中气 / 余气
const HIDE_W = [1, 0.5, 0.3];

/**
 * 构建八字盘。
 * @param {{date:string, time?:string, gender?:'男'|'女', timeUnknown?:boolean}} input
 */
export function buildBazi(input) {
  const { date, time, gender = '男', timeUnknown = false } = input;
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = timeUnknown ? [12, 0] : (time || '12:00').split(':').map(Number);

  const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const raw = [
    { pos: '年', gan: ec.getYearGan(), zhi: ec.getYearZhi(), hide: ec.getYearHideGan(), ssGan: ec.getYearShiShenGan(), ssZhi: ec.getYearShiShenZhi(), naYin: ec.getYearNaYin() },
    { pos: '月', gan: ec.getMonthGan(), zhi: ec.getMonthZhi(), hide: ec.getMonthHideGan(), ssGan: ec.getMonthShiShenGan(), ssZhi: ec.getMonthShiShenZhi(), naYin: ec.getMonthNaYin() },
    { pos: '日', gan: ec.getDayGan(), zhi: ec.getDayZhi(), hide: ec.getDayHideGan(), ssGan: '日主', ssZhi: ec.getDayShiShenZhi(), naYin: ec.getDayNaYin() },
    { pos: '时', gan: ec.getTimeGan(), zhi: ec.getTimeZhi(), hide: ec.getTimeHideGan(), ssGan: ec.getTimeShiShenGan(), ssZhi: ec.getTimeShiShenZhi(), naYin: ec.getTimeNaYin() }
  ];

  const pillars = raw.map(p => ({ ...p, meaning: PILLAR_MEANING[p.pos], wuxingGan: GAN_WUXING[p.gan], wuxingZhi: ZHI_WUXING[p.zhi] }));
  const dayGan = ec.getDayGan();
  const monthZhi = ec.getMonthZhi();

  // ---- 五行统计（月令加权） ----
  const wuxing = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const contrib = [];
  pillars.forEach(p => {
    const mw = p.pos === '月' ? 1.5 : 1;
    wuxing[GAN_WUXING[p.gan]] += mw;
    contrib.push({ from: `${p.pos}干 ${p.gan}`, wuxing: GAN_WUXING[p.gan], weight: mw });
    p.hide.forEach((g, i) => {
      const w = HIDE_W[i] * mw;
      wuxing[GAN_WUXING[g]] += w;
      contrib.push({ from: `${p.pos}支 ${p.zhi} 藏 ${g}`, wuxing: GAN_WUXING[g], weight: +w.toFixed(2) });
    });
  });
  const wuxingTotal = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const wuxingPct = {};
  Object.keys(wuxing).forEach(k => { wuxingPct[k] = +(wuxing[k] / wuxingTotal * 100).toFixed(1); wuxing[k] = +wuxing[k].toFixed(2); });

  // ---- 十神统计 ----
  const tenGods = {};
  const tenGodEvidence = [];
  pillars.forEach(p => {
    const mw = p.pos === '月' ? 1.5 : 1;
    if (p.pos !== '日') {
      const s = shiShen(dayGan, p.gan);
      if (s) { tenGods[s] = (tenGods[s] || 0) + mw; tenGodEvidence.push({ god: s, from: `${p.pos}干 ${p.gan}`, weight: mw }); }
    }
    p.hide.forEach((g, i) => {
      const s = shiShen(dayGan, g);
      const w = HIDE_W[i] * mw;
      if (s) { tenGods[s] = (tenGods[s] || 0) + w; tenGodEvidence.push({ god: s, from: `${p.pos}支 ${p.zhi} 藏 ${g}`, weight: +w.toFixed(2) }); }
    });
  });
  Object.keys(tenGods).forEach(k => { tenGods[k] = +tenGods[k].toFixed(2); });
  const tenGodsSorted = Object.entries(tenGods).sort((a, b) => b[1] - a[1]).map(([god, weight]) => ({ god, weight, ...TEN_GODS[god] }));

  // ---- 日主强弱 ----
  const supportW = tenGodsSorted.filter(t => SUPPORTIVE.includes(t.god)).reduce((a, b) => a + b.weight, 0) + 1; // +1 为日主自身
  const totalW = tenGodsSorted.reduce((a, b) => a + b.weight, 0) + 1;
  const strengthScore = +(supportW / totalW * 100).toFixed(1);
  const dayWuxing = GAN_WUXING[dayGan];
  const monthWuxing = ZHI_WUXING[monthZhi];
  const deLing = monthWuxing === dayWuxing ? '得令' : shengOf(monthWuxing) === dayWuxing ? '得生' : keOf(monthWuxing) === dayWuxing ? '受克' : shengOf(dayWuxing) === monthWuxing ? '泄气' : '耗身';
  const strengthLabel = strengthScore >= 55 ? '偏强' : strengthScore >= 42 ? '中和' : '偏弱';
  const SHENG_ME = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
  // 偏强宜泄耗（我生、我克），偏弱宜生扶（同我、生我）
  const favor = strengthLabel === '偏强'
    ? [shengOf(dayWuxing), keOf(dayWuxing)]
    : strengthLabel === '偏弱'
      ? [dayWuxing, SHENG_ME[dayWuxing]]
      : [dayWuxing, shengOf(dayWuxing)];
  const strength = {
    score: strengthScore,
    label: strengthLabel,
    deLing,
    basis: `日主 ${dayGan}（${dayWuxing}），生于 ${monthZhi} 月（${monthWuxing}），月令${deLing}；帮身力量占比 ${strengthScore}%。`,
    favor
  };

  // ---- 大运 ----
  const genderCode = gender === '女' ? 0 : 1;
  const yun = ec.getYun(genderCode);
  const daYunRaw = yun.getDaYun();
  const daYun = daYunRaw
    .filter(dy => dy.getGanZhi())
    .map(dy => {
      const gz = dy.getGanZhi();
      const g = gz[0], z = gz[1];
      return {
        ganZhi: gz,
        gan: g,
        zhi: z,
        startYear: dy.getStartYear(),
        endYear: dy.getEndYear(),
        startAge: dy.getStartAge(),
        endAge: dy.getEndAge(),
        shiShenGan: shiShen(dayGan, g),
        shiShenZhi: shiShen(dayGan, z),
        wuxing: [GAN_WUXING[g], ZHI_WUXING[z]]
      };
    });

  const startInfo = { year: yun.getStartYear(), month: yun.getStartMonth(), day: yun.getStartDay() };

  return {
    system: 'bazi',
    input: { date, time: timeUnknown ? null : time, gender, timeUnknown },
    solar: { y, m, d, hh, mm },
    lunarText: `${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
    animal: ZHI_ANIMAL[ec.getYearZhi()],
    pillars,
    dayMaster: { gan: dayGan, wuxing: dayWuxing, yinYang: GAN_YIN_YANG[dayGan] ? '阳' : '阴' },
    taiYuan: ec.getTaiYuan(),
    mingGong: ec.getMingGong(),
    wuxing,
    wuxingPct,
    wuxingContrib: contrib,
    tenGods: tenGodsSorted,
    tenGodEvidence,
    strength,
    daYun,
    startInfo,
    dayYi: lunar.getDayYi(),
    dayJi: lunar.getDayJi()
  };
}

/** 取某一年所在的大运与该年流年干支 */
export function baziAtYear(bazi, year) {
  const dy = bazi.daYun.find(d => year >= d.startYear && year <= d.endYear) || null;
  const solar = Solar.fromYmd(year, 6, 1);
  const gz = solar.getLunar().getYearInGanZhi();
  const g = gz[0], z = gz[1];
  return {
    daYun: dy,
    liuNian: {
      year,
      ganZhi: gz,
      gan: g,
      zhi: z,
      shiShenGan: shiShen(bazi.dayMaster.gan, g),
      shiShenZhi: shiShen(bazi.dayMaster.gan, z),
      wuxing: [GAN_WUXING[g], ZHI_WUXING[z]]
    }
  };
}

/**
 * 方式 B：用户直接输入四柱。没有公历信息，因此不排大运，紫微/黄历需另行补充出生信息。
 */
export function buildBaziFromPillars({ year, month, day, hour, gender = '男' }) {
  const input = { 年: year, 月: month, 日: day, 时: hour };
  const dayGan = day[0];
  const dayWuxing = GAN_WUXING[dayGan];
  const monthZhi = month[1];

  const pillars = ['年', '月', '日', '时'].map(pos => {
    const gz = input[pos];
    const g = gz[0], z = gz[1];
    const hide = HIDE_GAN[z] || [];
    return {
      pos, gan: g, zhi: z, hide,
      ssGan: pos === '日' ? '日主' : shiShen(dayGan, g),
      ssZhi: hide.map(h => shiShen(dayGan, h)),
      naYin: '—',
      meaning: PILLAR_MEANING[pos],
      wuxingGan: GAN_WUXING[g],
      wuxingZhi: ZHI_WUXING[z]
    };
  });

  const wuxing = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const contrib = [];
  const tenGods = {};
  const tenGodEvidence = [];
  pillars.forEach(p => {
    const mw = p.pos === '月' ? 1.5 : 1;
    wuxing[GAN_WUXING[p.gan]] += mw;
    contrib.push({ from: `${p.pos}干 ${p.gan}`, wuxing: GAN_WUXING[p.gan], weight: mw });
    if (p.pos !== '日') {
      const s = shiShen(dayGan, p.gan);
      if (s) { tenGods[s] = (tenGods[s] || 0) + mw; tenGodEvidence.push({ god: s, from: `${p.pos}干 ${p.gan}`, weight: mw }); }
    }
    p.hide.forEach((g, i) => {
      const w = HIDE_W[i] * mw;
      wuxing[GAN_WUXING[g]] += w;
      contrib.push({ from: `${p.pos}支 ${p.zhi} 藏 ${g}`, wuxing: GAN_WUXING[g], weight: +w.toFixed(2) });
      const s = shiShen(dayGan, g);
      if (s) { tenGods[s] = (tenGods[s] || 0) + w; tenGodEvidence.push({ god: s, from: `${p.pos}支 ${p.zhi} 藏 ${g}`, weight: +w.toFixed(2) }); }
    });
  });
  const wuxingTotal = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const wuxingPct = {};
  Object.keys(wuxing).forEach(k => { wuxingPct[k] = +(wuxing[k] / wuxingTotal * 100).toFixed(1); wuxing[k] = +wuxing[k].toFixed(2); });
  Object.keys(tenGods).forEach(k => { tenGods[k] = +tenGods[k].toFixed(2); });
  const tenGodsSorted = Object.entries(tenGods).sort((a, b) => b[1] - a[1]).map(([god, weight]) => ({ god, weight, ...TEN_GODS[god] }));

  const supportW = tenGodsSorted.filter(t => SUPPORTIVE.includes(t.god)).reduce((a, b) => a + b.weight, 0) + 1;
  const totalW = tenGodsSorted.reduce((a, b) => a + b.weight, 0) + 1;
  const strengthScore = +(supportW / totalW * 100).toFixed(1);
  const monthWuxing = ZHI_WUXING[monthZhi];
  const deLing = monthWuxing === dayWuxing ? '得令' : shengOf(monthWuxing) === dayWuxing ? '得生' : keOf(monthWuxing) === dayWuxing ? '受克' : shengOf(dayWuxing) === monthWuxing ? '泄气' : '耗身';
  const strengthLabel = strengthScore >= 55 ? '偏强' : strengthScore >= 42 ? '中和' : '偏弱';
  const SHENG_ME = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
  const favor = strengthLabel === '偏强' ? [shengOf(dayWuxing), keOf(dayWuxing)]
    : strengthLabel === '偏弱' ? [dayWuxing, SHENG_ME[dayWuxing]] : [dayWuxing, shengOf(dayWuxing)];

  return {
    system: 'bazi',
    source: 'pillars',
    input: { gender, pillars: input },
    solar: null,
    lunarText: null,
    animal: ZHI_ANIMAL[year[1]],
    pillars,
    dayMaster: { gan: dayGan, wuxing: dayWuxing, yinYang: GAN_YIN_YANG[dayGan] ? '阳' : '阴' },
    taiYuan: null,
    mingGong: null,
    wuxing, wuxingPct, wuxingContrib: contrib,
    tenGods: tenGodsSorted, tenGodEvidence,
    strength: { score: strengthScore, label: strengthLabel, deLing, basis: `日主 ${dayGan}（${dayWuxing}），月支 ${monthZhi}（${monthWuxing}），月令${deLing}；帮身力量占比 ${strengthScore}%。`, favor },
    daYun: [],
    startInfo: null,
    dayYi: [], dayJi: [],
    limited: true
  };
}
