/**
 * 全产品统一的判断结构（PRD §17）。
 * 前端默认只显示 summary，展开看 systems，再展开看 evidence。
 */
let seq = 0;
/**
 * 一条判断。
 * summary 是一句话结论；scenes 是让人认领的具体场景；
 * because 解释这个模式从哪来；cost 说它让你付出什么。
 * 只有 summary 是必须的，其余按需给。
 */
export function makeInsight({ id, title, summary, scenes = [], because = '', cost = '', gift = '', advice = '', systems = [], note = '' }) {
  return {
    id: id || `ins_${Date.now().toString(36)}_${seq++}`,
    title,
    summary,
    scenes: scenes.filter(Boolean),
    because,
    cost,
    gift,
    advice,
    confidence_language: 'probabilistic',
    note,
    systems: systems.filter(Boolean)
  };
}

export const SYSTEM_LABEL = {
  bazi: '八字怎么看',
  ziwei: '紫微怎么看',
  liuyao: '六爻怎么看',
  meihua: '梅花怎么看'
};

export const SYSTEM_SHORT = { bazi: '八字', ziwei: '紫微', liuyao: '六爻', meihua: '梅花' };

export const EVIDENCE_LABEL = {
  ten_god: '十神', wuxing: '五行', pillar: '四柱', da_yun: '大运', liu_nian: '流年',
  strength: '日主强弱', star: '星曜', palace: '宫位', mutagen: '四化', decadal: '大限',
  hexagram: '卦象', yao: '爻', ti_yong: '体用', rule: '规则'
};

export function ev(type, value, detail) {
  return { type, label: EVIDENCE_LABEL[type] || type, value, detail };
}

/**
 * 措辞。
 * 早先每条判断都以「在当前命理体系中，这一结构通常被解释为」开头，
 * 又长又重复，读起来像免责声明而不是话。现在把「这只是一种读法」这件事
 * 收进页面级说明与卡片脚注，句子本身只保留一个轻量的不确定语气。
 */
export const HEDGE = {
  common: '',                    // 直接说，不加前缀
  stage: '',
  soft: '看起来',                 // 需要软化时用
  watch: '要留意的是，',
  notFate: '',
  // 卡片脚注用的统一说明
  footnote: '这是命理体系对盘面结构的一种读法，不是预测。'
};

/** 常用的概率化句尾，避免所有句子都长一个样 */
export const TAILS = [
  '——传统上是这么读的。',
  '这是这套体系的读法，未必对得上你的实际感受。',
  '仅供参考。'
];
