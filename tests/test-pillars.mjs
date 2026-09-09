import { buildBaziFromPillars } from '../src/engines/bazi.js';
import { buildPortrait } from '../src/engines/portrait.js';
const b = buildBaziFromPillars({ year: '庚午', month: '辛巳', day: '乙酉', hour: '癸未', gender: '男' });
console.log('四柱:', b.pillars.map(p => p.gan + p.zhi).join(' '), '| 日主', b.dayMaster.gan, b.strength.label, b.strength.score);
console.log('五行%:', JSON.stringify(b.wuxingPct));
console.log('十神:', b.tenGods.slice(0,5).map(t => t.god + ':' + t.weight).join(' '));
const p = buildPortrait(b, null);
console.log('画像(仅八字):', p.dimensions.map(d => d.label + d.score).join(' '));
console.log('主题数:', p.themes.length, '| 第一条:', p.themes[0].summary.slice(0, 50));
