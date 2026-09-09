/**
 * 十神分布判定。
 * 重点是把「命里缺什么」也算出来——缺失和旺盛一样是信息，
 * 而且缺失往往更能解释一个人为什么在某类环境里格外不舒服。
 */

/** 十神占比。以总权重为分母，缺失的显式列为 0。 */
export function tenGodShares(bazi) {
  const ALL = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];
  const total = bazi.tenGods.reduce((a, t) => a + t.weight, 0) || 1;
  return ALL.map(god => {
    const hit = bazi.tenGods.find(t => t.god === god);
    const pct = hit ? +(hit.weight / total * 100).toFixed(0) : 0;
    return { god, weight: hit ? hit.weight : 0, pct };
  });
}

/**
 * 分布判定。
 * 旺：占比 ≥ 18%；缺失：完全没有；偏少：0 < 占比 < 6%
 */
export function analyzeDistribution(bazi) {
  const shares = tenGodShares(bazi);
  const strong = shares.filter(s => s.pct >= 18).sort((a, b) => b.pct - a.pct);
  const absent = shares.filter(s => s.pct === 0);
  const scarce = shares.filter(s => s.pct > 0 && s.pct < 6);
  // 月令十神最重，传统上称「当令」
  const monthGod = bazi.pillars[1].ssGan;
  const monthZhiGods = Array.isArray(bazi.pillars[1].ssZhi) ? bazi.pillars[1].ssZhi.filter(Boolean) : [bazi.pillars[1].ssZhi].filter(Boolean);
  return { shares, strong, absent, scarce, monthGod, monthZhiGod: monthZhiGods[0] || null };
}

/**
 * 格局名。给用户一个能说出口的标签。
 * 判定条件写在 basis 里，界面上可以核对——不是随便安一个好听的名字。
 */
/** 一句话总述，仿「身强比肩偏财当令，自我意识强、商业嗅觉灵」那种写法 */
export function summarize(bazi, distribution) {
  const d = distribution || analyzeDistribution(bazi);
  const top2 = d.shares.slice().sort((a, b) => b.pct - a.pct).slice(0, 2).filter(s => s.pct > 0);
  const traits = top2.map(s => TRAIT_WORD[s.god]).filter(Boolean);
  return {
    text: `日主${bazi.strength.label}，${top2.map(s => s.god).join('')}分量最重，${traits.join('、')}。`,
    traits
  };
}

export const TRAIT_WORD = {
  比肩: '自我意识强', 劫财: '争取心强', 食神: '有创造欲', 伤官: '锋芒外露',
  偏财: '商业嗅觉灵', 正财: '务实肯攒', 七杀: '抗压能冲', 正官: '重规矩讲责任',
  偏印: '思路独特', 正印: '求稳好学'
};
