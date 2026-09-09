/**
 * 解读的组织与措辞。
 *
 * 参照成熟命理产品的说话方式，与早先那版克制的编辑腔有几处刻意的不同：
 *  1. 长句铺陈，一口气把相关的几点连起来说，而不是一句一断；
 *  2. 描述**行为序列**（「嘴上说不想做，拖到最后一刻才动，但真动起来效率很高」），
 *     而不是贴标签（「行动力偏高」）；
 *  3. 缺点用「不过若是发挥过头…」包住，不下断言；
 *  4. 用「往往、通常、可能、容易」软化，允许读者不认领；
 *  5. 该口语的地方就口语。
 */
import { TEN_GODS_FULL } from '../data/readings';

/** 软化词。同一个位置轮换用词，避免整篇都是「往往」。 */
const HEDGES = ['往往', '通常', '多半', '一般来说', '很多时候'];
export const hedge = i => HEDGES[i % HEDGES.length];

/** 把若干短句连成一句自然的长句 */
export function weave(parts) {
  return parts.filter(Boolean).join('')
    .replace(/。。/g, '。')
    .replace(/，，/g, '，')
    .replace(/里里/g, '里');
}

/** 去掉释义开头的「「七杀」是…」「「偏财」代表…」，避免和上文的十神名重复 */
export const stripLead = t => (t || '').replace(/^「[^」]*」(是|代表|指的是|指)/, '');

/**
 * 一个十神的完整段落。
 * 顺序：是什么样 → 具体到工作 → 具体到人际 → 过头会怎样
 */
export function godParagraph(god, { withWork = true, withSocial = true, withExcess = true, idx = 0 } = {}) {
  const g = TEN_GODS_FULL[god];
  if (!g) return null;
  return {
    title: `${god}有分量`,
    text: weave([
      g.headline.replace(/。$/, '') + '——' + g.because.replace(/^「[^」]*」是/, '它是'),
      withWork ? g.work : '',
      withSocial ? `人际上，${g.social.join('')}` : '',
      withExcess ? g.excess : ''
    ])
  };
}

/**
 * 缺失的段落。这是很多人真正想不通的部分——
 * 「为什么我在某种环境里就是不舒服」，答案常常在缺的那一格里。
 */
export function absentParagraph(god) {
  const g = TEN_GODS_FULL[god];
  if (!g) return null;
  return {
    title: `${god}缺失`,
    text: g.absent
  };
}

/** 生扶／制约两种状态。同一个十神，处境不同表现完全不同。 */
export function stateParagraphs(god) {
  const g = TEN_GODS_FULL[god];
  if (!g) return [];
  return [
    { title: '顺的时候', text: g.supported },
    { title: '不顺的时候', text: g.restricted }
  ];
}

/** 行动建议。要具体到能照着做，不能是「保持平常心」这种。 */
export function adviceOf(gods) {
  return gods.map(g => TEN_GODS_FULL[g]?.advice).filter(Boolean);
}

/**
 * 人生阶段。大运解读要按年龄换语境——
 * 十几岁讲同学和课堂，三十几岁讲职场和家庭，讲错了就完全没有代入感。
 */
export const LIFE_STAGES = [
  { max: 12, key: 'child', label: '童年',
    context: { 场合: '学校和家里', 同伴: '同学', 权威: '老师和父母', 主线: '学习和玩' } },
  { max: 22, key: 'youth', label: '求学期',
    context: { 场合: '校园', 同伴: '同学和室友', 权威: '老师', 主线: '学业、社团和第一批真正的朋友' } },
  { max: 30, key: 'early', label: '立业期',
    context: { 场合: '职场', 同伴: '同事', 权威: '上级', 主线: '站稳脚跟、攒本事、也开始考虑长期关系' } },
  { max: 40, key: 'mid', label: '负重期',
    context: { 场合: '职场和家庭之间', 同伴: '同事与合作方', 权威: '你自己也开始是别人的权威', 主线: '责任变重，选择的成本变高' } },
  { max: 55, key: 'peak', label: '当家期',
    context: { 场合: '你说了算的地方', 同伴: '下属与同行', 权威: '你自己', 主线: '守住已有的，同时决定还要不要开新的' } },
  { max: 200, key: 'late', label: '收成期',
    context: { 场合: '家里和你的圈子', 同伴: '老友与后辈', 权威: '不再有人管你', 主线: '把攒下的东西安顿好' } }
];

export const stageOf = age => LIFE_STAGES.find(s => age <= s.max) || LIFE_STAGES[LIFE_STAGES.length - 1];
