import { shengOf, keOf } from './trigrams';

export const WX_COLOR = { 木: 'var(--wx-mu)', 火: 'var(--wx-huo)', 土: 'var(--wx-tu)', 金: 'var(--wx-jin)', 水: 'var(--wx-shui)' };

/** 十神按它相对日主的五行上色：比劫=日主本行，食伤=我生，财=我克，官杀=克我，印=生我 */
export function tenGodWuxing(god, dayWuxing) {
  if (['比肩', '劫财'].includes(god)) return dayWuxing;
  if (['食神', '伤官'].includes(god)) return shengOf(dayWuxing);
  if (['正财', '偏财'].includes(god)) return keOf(dayWuxing);
  if (['正官', '七杀'].includes(god)) return ['木', '火', '土', '金', '水'].find(w => keOf(w) === dayWuxing);
  if (['正印', '偏印'].includes(god)) return ['木', '火', '土', '金', '水'].find(w => shengOf(w) === dayWuxing);
  return null;
}
export const tenGodColor = (god, dayWuxing) => WX_COLOR[tenGodWuxing(god, dayWuxing)] || 'var(--gold)';
