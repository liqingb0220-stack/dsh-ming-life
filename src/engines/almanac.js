import { Solar } from 'lunar-javascript';
import { ACTIVITIES, ZHI_XING, MATCH_LEVELS } from '../data/activities';
import { ZHI_WUXING, GAN_WUXING, shiShen } from './ganzhi';
import { makeInsight, ev, SYSTEM_LABEL } from './insight';

const CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };

/** 取某一天的完整黄历信息 */
export function almanacOf(date) {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const l = solar.getLunar();
  const ec = l.getEightChar();
  const dayGZ = l.getDayInGanZhi();
  return {
    date,
    iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    lunarText: `${l.getMonthInChinese()}月${l.getDayInChinese()}`,
    yearGZ: l.getYearInGanZhi(),
    monthGZ: l.getMonthInGanZhi(),
    dayGZ,
    dayGan: dayGZ[0],
    dayZhi: dayGZ[1],
    yi: l.getDayYi(),
    ji: l.getDayJi(),
    tianShen: l.getDayTianShen(),
    tianShenType: l.getDayTianShenType(),   // 黄道 / 黑道
    tianShenLuck: l.getDayTianShenLuck(),
    zhiXing: l.getZhiXing(),                // 建除十二值
    xiu: l.getXiu(),
    xiuLuck: l.getXiuLuck(),
    xiuAnimal: l.getAnimal(),
    chongDesc: l.getDayChongDesc(),
    sha: l.getDaySha(),
    pengZu: [l.getPengZuGan(), l.getPengZuZhi()],
    jiShen: l.getDayJiShen(),
    xiongSha: l.getDayXiongSha(),
    xiPosition: l.getDayPositionXiDesc(),
    caiPosition: l.getDayPositionCaiDesc(),
    fuPosition: l.getDayPositionFuDesc(),
    taiShen: l.getDayPositionTai(),
    // getDayXunKong() 返回字符串（如 "午未"），统一成数组，避免调用方 join/map 出错
    xunKong: (ec.getDayXunKong() || '').split('').filter(Boolean),
    jieQi: l.getJieQi() || null,
    festivals: [...l.getFestivals(), ...solar.getFestivals()],
    times: l.getTimes().map(t => ({ ganZhi: t.getGanZhi(), zhi: t.getGanZhi()[1], yi: t.getYi(), ji: t.getJi() }))
  };
}

/**
 * 按事件类型与用户命局给某一天打分。
 * 输出的是「匹配项多少」，不是吉凶断言。
 */
export function scoreDay(alm, activityKey, bazi) {
  const act = (activityKey && typeof activityKey === 'object') ? activityKey : (ACTIVITIES.find(a => a.key === activityKey) || ACTIVITIES[0]);
  const plus = [], minus = [];
  let score = 0;

  // 1) 黄历宜忌命中
  const yiHits = act.yi.filter(k => alm.yi.includes(k));
  const jiHits = act.ji.filter(k => alm.ji.includes(k));
  yiHits.forEach(k => { score += 3; plus.push({ type: 'rule', label: '黄历宜', value: k, detail: `当日「宜」中列有「${k}」` }); });
  jiHits.forEach(k => { score -= 4; minus.push({ type: 'rule', label: '黄历忌', value: k, detail: `当日「忌」中列有「${k}」，与本事件直接相冲` }); });
  if (alm.ji.includes('诸事不宜')) { score -= 6; minus.push({ type: 'rule', label: '黄历忌', value: '诸事不宜', detail: '当日忌项为「诸事不宜」' }); }

  // 2) 值神黄道黑道
  if (alm.tianShenType === '黄道') { score += 2; plus.push({ type: 'rule', label: '值神', value: `${alm.tianShen}（黄道）`, detail: '传统上黄道日视为可行事之日' }); }
  else { score -= 2; minus.push({ type: 'rule', label: '值神', value: `${alm.tianShen}（黑道）`, detail: '传统上黑道日行事需更谨慎' }); }

  // 3) 建除十二值
  const zx = ZHI_XING[alm.zhiXing];
  if (zx) {
    score += zx.tone;
    (zx.tone >= 1 ? plus : zx.tone <= -1 ? minus : plus).push({ type: 'rule', label: '建除', value: `${alm.zhiXing}日`, detail: zx.plain });
  }

  // 4) 二十八宿
  if (alm.xiuLuck === '吉') { score += 1; plus.push({ type: 'rule', label: '星宿', value: `${alm.xiu}宿（吉）`, detail: '二十八宿当值为吉宿' }); }
  else { score -= 1; minus.push({ type: 'rule', label: '星宿', value: `${alm.xiu}宿（凶）`, detail: '二十八宿当值为凶宿' }); }

  // 5) 与用户命局的关系
  if (bazi) {
    const myDayZhi = bazi.pillars[2].zhi;
    const myYearZhi = bazi.pillars[0].zhi;
    if (CHONG[alm.dayZhi] === myDayZhi) { score -= 3; minus.push({ type: 'pillar', label: '冲日柱', value: `${alm.dayZhi} 冲 日支${myDayZhi}`, detail: '当日地支与你的日支相冲，传统上不宜安排本人的大事' }); }
    if (CHONG[alm.dayZhi] === myYearZhi) { score -= 2; minus.push({ type: 'pillar', label: '冲年柱', value: `${alm.dayZhi} 冲 年支${myYearZhi}`, detail: '当日地支与你的年支相冲' }); }

    const dayWx = [GAN_WUXING[alm.dayGan], ZHI_WUXING[alm.dayZhi]];
    const favorHits = dayWx.filter(w => bazi.strength.favor.includes(w));
    favorHits.forEach(w => { score += 2; plus.push({ type: 'wuxing', label: '五行', value: `${alm.dayGZ} 含 ${w}`, detail: `落在日主所喜的 ${bazi.strength.favor.join('、')} 上` }); });

    const ss = shiShen(bazi.dayMaster.gan, alm.dayGan);
    if (ss) plus.push({ type: 'ten_god', label: '日干十神', value: `${alm.dayGan} 为${ss}`, detail: '以你的日主为我推出的十神' });

    if (alm.xunKong.includes(alm.dayZhi)) { score -= 1; minus.push({ type: 'rule', label: '旬空', value: `空亡 ${alm.xunKong.join('、')}`, detail: '当日落空亡，传统上认为力度偏虚' }); }
  }

  const level = jiHits.length
    ? MATCH_LEVELS[3]
    : [...MATCH_LEVELS].filter(l => l.min !== null).reverse().find(l => score >= l.min) || MATCH_LEVELS[0];

  return { score, level, plus, minus, activity: act, yiHits, jiHits };
}

/** 生成候选日期范围 */
export function buildCandidates({ from, to, activityKey, bazi, excluded = [] }) {
  const out = [];
  const cur = new Date(from);
  const end = new Date(to);
  let guard = 0;
  while (cur <= end && guard++ < 400) {
    const alm = almanacOf(new Date(cur));
    const s = scoreDay(alm, activityKey, bazi);
    out.push({ ...alm, ...s, excluded: excluded.includes(alm.iso) });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** 单日的完整解释 */
export function explainDay(day, bazi) {
  return makeInsight({
    title: `${day.iso}（${day.dayGZ}）`,
    summary: day.jiHits.length
      ? `这一天的黄历「忌」里直接写着「${day.jiHits.join('、')}」，正好和你要做的「${day.activity.label}」撞上了。`
      : `按下面列出的规则数下来，这一天和「${day.activity.label}」的${day.level.label}。`,
    note: '这里不评「最吉之日」，只是把匹配上的和相冲的条目数出来。规则都列在下面，可以自己核对。',
    systems: [
      {
        system: 'huangli', label: '黄历怎么看',
        interpretation: `农历${day.lunarText}，干支是${day.dayGZ}。这一天当值的是${day.tianShen}，属${day.tianShenType}（黄道日传统上视为可以做事，黑道日则要更谨慎）。建除十二值轮到「${day.zhiXing}」，二十八宿轮到「${day.xiu}」，算${day.xiuLuck}。当天冲${day.chongDesc}——属这个生肖的人做大事传统上会避开。`,
        evidence: [
          ev('rule', `宜 ${day.yi.slice(0, 8).join(' ')}${day.yi.length > 8 ? ' …' : ''}`, `共 ${day.yi.length} 项`),
          ev('rule', `忌 ${day.ji.slice(0, 8).join(' ')}${day.ji.length > 8 ? ' …' : ''}`, `共 ${day.ji.length} 项`),
          ev('rule', `吉神 ${day.jiShen.slice(0, 5).join(' ')}`, '吉神宜趋'),
          ev('rule', `凶煞 ${day.xiongSha.slice(0, 5).join(' ')}`, '凶煞宜忌'),
          ev('rule', `彭祖百忌`, day.pengZu.join('；'))
        ]
      },
      bazi && {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: `黄历是对所有人一样的，这一层则是拿这一天的干支（${day.dayGZ}）跟你自己的命盘比。你的日主是${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}），${bazi.strength.label}，传统上喜 ${bazi.strength.favor.join('、')}。`,
        evidence: [
          ...day.plus.filter(x => ['wuxing', 'ten_god', 'pillar'].includes(x.type)).map(x => ev(x.type, x.value, x.detail)),
          ...day.minus.filter(x => ['wuxing', 'pillar'].includes(x.type)).map(x => ev(x.type, x.value, x.detail))
        ]
      }
    ]
  });
}
