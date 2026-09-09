// 八卦基础数据。bits 为自下而上的三爻，1 阳 0 阴。
export const TRIGRAMS = {
  qian: { key: 'qian', name: '乾', symbol: '☰', nature: '天', wuxing: '金', bits: [1, 1, 1], num: 1, trait: '刚健、主动、开创' },
  dui:  { key: 'dui',  name: '兑', symbol: '☱', nature: '泽', wuxing: '金', bits: [1, 1, 0], num: 2, trait: '喜悦、沟通、口舌' },
  li:   { key: 'li',   name: '离', symbol: '☲', nature: '火', wuxing: '火', bits: [1, 0, 1], num: 3, trait: '明亮、外显、依附' },
  zhen: { key: 'zhen', name: '震', symbol: '☳', nature: '雷', wuxing: '木', bits: [1, 0, 0], num: 4, trait: '震动、行动、突发' },
  xun:  { key: 'xun',  name: '巽', symbol: '☴', nature: '风', wuxing: '木', bits: [0, 1, 1], num: 5, trait: '渗透、柔顺、反复' },
  kan:  { key: 'kan',  name: '坎', symbol: '☵', nature: '水', wuxing: '水', bits: [0, 1, 0], num: 6, trait: '险陷、流动、智谋' },
  gen:  { key: 'gen',  name: '艮', symbol: '☶', nature: '山', wuxing: '土', bits: [0, 0, 1], num: 7, trait: '停止、稳固、阻隔' },
  kun:  { key: 'kun',  name: '坤', symbol: '☷', nature: '地', wuxing: '土', bits: [0, 0, 0], num: 8, trait: '承载、包容、积累' }
};

export const TRIGRAM_LIST = Object.values(TRIGRAMS);

// 先天八卦数 -> 卦，用于梅花易数起卦
export const TRIGRAM_BY_NUM = {};
TRIGRAM_LIST.forEach(t => { TRIGRAM_BY_NUM[t.num] = t; });

const BITS_INDEX = {};
TRIGRAM_LIST.forEach(t => { BITS_INDEX[t.bits.join('')] = t; });
export const trigramByBits = bits => BITS_INDEX[bits.join('')];

// 五行生克
export const WUXING = ['木', '火', '土', '金', '水'];
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

export const shengOf = w => SHENG[w];
export const keOf = w => KE[w];

/** a 对 b 的关系：同 / 生出 / 被生 / 克出 / 被克 */
export function relation(a, b) {
  if (a === b) return { key: 'same', label: '比和', desc: '力量同类，彼此增强' };
  if (SHENG[a] === b) return { key: 'sheng_out', label: '我生', desc: '付出、消耗自身以成就对方' };
  if (SHENG[b] === a) return { key: 'sheng_in', label: '生我', desc: '得到支持与资源' };
  if (KE[a] === b) return { key: 'ke_out', label: '我克', desc: '掌控局面，但需耗力' };
  if (KE[b] === a) return { key: 'ke_in', label: '克我', desc: '受到压制或外部约束' };
  return { key: 'none', label: '无明显关系', desc: '' };
}
