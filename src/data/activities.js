// 择日事件类型 → 黄历宜忌关键词。keys 为该事件在传统黄历中对应的事项名。
export const ACTIVITIES = [
  { key: 'move',    label: '搬家入宅', yi: ['入宅', '移徙', '安床', '进人口'], ji: ['入宅', '移徙', '安床'], hint: '传统上看「入宅」「移徙」两项。' },
  { key: 'travel',  label: '出行远行', yi: ['出行', '出火'], ji: ['出行'], hint: '看「出行」，兼看当日冲煞方位。' },
  { key: 'open',    label: '开业开市', yi: ['开市', '开业', '立券', '交易', '纳财'], ji: ['开市', '立券', '交易'], hint: '看「开市」「立券交易」「纳财」。' },
  { key: 'project', label: '项目启动', yi: ['开市', '立券', '交易', '出行', '订盟'], ji: ['开市', '立券'], hint: '无对应古法条目，借「开市」「立券」类推。' },
  { key: 'sign',    label: '签约合作', yi: ['立券', '交易', '纳财', '订盟', '纳采'], ji: ['立券', '交易'], hint: '看「立券交易」「订盟」。' },
  { key: 'wedding', label: '婚礼订婚', yi: ['嫁娶', '纳采', '订盟', '会亲友'], ji: ['嫁娶', '纳采'], hint: '看「嫁娶」「纳采订盟」。' },
  { key: 'renovate',label: '装修动土', yi: ['修造', '动土', '拆卸', '作梁', '破土'], ji: ['修造', '动土', '破土'], hint: '看「修造」「动土」。' },
  { key: 'meet',    label: '重要会面', yi: ['会亲友', '出行', '订盟'], ji: ['会亲友', '出行'], hint: '无独立条目，借「会亲友」「出行」类推。' },
  { key: 'study',   label: '入学进修', yi: ['入学', '出行', '祭祀'], ji: ['入学'], hint: '看「入学」。' },
  { key: 'medical', label: '就医手术', yi: ['求医', '疗病', '针灸'], ji: ['求医', '疗病', '针灸'], hint: '看「求医疗病」。仅为传统条目，不构成任何医疗建议。' }
];


/** 用户自由描述 → 对应的黄历条目。对不上时退回「只看当日通用条目」。 */
const KEYWORDS = [
  ['move', ['搬', '入宅', '入住', '乔迁', '租房', '新家']],
  ['travel', ['出行', '出发', '旅行', '旅游', '出差', '远行', '飞', '回家', '返程', '去外地']],
  ['open', ['开业', '开店', '开张', '上线', '发布', '营业']],
  ['project', ['启动', '立项', '开工', '开始做', '第一天', '入职', '上任', '报到']],
  ['sign', ['签', '合同', '合作', '谈判', '交易', '成交', '投资', '融资', '付款', '买房', '买车']],
  ['wedding', ['结婚', '婚礼', '订婚', '领证', '求婚', '提亲', '嫁', '娶']],
  ['renovate', ['装修', '动土', '开挖', '拆', '翻新', '打地基']],
  ['meet', ['见面', '面试', '拜访', '约', '谈话', '表白', '摊牌', '聚会', '相亲', '见家长']],
  ['study', ['入学', '开学', '考试', '报名', '进修', '读书', '答辩']],
  ['medical', ['手术', '看病', '就医', '住院', '体检', '牙', '针灸']]
];
export const GENERIC_ACTIVITY = {
  key: 'generic', label: '这件事', yi: [], ji: [],
  hint: '古法黄历里没有正好对应这件事的条目，下面只按值神、建除、星宿和当天与你命局的关系来数；这件事本身怎么看，交给 DSH。',
  matched: false
};
export function resolveActivity(text = '') {
  const t = String(text).trim();
  if (!t) return { ...GENERIC_ACTIVITY };
  const exact = ACTIVITIES.find(a => a.key === t || a.label === t);
  if (exact) return { ...exact, matched: true };
  for (const [key, words] of KEYWORDS) {
    if (words.some(w => t.includes(w))) {
      const a = ACTIVITIES.find(x => x.key === key);
      return { ...a, label: t.length <= 14 ? t : a.label, mapped: a.label, matched: true };
    }
  }
  return { ...GENERIC_ACTIVITY, label: t.length <= 14 ? t : '这件事' };
}

// 建除十二值
export const ZHI_XING = {
  建: { tone: 0,  plain: '万物生发之始，宜起头不宜收尾' },
  除: { tone: 1,  plain: '除旧布新，适合清理与告别' },
  满: { tone: 0,  plain: '圆满亦近盈溢，宜祭祀不宜求进' },
  平: { tone: 0,  plain: '平常无奇，做日常事无碍' },
  定: { tone: 1,  plain: '安定之日，适合定下来的事' },
  执: { tone: 1,  plain: '执守之日，适合守成与操办' },
  破: { tone: -2, plain: '冲破之日，传统上诸事不宜' },
  危: { tone: -1, plain: '危高之日，宜谨慎不宜冒险' },
  成: { tone: 2,  plain: '成就之日，传统上最宜成事' },
  收: { tone: 0,  plain: '收敛之日，宜收纳不宜开张' },
  开: { tone: 2,  plain: '开通之日，适合开始与开张' },
  闭: { tone: -2, plain: '闭塞之日，宜收藏不宜开展' }
};

export const MATCH_LEVELS = [
  { key: 'few',    label: '匹配项较少', color: 'var(--t3)', min: -99 },
  { key: 'some',   label: '有一些匹配', color: 'var(--azure)', min: 2 },
  { key: 'many',   label: '匹配项较多', color: 'var(--jade)', min: 7 },
  { key: 'avoid',  label: '存在明确相忌项', color: 'var(--cinnabar)', min: null }
];
