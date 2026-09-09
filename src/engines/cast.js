/** 为一个问题起卦，并把卦象压成 DSH 能读的事实文本。工作台只起卦、不解卦。 */
import { castCoins, buildLiuYao } from './liuyao';
import { castByTime, buildMeihua } from './meihua';
import { almanacOf } from './almanac';

export function liuyaoFacts(g, dayGZ) {
  return [
    `本卦 ${g.ben.name}（${g.ben.meta.palaceName}宫${g.ben.meta.posLabel}，倾向${g.ben.tendency}）`,
    g.bian ? `动爻第 ${g.moving.map(i => i + 1).join('、')} 爻，变卦 ${g.bian.name}（倾向${g.bian.tendency}）` : '六爻皆静，无动爻',
    `世爻第 ${g.shi.pos} 爻 ${g.shi.ganZhi}·${g.shi.liuQin}，应爻第 ${g.ying.pos} 爻 ${g.ying.ganZhi}·${g.ying.liuQin}，世应${g.shiYingRel.label}`,
    `互卦 ${g.hu.name}`,
    g.moving.length ? `动爻六神：${g.moving.map(i => `${i + 1}爻${g.yao[i].liuShen}`).join('、')}` : '',
    `六爻纳甲：${g.yao.map((y, i) => `${i + 1}爻${y.ganZhi}${y.liuQin}${y.isShi ? '(世)' : y.isYing ? '(应)' : ''}`).join(' ')}`,
    dayGZ ? `起卦日 ${dayGZ}` : ''
  ].filter(Boolean).join('；');
}

export function meihuaFacts(g) {
  return [
    `本卦 ${g.ben.name} → 互卦 ${g.hu.name} → 变卦 ${g.bian.name}，动爻第 ${g.movingLine} 爻`,
    `体卦 ${g.ti.trigram.name}（${g.ti.trigram.wuxing}），用卦 ${g.yong.trigram.name}（${g.yong.trigram.wuxing}），${g.tiYong.label}`,
    g.cast?.text ? `起卦依据：${g.cast.text}` : ''
  ].filter(Boolean).join('；');
}

export function castForQuestion(question, at = new Date()) {
  const alm = almanacOf(at);
  const coins = castCoins(Math.floor(Math.random() * 2147483647));
  const g = buildLiuYao({ ...coins, dayGan: alm.dayGan, dayZhi: alm.dayZhi, question });
  const m = buildMeihua(castByTime(at), question);
  return {
    at: at.toISOString(),
    liuyao: { text: liuyaoFacts(g, alm.dayGZ), gua: g },
    meihua: { text: meihuaFacts(m), gua: m }
  };
}
