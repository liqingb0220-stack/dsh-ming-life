import { bearing, distanceKm, directionOf, compareLocations } from '../src/engines/location.js';
import { buildBazi } from '../src/engines/bazi.js';
import { buildZiwei } from '../src/engines/ziwei.js';
import { CITIES } from '../src/data/cities.js';
const c = n => CITIES.find(x => x.name === n);
console.log('上海→北京 方位:', directionOf(bearing(c('上海'), c('北京'))).name, bearing(c('上海'), c('北京')).toFixed(0)+'°', distanceKm(c('上海'), c('北京'))+'km （应为西北或正北）');
console.log('上海→深圳:', directionOf(bearing(c('上海'), c('深圳'))).name, distanceKm(c('上海'), c('深圳'))+'km （应偏西南）');
console.log('上海→东京:', directionOf(bearing(c('上海'), c('东京'))).name, distanceKm(c('上海'), c('东京'))+'km （应偏东/东北）');
console.log('北京→新加坡:', directionOf(bearing(c('北京'), c('新加坡'))).name, distanceKm(c('北京'), c('新加坡'))+'km （应偏南）');
const b = buildBazi({ date: '1990-05-20', time: '14:30', gender: '男' });
const z = buildZiwei({ date: '1990-05-20', time: '14:30', gender: '男' });
const r = compareLocations({
  origin: c('上海'),
  places: [
    { id: 'p1', ...c('深圳'), factors: { cost: 2, opportunity: 5, relation: 2, climate: 4, familiar: 2 } },
    { id: 'p2', ...c('杭州'), factors: { cost: 4, opportunity: 3, relation: 5, climate: 4, familiar: 5 } },
    { id: 'p3', ...c('新加坡'), factors: { cost: 2, opportunity: 4, relation: 1, climate: 3, familiar: 1 } }
  ],
  bazi: b, ziwei: z, gender: '男'
});
console.log('\n' + r.summaryText);
console.log(r.conflictText);
r.views.forEach(v => console.log(` ${v.place.name}: ${v.direction.name}${v.bearing}° ${v.distance}km ${v.trigram.name}位(${v.trigram.wuxing}) 喜用:${v.isFavor} 现实分:${v.realScore} 卦:${v.gua.ben.name} ${v.tendency}`));
console.log('\n证据示例:', r.views[0].insight.systems.map(s => s.evidence.length + '条').join(' / '));
