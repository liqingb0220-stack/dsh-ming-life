import { Solar } from 'lunar-javascript';
import { TRIGRAM_BY_NUM, trigramByBits, relation } from '../data/trigrams';
import { HEXAGRAMS, HEX_INDEX } from '../data/hexagrams';

const ZHI_ORDER = { 子: 1, 丑: 2, 寅: 3, 卯: 4, 辰: 5, 巳: 6, 午: 7, 未: 8, 申: 9, 酉: 10, 戌: 11, 亥: 12 };

const mod = (n, m) => (((n % m) + m) % m) || m; // 余 0 时取 m

function hexFromBits(bits) {
  const lower = trigramByBits(bits.slice(0, 3));
  const upper = trigramByBits(bits.slice(3, 6));
  const no = HEX_INDEX[upper.key][lower.key];
  return { no, ...HEXAGRAMS[no], upper, lower, bits };
}

const bitsOf = (upper, lower) => [...lower.bits, ...upper.bits];

/** 时间起卦：农历年支数 + 月 + 日 定上卦，加时辰数定下卦，总和取 6 定动爻 */
export function castByTime(dateObj = new Date()) {
  const solar = Solar.fromDate(dateObj);
  const lunar = solar.getLunar();
  const yearZhi = lunar.getYearZhi();
  const yNum = ZHI_ORDER[yearZhi];
  const mNum = Math.abs(lunar.getMonth());
  const dNum = lunar.getDay();
  const hZhi = lunar.getTimeZhi();
  const hNum = ZHI_ORDER[hZhi];

  const upperNum = mod(yNum + mNum + dNum, 8);
  const lowerNum = mod(yNum + mNum + dNum + hNum, 8);
  const movingLine = mod(yNum + mNum + dNum + hNum, 6);

  return {
    method: 'time',
    numbers: { yNum, mNum, dNum, hNum },
    text: `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${hZhi}时`,
    formula: {
      upper: `(年支${yNum} + 月${mNum} + 日${dNum}) ÷ 8 余 ${upperNum}`,
      lower: `(年支${yNum} + 月${mNum} + 日${dNum} + 时${hNum}) ÷ 8 余 ${lowerNum}`,
      moving: `(${yNum}+${mNum}+${dNum}+${hNum}) ÷ 6 余 ${movingLine}`
    },
    upperNum, lowerNum, movingLine
  };
}

/** 数字起卦：两个数分别定上下卦，和取 6 定动爻 */
export function castByNumbers(a, b) {
  const upperNum = mod(a, 8);
  const lowerNum = mod(b, 8);
  const movingLine = mod(a + b, 6);
  return {
    method: 'number',
    numbers: { a, b },
    text: `以数字 ${a} / ${b} 起卦`,
    formula: {
      upper: `${a} ÷ 8 余 ${upperNum}`,
      lower: `${b} ÷ 8 余 ${lowerNum}`,
      moving: `(${a}+${b}) ÷ 6 余 ${movingLine}`
    },
    upperNum, lowerNum, movingLine
  };
}

/** 由起卦结果构建梅花卦象：本卦 / 互卦 / 变卦 + 体用生克 */
export function buildMeihua(cast, question = '') {
  const upper = TRIGRAM_BY_NUM[cast.upperNum];
  const lower = TRIGRAM_BY_NUM[cast.lowerNum];
  const bits = bitsOf(upper, lower);
  const ben = hexFromBits(bits);

  const mi = cast.movingLine - 1; // 0-based
  const changedBits = bits.map((v, i) => (i === mi ? (v ? 0 : 1) : v));
  const bian = hexFromBits(changedBits);
  const hu = hexFromBits([bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]]);

  // 动爻所在之卦为「用」，另一卦为「体」
  const movingInLower = cast.movingLine <= 3;
  const yongTrigram = movingInLower ? lower : upper;
  const tiTrigram = movingInLower ? upper : lower;
  const tiPos = movingInLower ? '上卦' : '下卦';

  // 变卦中体卦保持不变，用卦已变
  const bianYong = movingInLower ? bian.lower : bian.upper;

  const rel = relation(yongTrigram.wuxing, tiTrigram.wuxing); // 用 对 体
  const relHuUpper = relation(hu.upper.wuxing, tiTrigram.wuxing);
  const relHuLower = relation(hu.lower.wuxing, tiTrigram.wuxing);
  const relBian = relation(bianYong.wuxing, tiTrigram.wuxing);

  const scoreOf = r => ({ sheng_in: 2, same: 1, ke_out: 0, sheng_out: -1, ke_in: -2 }[r.key] ?? 0);
  // 用生体=体得生(+2)；体克用=+0；体生用=耗(-1)；用克体=(-2)
  const relForTi = r => {
    // r 为「用对体」的关系，转换成对体的利弊描述
    if (r.key === 'sheng_out') return { key: 'sheng_in', label: '用生体', desc: '外部条件在支持你', score: 2 };
    if (r.key === 'same') return { key: 'same', label: '体用比和', desc: '你与事情的性质一致，阻力小', score: 1 };
    if (r.key === 'ke_in') return { key: 'ke_out', label: '体克用', desc: '你能压住这件事，但要费力', score: 0 };
    if (r.key === 'sheng_in') return { key: 'sheng_out', label: '体生用', desc: '你在持续付出与消耗', score: -1 };
    if (r.key === 'ke_out') return { key: 'ke_in', label: '用克体', desc: '事情反过来压制你', score: -2 };
    return { key: 'none', label: '无明显生克', desc: '', score: 0 };
  };

  const tiYong = relForTi(rel);
  const process = { start: tiYong, middle: relForTi(relHuUpper), end: relForTi(relBian) };
  const totalScore = process.start.score * 2 + process.middle.score + process.end.score * 2;

  return {
    system: 'meihua',
    question,
    cast,
    ben, hu, bian,
    movingLine: cast.movingLine,
    ti: { trigram: tiTrigram, pos: tiPos },
    yong: { trigram: yongTrigram, pos: movingInLower ? '下卦' : '上卦' },
    tiYong,
    process,
    totalScore,
    verdict: totalScore >= 4 ? '结构偏顺' : totalScore >= 1 ? '结构中性偏顺' : totalScore >= -1 ? '结构中性' : totalScore >= -4 ? '结构偏阻' : '结构阻力较大'
  };
}
