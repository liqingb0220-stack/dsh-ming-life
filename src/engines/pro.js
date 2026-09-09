/** 八字 / 紫微专业盘的附加信息（PRD §20）。 */
import { branchSetRelations, changSheng, xunKong, CS_MEANING } from './branches';
import { shiShen, GAN_WUXING, ZHI_WUXING, HIDE_GAN } from './ganzhi';
import { MAJOR_STARS, MUTAGEN } from '../data/stars';

/** 八字专业视图：藏干十神全展开、地支关系、十二长生、空亡 */
export function baziPro(bazi) {
  const dayGan = bazi.dayMaster.gan;
  const dayZhi = bazi.pillars[2].zhi;

  const pillars = bazi.pillars.map(p => {
    const hide = p.hide.length ? p.hide : (HIDE_GAN[p.zhi] || []);
    return {
      ...p,
      hideDetail: hide.map((g, i) => ({
        gan: g,
        wuxing: GAN_WUXING[g],
        shiShen: shiShen(dayGan, g),
        weightLabel: ['本气', '中气', '余气'][i] || '余气'
      })),
      changSheng: changSheng(dayGan, p.zhi),
      selfChangSheng: changSheng(p.gan, p.zhi)
    };
  });

  const kong = xunKong(dayGan, dayZhi);
  const relations = branchSetRelations(bazi.pillars.map(p => ({ pos: p.pos, zhi: p.zhi })));

  const kongPillars = bazi.pillars.filter(p => kong.kong.includes(p.zhi)).map(p => p.pos);

  return {
    pillars,
    xunKong: { ...kong, pillars: kongPillars },
    relations,
    dayMasterCS: pillars.map(p => ({ pos: p.pos, zhi: p.zhi, ...p.changSheng })),
    csMeaning: CS_MEANING,
    notes: [
      relations.length
        ? `命局地支之间存在 ${relations.length} 组关系：${relations.map(r => `${r.pair}${r.label}`).join('、')}。`
        : '四个地支之间没有构成传统的合冲刑害关系。',
      kongPillars.length
        ? `空亡为 ${kong.kong.join('、')}（${kong.xunShou}旬），落在${kongPillars.join('、')}柱上。`
        : `空亡为 ${kong.kong.join('、')}（${kong.xunShou}旬），命局四支都不落空。`,
      `日主 ${dayGan} 在四支上的十二长生依次为：${pillars.map(p => `${p.pos}支${p.zhi}${p.changSheng.name}`).join('，')}。`
    ]
  };
}

/** 紫微专业视图：三方四正、宫干自化 */
export function ziweiPro(ziwei, focusPalaceName = '命宫') {
  const idx = ziwei.palaces.findIndex(p => p.name === focusPalaceName);
  if (idx < 0) return null;
  const at = i => ziwei.palaces[((i % 12) + 12) % 12];

  // 三方四正：本宫 + 对宫(+6) + 三合宫(+4, +8)
  const trine = {
    self: at(idx),
    opposite: at(idx + 6),
    trine1: at(idx + 4),
    trine2: at(idx + 8)
  };
  const labels = { self: '本宫', opposite: '对宫（迁移位）', trine1: '三合宫', trine2: '三合宫' };

  const stars = Object.entries(trine).flatMap(([k, p]) =>
    p.majorStars.filter(s => MAJOR_STARS[s.name]).map(s => ({ ...s, palace: p.name, role: labels[k] }))
  );

  const mutagens = ziwei.palaces.flatMap(p =>
    [...p.majorStars, ...p.minorStars]
      .filter(s => s.mutagen)
      .map(s => ({ star: s.name, type: s.mutagen, palace: p.name, meaning: MUTAGEN[s.mutagen] }))
  );

  return {
    focus: focusPalaceName,
    trine: Object.entries(trine).map(([k, p]) => ({ role: labels[k], palace: p })),
    stars,
    mutagens,
    notes: [
      `${focusPalaceName}的三方四正为：${trine.self.name}（${trine.self.stem}${trine.self.branch}）、${trine.opposite.name}、${trine.trine1.name}、${trine.trine2.name}。传统上看一个宫，要连着这四个宫一起看。`,
      stars.length
        ? `四宫合计见主星 ${stars.map(s => `${s.name}(${s.palace})`).join('、')}。`
        : '四宫皆无主星，这一组的力量偏弱，需借对宫与本命格局论。',
      mutagens.length
        ? `生年四化：${mutagens.map(m => `${m.star}化${m.type}在${m.palace}`).join('，')}。`
        : '本命盘未见生年四化。'
    ]
  };
}
