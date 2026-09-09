import { branchRelations, branchSetRelations, changSheng, xunKong, LIU_CHONG, LIU_HE } from '../src/engines/branches.js';
console.log('子午:', branchRelations('子','午').map(r=>r.label).join(' '), '(应含六冲)');
console.log('子丑:', branchRelations('子','丑').map(r=>r.label).join(' '), '(应含六合)');
console.log('申子:', branchRelations('申','子').map(r=>r.label).join(' '), '(应含半合水局)');
console.log('寅巳:', branchRelations('寅','巳').map(r=>r.label).join(' '), '(应含相刑+六害)');
console.log('寅卯:', branchRelations('寅','卯').map(r=>r.label).join(' '), '(应含春方会)');
console.log('辰辰:', branchRelations('辰','辰').map(r=>r.label).join(' '), '(应为自刑)');

const set = [{pos:'年',zhi:'申'},{pos:'月',zhi:'子'},{pos:'日',zhi:'辰'},{pos:'时',zhi:'午'}];
console.log('\n申子辰午 命局关系:');
branchSetRelations(set).forEach(r => console.log('  ', r.pair, r.label, '|', r.plain));

console.log('\n十二长生:');
[['甲','亥'],['甲','子'],['甲','午'],['乙','午'],['乙','巳'],['丙','寅'],['壬','申'],['癸','卯']].forEach(([g,z])=>{
  const cs = changSheng(g,z);
  console.log(`  ${g}在${z}: ${cs.name}  (${cs.basis})`);
});
console.log('\n空亡: 乙酉日 →', JSON.stringify(xunKong('乙','酉')), '(甲申旬，空午未)');
console.log('空亡: 甲子日 →', JSON.stringify(xunKong('甲','子')), '(甲子旬，空戌亥)');
console.log('空亡: 壬辰日 →', JSON.stringify(xunKong('壬','辰')), '(甲申旬，空午未)');
