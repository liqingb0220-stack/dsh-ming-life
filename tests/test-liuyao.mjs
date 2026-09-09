import { PALACE_TABLE, castCoins, buildLiuYao } from '../src/engines/liuyao.js';
import { HEXAGRAMS, HEX_INDEX } from '../src/data/hexagrams.js';
import { trigramByBits } from '../src/data/trigrams.js';

// 1) 八宫表完整性
const keys = Object.keys(PALACE_TABLE);
console.log('八宫表条目数:', keys.length, '(应为 64)');
const seen = new Set();
keys.forEach(k => {
  const bits = k.split('').map(Number);
  const no = HEX_INDEX[trigramByBits(bits.slice(3,6)).key][trigramByBits(bits.slice(0,3)).key];
  seen.add(no);
});
console.log('覆盖卦数:', seen.size);

// 2) 乾宫八卦校验
const qianPalace = keys.filter(k => PALACE_TABLE[k].palace === 'qian');
qianPalace.forEach(k => {
  const bits = k.split('').map(Number);
  const no = HEX_INDEX[trigramByBits(bits.slice(3,6)).key][trigramByBits(bits.slice(0,3)).key];
  const t = PALACE_TABLE[k];
  console.log(` 乾宫 ${t.posLabel}: ${HEXAGRAMS[no].name} 世${t.shiYao} 应${t.yingYao}`);
});

// 3) 起卦
const c = castCoins(20260908);
const g = buildLiuYao({ ...c, dayGan: '丙', dayZhi: '午', question: '测试' });
console.log('\n本卦:', g.ben.name, `(${g.ben.meta.palaceName}宫 ${g.ben.meta.posLabel})`, '变卦:', g.bian ? g.bian.name : '无', '互卦:', g.hu.name);
console.log('动爻:', g.moving.map(i => i+1).join(',') || '无');
g.yao.slice().reverse().forEach(y => {
  console.log(` ${y.pos}爻 ${y.yang?'▬▬▬▬':'▬▬ ▬▬'} ${y.label} ${y.ganZhi}(${y.wuxing}) ${y.liuQin} ${y.liuShen}${y.isShi?' [世]':''}${y.isYing?' [应]':''}${y.moving?' ○动→'+y.changedTo.ganZhi:''}`);
});
console.log('世应关系:', g.shiYingRel.label, g.shiYingRel.desc);
