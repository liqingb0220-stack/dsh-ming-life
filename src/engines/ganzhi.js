// 干支基础：五行、阴阳、十神推导。
export const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export const GAN_WUXING = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
export const GAN_YIN_YANG = { 甲: 1, 乙: 0, 丙: 1, 丁: 0, 戊: 1, 己: 0, 庚: 1, 辛: 0, 壬: 1, 癸: 0 };

export const ZHI_WUXING = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
export const ZHI_YIN_YANG = { 子: 1, 丑: 0, 寅: 1, 卯: 0, 辰: 1, 巳: 0, 午: 1, 未: 0, 申: 1, 酉: 0, 戌: 1, 亥: 0 };

export const ZHI_ANIMAL = { 子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇', 午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪' };

// 时辰 -> 地支
export function hourToZhi(hour) {
  if (hour >= 23 || hour < 1) return '子';
  return ZHI[Math.floor((hour + 1) / 2) % 12];
}

const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/** 以日主 dayGan 为我，推 target（天干或地支本气）的十神 */
export function shiShen(dayGan, target) {
  const dw = GAN_WUXING[dayGan];
  const dy = GAN_YIN_YANG[dayGan];
  const tw = GAN_WUXING[target] || ZHI_WUXING[target];
  const ty = GAN_YIN_YANG[target] !== undefined ? GAN_YIN_YANG[target] : ZHI_YIN_YANG[target];
  if (!tw) return null;
  const same = dy === ty;
  if (tw === dw) return same ? '比肩' : '劫财';
  if (SHENG[dw] === tw) return same ? '食神' : '伤官';
  if (KE[dw] === tw) return same ? '偏财' : '正财';
  if (KE[tw] === dw) return same ? '七杀' : '正官';
  if (SHENG[tw] === dw) return same ? '偏印' : '正印';
  return null;
}

/** 十神归类：同我/生我 为帮身，其余为耗身 */
export const SUPPORTIVE = ['比肩', '劫财', '偏印', '正印'];
export const DRAINING = ['食神', '伤官', '偏财', '正财', '七杀', '正官'];

export const shengOf = w => SHENG[w];
export const keOf = w => KE[w];

// 地支藏干（本气 / 中气 / 余气）
export const HIDE_GAN = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
};

export const isValidPillar = gz => gz && gz.length === 2 && GAN.includes(gz[0]) && ZHI.includes(gz[1]);
