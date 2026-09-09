import { buildZiwei, ziweiAtYear, locateMutagens } from '../src/engines/ziwei.js';
const z = buildZiwei({ date: '1990-05-20', time: '14:30', gender: '男' });
console.log('五行局:', z.fiveElementsClass, '命主:', z.soul, '身主:', z.body);
console.log('命宫:', z.soulPalace.name, z.soulPalace.stem + z.soulPalace.branch, '主星:', z.soulMajors.map(s => s.name + (s.brightness || '')).join(' '), '借宫:', z.borrowedFrom);
console.log('身宫:', z.palaces.find(p => p.isBody)?.name);
const y = ziweiAtYear(z, 2026);
console.log('2026 大限:', y.decadal.palaceName, y.decadal.range, y.decadal.ganZhi, '四化:', y.decadal.mutagen);
console.log('2026 流年:', y.yearly.palaceName, y.yearly.ganZhi, '四化:', y.yearly.mutagen);
console.log('流年四化落宫:', JSON.stringify(locateMutagens(z, y.yearly.mutagen), null, 0));
