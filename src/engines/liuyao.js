import { TRIGRAMS, trigramByBits, relation } from '../data/trigrams';
import { HEXAGRAMS, HEX_INDEX } from '../data/hexagrams';
import { ZHI_WUXING, shengOf, keOf } from './ganzhi';

// 京房纳甲：每卦内三爻 / 外三爻的天干与地支（自下而上）
const NAJIA = {
  qian: { inner: { gan: '甲', zhi: ['子', '寅', '辰'] }, outer: { gan: '壬', zhi: ['午', '申', '戌'] } },
  kun:  { inner: { gan: '乙', zhi: ['未', '巳', '卯'] }, outer: { gan: '癸', zhi: ['丑', '亥', '酉'] } },
  zhen: { inner: { gan: '庚', zhi: ['子', '寅', '辰'] }, outer: { gan: '庚', zhi: ['午', '申', '戌'] } },
  xun:  { inner: { gan: '辛', zhi: ['丑', '亥', '酉'] }, outer: { gan: '辛', zhi: ['未', '巳', '卯'] } },
  kan:  { inner: { gan: '戊', zhi: ['寅', '辰', '午'] }, outer: { gan: '戊', zhi: ['申', '戌', '子'] } },
  li:   { inner: { gan: '己', zhi: ['卯', '丑', '亥'] }, outer: { gan: '己', zhi: ['酉', '未', '巳'] } },
  gen:  { inner: { gan: '丙', zhi: ['辰', '午', '申'] }, outer: { gan: '丙', zhi: ['戌', '子', '寅'] } },
  dui:  { inner: { gan: '丁', zhi: ['巳', '卯', '丑'] }, outer: { gan: '丁', zhi: ['亥', '酉', '未'] } }
};

const PALACE_ORDER = ['qian', 'dui', 'li', 'zhen', 'xun', 'kan', 'gen', 'kun'];
const POS_LABEL = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];

/** 生成八宫六十四卦归属表：bits字符串 -> { palace, posLabel, shiYao, yingYao } */
function buildPalaceTable() {
  const table = {};
  PALACE_ORDER.forEach(pk => {
    const t = TRIGRAMS[pk];
    const base = [...t.bits, ...t.bits]; // 自下而上六爻
    const variants = [];
    const flip = (arr, idxs) => { const a = [...arr]; idxs.forEach(i => { a[i] = a[i] ? 0 : 1; }); return a; };
    variants.push({ bits: base, shi: 6 });                          // 本宫
    variants.push({ bits: flip(base, [0]), shi: 1 });               // 一世
    variants.push({ bits: flip(base, [0, 1]), shi: 2 });            // 二世
    variants.push({ bits: flip(base, [0, 1, 2]), shi: 3 });         // 三世
    variants.push({ bits: flip(base, [0, 1, 2, 3]), shi: 4 });      // 四世
    variants.push({ bits: flip(base, [0, 1, 2, 3, 4]), shi: 5 });   // 五世
    const wu = flip(base, [0, 1, 2, 3, 4]);
    const you = flip(wu, [3]);
    variants.push({ bits: you, shi: 4 });                            // 游魂
    const gui = [...t.bits, ...you.slice(3)];
    variants.push({ bits: gui, shi: 3 });                            // 归魂
    variants.forEach((v, i) => {
      table[v.bits.join('')] = {
        palace: pk,
        palaceName: t.name,
        palaceWuxing: t.wuxing,
        posLabel: POS_LABEL[i],
        shiYao: v.shi,
        yingYao: ((v.shi + 2) % 6) + 1
      };
    });
  });
  return table;
}
export const PALACE_TABLE = buildPalaceTable();

/** 六亲：以卦宫五行为「我」 */
function liuQin(palaceWuxing, yaoWuxing) {
  if (palaceWuxing === yaoWuxing) return '兄弟';
  if (shengOf(palaceWuxing) === yaoWuxing) return '子孙';
  if (shengOf(yaoWuxing) === palaceWuxing) return '父母';
  if (keOf(palaceWuxing) === yaoWuxing) return '妻财';
  if (keOf(yaoWuxing) === palaceWuxing) return '官鬼';
  return '—';
}

export const LIUQIN_MEANING = {
  父母: '长辈、文书、房产、庇护与依靠',
  兄弟: '同辈、竞争者、分薄资源的一方',
  子孙: '解忧、福气、下属、作品与产出',
  妻财: '钱财、资源、实际收益',
  官鬼: '压力、责任、职位，也代表麻烦与约束'
};

const LIUSHEN_START = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };
const LIUSHEN = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
export const LIUSHEN_MEANING = {
  青龙: '喜庆、正向、体面', 朱雀: '言语、文书、口舌', 勾陈: '迟滞、田土、牵绊',
  螣蛇: '缠绕、虚惊、反复', 白虎: '强硬、伤损、决断', 玄武: '暗昧、私下、不明'
};

/** 简易可复现随机数 */
function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** 摇卦：三枚铜钱六次。返回 6 个爻值：6老阴 7少阳 8少阴 9老阳 */
export function castCoins(seed) {
  const rng = makeRng(seed ?? (Date.now() ^ (Math.random() * 1e9)) >>> 0);
  const values = [];
  const tosses = [];
  for (let i = 0; i < 6; i++) {
    const coins = [0, 0, 0].map(() => (rng() < 0.5 ? 2 : 3)); // 3=字(阳面) 2=背
    tosses.push(coins);
    values.push(coins.reduce((a, b) => a + b, 0));
  }
  return { values, tosses };
}

function hexFromBits(bits) {
  const lower = trigramByBits(bits.slice(0, 3));
  const upper = trigramByBits(bits.slice(3, 6));
  const no = HEX_INDEX[upper.key][lower.key];
  return { no, ...HEXAGRAMS[no], upper, lower, bits, meta: PALACE_TABLE[bits.join('')] };
}

/** 由卦爻值构建完整六爻卦 */
export function buildLiuYao({ values, dayGan = '甲', dayZhi = '子', question = '' , tosses = null }) {
  const bits = values.map(v => (v === 7 || v === 9 ? 1 : 0));
  const moving = values.map((v, i) => (v === 6 || v === 9 ? i : -1)).filter(i => i >= 0);
  const changedBits = bits.map((b, i) => (moving.includes(i) ? (b ? 0 : 1) : b));

  const ben = hexFromBits(bits);
  const bian = moving.length ? hexFromBits(changedBits) : null;

  const najiaFor = (hex) => {
    const inner = NAJIA[hex.lower.key].inner;
    const outer = NAJIA[hex.upper.key].outer;
    return [
      ...inner.zhi.map(z => ({ gan: inner.gan, zhi: z })),
      ...outer.zhi.map(z => ({ gan: outer.gan, zhi: z }))
    ];
  };

  const benNajia = najiaFor(ben);
  const bianNajia = bian ? najiaFor(bian) : null;
  const shenStart = LIUSHEN_START[dayGan] ?? 0;

  const yao = values.map((v, i) => {
    const nj = benNajia[i];
    const wx = ZHI_WUXING[nj.zhi];
    return {
      index: i,
      pos: i + 1,
      value: v,
      yang: bits[i] === 1,
      moving: moving.includes(i),
      label: v === 6 ? '老阴' : v === 7 ? '少阳' : v === 8 ? '少阴' : '老阳',
      ganZhi: nj.gan + nj.zhi,
      zhi: nj.zhi,
      wuxing: wx,
      liuQin: liuQin(ben.meta.palaceWuxing, wx),
      liuShen: LIUSHEN[(shenStart + i) % 6],
      isShi: ben.meta.shiYao === i + 1,
      isYing: ben.meta.yingYao === i + 1,
      changedTo: bianNajia ? { ganZhi: bianNajia[i].gan + bianNajia[i].zhi, wuxing: ZHI_WUXING[bianNajia[i].zhi], liuQin: liuQin(ben.meta.palaceWuxing, ZHI_WUXING[bianNajia[i].zhi]) } : null
    };
  });

  const shi = yao.find(y => y.isShi);
  const ying = yao.find(y => y.isYing);
  const shiYingRel = relation(shi.wuxing, ying.wuxing);

  // 互卦（2-4 为下，3-5 为上）
  const huBits = [bits[1], bits[2], bits[3], bits[2], bits[3], bits[4]];
  const hu = hexFromBits(huBits);

  return {
    system: 'liuyao',
    question,
    dayGanZhi: dayGan + dayZhi,
    values,
    tosses,
    ben,
    bian,
    hu,
    yao,
    moving,
    shi,
    ying,
    shiYingRel
  };
}
