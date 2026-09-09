// 地支之间的关系与十二长生。合盘与专业盘共用。
import { ZHI, ZHI_WUXING, GAN_WUXING, GAN_YIN_YANG } from './ganzhi';

export const LIU_CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
export const LIU_HE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
export const LIU_HE_WUXING = { '子丑': '土', '寅亥': '木', '卯戌': '火', '辰酉': '金', '巳申': '水', '午未': '土' };
export const LIU_HAI = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };

export const SAN_HE = [
  { zhis: ['申', '子', '辰'], wuxing: '水' },
  { zhis: ['亥', '卯', '未'], wuxing: '木' },
  { zhis: ['寅', '午', '戌'], wuxing: '火' },
  { zhis: ['巳', '酉', '丑'], wuxing: '金' }
];
export const SAN_HUI = [
  { zhis: ['寅', '卯', '辰'], wuxing: '木', season: '春' },
  { zhis: ['巳', '午', '未'], wuxing: '火', season: '夏' },
  { zhis: ['申', '酉', '戌'], wuxing: '金', season: '秋' },
  { zhis: ['亥', '子', '丑'], wuxing: '水', season: '冬' }
];
const XING_GROUPS = [
  { zhis: ['寅', '巳', '申'], name: '无恩之刑' },
  { zhis: ['丑', '戌', '未'], name: '恃势之刑' },
  { zhis: ['子', '卯'], name: '无礼之刑' }
];
const ZI_XING = ['辰', '午', '酉', '亥'];

/** 两个地支之间的关系（可能同时成立多条） */
export function branchRelations(a, b) {
  const out = [];
  if (LIU_CHONG[a] === b) out.push({ key: 'chong', label: '六冲', plain: '互相冲动，容易在同一件事上意见相反', tone: -2 });
  if (LIU_HE[a] === b) out.push({ key: 'he', label: '六合', plain: `彼此拉近、容易黏在一起（合化${LIU_HE_WUXING[[a, b].sort().join('') in LIU_HE_WUXING ? [a, b].sort().join('') : Object.keys(LIU_HE_WUXING).find(k => k.includes(a) && k.includes(b))] || ''}）`, tone: 2 });
  if (LIU_HAI[a] === b) out.push({ key: 'hai', label: '六害', plain: '好意容易被误解，摩擦来自细节', tone: -1 });
  SAN_HE.forEach(g => { if (g.zhis.includes(a) && g.zhis.includes(b) && a !== b) out.push({ key: 'sanhe', label: `半合${g.wuxing}局`, plain: `同属${g.zhis.join('')}三合，做同一类事时容易协同`, tone: 2 }); });
  SAN_HUI.forEach(g => { if (g.zhis.includes(a) && g.zhis.includes(b) && a !== b) out.push({ key: 'sanhui', label: `${g.season}方会`, plain: `同属${g.season}方${g.zhis.join('')}，气质方向接近`, tone: 1 }); });
  XING_GROUPS.forEach(g => { if (g.zhis.includes(a) && g.zhis.includes(b) && a !== b) out.push({ key: 'xing', label: `相刑（${g.name}）`, plain: '亲近之后反而容易互相消耗', tone: -2 }); });
  if (a === b && ZI_XING.includes(a)) out.push({ key: 'zixing', label: '自刑', plain: '同一种性格特征在两人身上被放大', tone: -1 });
  if (a === b && !ZI_XING.includes(a)) out.push({ key: 'same', label: '同支', plain: '性格底色接近，好处与短板也接近', tone: 1 });
  return out;
}

/** 一组地支内部的所有关系（用于命局本身的专业盘） */
export function branchSetRelations(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      branchRelations(list[i].zhi, list[j].zhi)
        .filter(r => r.key !== 'same')
        .forEach(r => out.push({ ...r, between: [list[i], list[j]], pair: `${list[i].zhi}${list[j].zhi}` }));
    }
  }
  // 三合 / 三会成局
  const zhis = list.map(x => x.zhi);
  SAN_HE.forEach(g => { if (g.zhis.every(z => zhis.includes(z))) out.push({ key: 'sanhe_full', label: `三合${g.wuxing}局`, plain: `${g.zhis.join('')}三支齐全，${g.wuxing}的力量在命局中被显著加强`, tone: 3, pair: g.zhis.join('') }); });
  SAN_HUI.forEach(g => { if (g.zhis.every(z => zhis.includes(z))) out.push({ key: 'sanhui_full', label: `${g.season}方会局`, plain: `${g.zhis.join('')}三支齐全，整体气质强烈偏向${g.wuxing}`, tone: 3, pair: g.zhis.join('') }); });
  return out;
}

// ---- 十二长生 ----
export const CHANG_SHENG = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
const CS_START = { 甲: '亥', 丙: '寅', 戊: '寅', 庚: '巳', 壬: '申', 乙: '午', 丁: '酉', 己: '酉', 辛: '子', 癸: '卯' };

export const CS_MEANING = {
  长生: '起步、萌发，力量刚开始积累',
  沐浴: '不稳定、易变，处在试错阶段',
  冠带: '初具规模，开始能拿得出手',
  临官: '正当其位，做事最顺手的阶段',
  帝旺: '力量最盛，也最容易过头',
  衰: '势头开始回落，宜守不宜进',
  病: '力量受损，容易力不从心',
  死: '停滞，旧的方式走到尽头',
  墓: '收藏、沉淀，东西被存起来',
  绝: '断裂，与过去彻底脱开',
  胎: '重新孕育，还看不出形状',
  养: '休养待发，准备下一轮'
};

/** 天干在某地支上的十二长生位。阳干顺行，阴干逆行。 */
export function changSheng(gan, zhi) {
  const start = CS_START[gan];
  if (!start) return null;
  const si = ZHI.indexOf(start), zi = ZHI.indexOf(zhi);
  const yang = GAN_YIN_YANG[gan] === 1;
  const step = yang ? (zi - si + 12) % 12 : (si - zi + 12) % 12;
  const name = CHANG_SHENG[step];
  return { name, meaning: CS_MEANING[name], basis: `${gan}${yang ? '为阳干，顺行' : '为阴干，逆行'}，长生在${start}，${zhi}为第 ${step + 1} 位` };
}

/** 空亡：由日柱旬推出 */
export function xunKong(dayGan, dayZhi) {
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const gi = GAN.indexOf(dayGan), zi = ZHI.indexOf(dayZhi);
  const offset = (zi - gi + 12) % 12;   // 旬首地支索引
  const k1 = ZHI[(offset + 10) % 12], k2 = ZHI[(offset + 11) % 12];
  return { kong: [k1, k2], xunShou: `${GAN[0]}${ZHI[offset]}` };
}
