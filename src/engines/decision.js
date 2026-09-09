import { Solar } from 'lunar-javascript';
import { castCoins, buildLiuYao, LIUQIN_MEANING } from './liuyao';
import { castByTime, buildMeihua } from './meihua';
import { baziAtYear } from './bazi';
import { ziweiAtYear, locateMutagens } from './ziwei';
import { TEN_GODS } from '../data/tenGods';
import { PALACE_DOMAIN, DOMAINS } from '../data/stars';
import { TENDENCY_META } from '../data/hexagrams';
import { VARIABLE_LIB } from '../data/variables';
import { makeInsight, ev, SYSTEM_LABEL, SYSTEM_SHORT } from './insight';

const CHANGE_GODS = ['七杀', '伤官', '劫财', '偏财'];
const STABLE_GODS = ['正官', '正印', '正财', '比肩', '食神', '偏印'];

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** 八字视角：当前阶段更适合动还是守 */
export function baziView(bazi, gender, year) {
  const { daYun, liuNian } = baziAtYear(bazi, year);
  const gods = [
    daYun && daYun.shiShenGan, daYun && daYun.shiShenZhi,
    liuNian.shiShenGan, liuNian.shiShenZhi
  ].filter(Boolean);
  const change = gods.filter(g => CHANGE_GODS.includes(g)).length;
  const stable = gods.filter(g => STABLE_GODS.includes(g)).length;
  const favorHit = [liuNian.wuxing[0], liuNian.wuxing[1]].filter(w => bazi.strength.favor.includes(w)).length;

  const tendency = change > stable ? '转变' : stable > change ? '守成' : favorHit ? '推进' : '等待';
  const interpretation = `八字看的是你现在所处的大环境。${daYun ? `你正走在 ${daYun.ganZhi} 大运（${daYun.startAge}–${daYun.endAge} 岁），` : ''}${year} 年配的是 ${liuNian.ganZhi}。把这些字和你的日主比对，属于「求变」的有 ${change} 项、属于「求稳」的有 ${stable} 项，所以这个阶段整体偏向${tendency}。${favorHit ? `另外今年的五行里有落在你日主所喜的 ${bazi.strength.favor.join('、')} 上的，传统上算是顺一点的年份。` : `今年的五行没有落在你日主所喜的 ${bazi.strength.favor.join('、')} 上，传统上会说需要多用点力。`}`;

  return {
    system: 'bazi',
    tendency,
    scope: '长期结构与环境节奏',
    interpretation,
    evidence: [
      daYun && ev('da_yun', `${daYun.ganZhi}（${daYun.startAge}–${daYun.endAge} 岁）`, `十神 ${[daYun.shiShenGan, daYun.shiShenZhi].filter(Boolean).join(' / ')}`),
      ev('liu_nian', `${year} 年 ${liuNian.ganZhi}`, `十神 ${[liuNian.shiShenGan, liuNian.shiShenZhi].filter(Boolean).join(' / ')}`),
      ev('strength', `日主${bazi.strength.label}，喜 ${bazi.strength.favor.join('、')}`, bazi.strength.basis),
      ...gods.filter(g => TEN_GODS[g]).slice(0, 2).map(g => ev('ten_god', g, TEN_GODS[g].plain))
    ].filter(Boolean)
  };
}

/** 紫微视角：这一年的重心落在哪个领域 */
export function ziweiView(ziwei, year) {
  if (!ziwei) return null;
  const at = ziweiAtYear(ziwei, year);
  const mutagens = locateMutagens(ziwei, at.yearly.mutagen);
  const ji = mutagens.find(m => m.type === '忌');
  const good = mutagens.filter(m => m.type !== '忌');
  const focusDomain = PALACE_DOMAIN[at.yearly.palaceName];
  const focusLabel = (DOMAINS.find(d => d.key === focusDomain) || {}).label || at.yearly.palaceName;

  const moving = ['迁移', '官禄', '财帛'].includes(at.yearly.palaceName);
  const tendency = ji && ['命宫', '财帛', '官禄'].includes(ji.palace) ? '谨慎' : moving ? '转变' : good.length >= 3 ? '推进' : '协作';

  return {
    system: 'ziwei',
    tendency,
    scope: '这一阶段人生重心的落点',
    interpretation: `紫微看的是这一阶段你人生重心落在哪里。你这十年的大限在${at.decadal.palaceName}宫，${year} 这一年落在${at.yearly.palaceName}宫，也就是说重心偏向「${focusLabel}」这一块。今年还有四颗星被特别标记：${mutagens.map(m => `${m.star}化${m.type}落在${m.palace}`).join('，')}——化禄化权化科是被放大的顺处，化忌是被放大的卡点。`,
    evidence: [
      ev('decadal', `大限 ${at.decadal.ganZhi} · ${at.decadal.palaceName}宫`, `${at.decadal.range.join('–')} 岁`),
      ev('palace', `流年命宫落 ${at.yearly.palaceName}`, `流年 ${at.yearly.ganZhi}`),
      ...mutagens.map(m => ev('mutagen', `${m.star} 化${m.type} 落${m.palace}`, m.meaning.plain))
    ],
    at, mutagens
  };
}

/** 六爻视角：每个选项单独起一卦 */
export function liuyaoView(options, eventId, dayGan, dayZhi) {
  return options.map((opt, i) => {
    const seed = hashSeed(`${eventId}|${opt.id}|${i}`);
    const cast = castCoins(seed);
    const g = buildLiuYao({ ...cast, dayGan, dayZhi, question: opt.name });
    const shi = g.shi;
    const tendency = g.ben.tendency;
    const shiYing = g.shiYingRel;
    return {
      optionId: opt.id,
      optionName: opt.name,
      gua: g,
      tendency,
      interpretation: `就这个选项单独摇了一卦，得到「${g.ben.name}」${g.bian ? `，其中有爻在动，会变成「${g.bian.name}」` : '，六爻都不动，表示形势暂时不会自己改变'}。这一卦讲的是${g.ben.theme}：${g.ben.plain}卦里代表你自己的那一爻在第 ${shi.pos} 位，代表对方或外部条件的那一爻与它的关系是「${shiYing.label}」——${shiYing.desc}。`,
      evidence: [
        ev('hexagram', `本卦 ${g.ben.name}`, `${g.ben.meta.palaceName}宫${g.ben.meta.posLabel} · 倾向${g.ben.tendency}`),
        g.bian && ev('hexagram', `变卦 ${g.bian.name}`, `动爻 ${g.moving.map(i => i + 1).join('、')} · 倾向${g.bian.tendency}`),
        ev('yao', `世爻 ${shi.pos}爻 ${shi.ganZhi}`, `${shi.liuQin} — ${LIUQIN_MEANING[shi.liuQin] || ''}`),
        ev('rule', `世应 ${shiYing.label}`, shiYing.desc)
      ].filter(Boolean)
    };
  });
}

/** 梅花视角：对整件事起一卦，看体用是否相顺 */
export function meihuaView(question, at = new Date()) {
  const cast = castByTime(at);
  const g = buildMeihua(cast, question);
  const tendency = g.totalScore >= 4 ? '推进' : g.totalScore >= 1 ? '协作' : g.totalScore >= -1 ? '等待' : '谨慎';
  return {
    system: 'meihua',
    tendency,
    scope: '你与这件事此刻的匹配度',
    interpretation: `梅花易数是按起卦当下的时间直接成卦，看的是「你」和「这件事」此刻合不合。这次得到「${g.ben.name}」，往后会变成「${g.bian.name}」。卦分两半：代表你的那半是${g.ti.trigram.name}，代表这件事的那半是${g.yong.trigram.name}，两者的关系是${g.tiYong.label}——${g.tiYong.desc}。按事情的开头、中间、结尾三段看，依次是${g.process.start.label}、${g.process.middle.label}、${g.process.end.label}，整体${g.verdict}。`,
    evidence: [
      ev('hexagram', `${g.ben.name} → ${g.bian.name}`, `互卦 ${g.hu.name} · 动爻 ${g.movingLine}`),
      ev('ti_yong', g.tiYong.label, `体${g.ti.trigram.name}(${g.ti.trigram.wuxing}) / 用${g.yong.trigram.name}(${g.yong.trigram.wuxing}) — ${g.tiYong.desc}`),
      ev('rule', '起卦依据', `${cast.text}；${cast.formula.upper}，${cast.formula.lower}，${cast.formula.moving}`)
    ],
    gua: g
  };
}

/** 关键变量：把体系分歧收敛成用户自己的取舍 */
export function extractVariables(event, options, liuyao) {
  const texts = options.map(o => `${o.name} ${o.description || ''}`);
  const scored = VARIABLE_LIB.map(v => {
    const sides = texts.map(t => v.keywords.map(kws => kws.filter(k => t.includes(k)).length));
    // 每个选项在两极上的命中数
    const optionPole = sides.map(([a, b]) => (a === b ? null : a > b ? 0 : 1));
    const distinct = new Set(optionPole.filter(x => x !== null));
    const hitTotal = sides.flat().reduce((a, b) => a + b, 0);
    return { v, optionPole, distinct, hitTotal, discriminating: distinct.size >= 2 };
  });

  let picked = scored.filter(s => s.discriminating).sort((a, b) => b.hitTotal - a.hitTotal);
  if (picked.length < 2) {
    const extra = scored.filter(s => !s.discriminating).sort((a, b) => b.hitTotal - a.hitTotal).slice(0, 3 - picked.length);
    picked = [...picked, ...extra];
  }
  picked = picked.slice(0, 3);

  return picked.map(({ v, optionPole, discriminating }) => {
    const poleOptions = [[], []];
    options.forEach((o, i) => {
      let pole = optionPole[i];
      if (pole === null || pole === undefined) {
        // 关键词无法区分时，用该选项六爻卦的倾向作为落点：偏动的归「新/成长/自由」一极
        const ly = liuyao.find(l => l.optionId === o.id);
        const t = ly ? ly.tendency : null;
        pole = ['转变', '推进'].includes(t) ? 1 : ['守成', '等待', '谨慎'].includes(t) ? 0 : null;
      }
      if (pole === 0 || pole === 1) poleOptions[pole].push(o);
    });
    return {
      id: v.id,
      poles: v.poles,
      hint: v.hint,
      discriminating,
      sides: v.poles.map((p, i) => ({ pole: p, options: poleOptions[i] })),
      statement: poleOptions[0].length && poleOptions[1].length
        ? `如果你更重视「${v.poles[0]}」，${poleOptions[0].map(o => o.name).join('、')} 更符合这一条件；如果更重视「${v.poles[1]}」，${poleOptions[1].map(o => o.name).join('、')} 的结构更贴近。`
        : `这一组取舍在你目前给出的选项描述里还看不出明显分野——把每个选项在「${v.poles[0]}」和「${v.poles[1]}」上的差别写清楚，判断会更有依据。`
    };
  });
}

/**
 * 事件决策主入口。
 */
export function runDecision({ bazi, ziwei, gender, event, options, systems = ['bazi', 'ziwei', 'liuyao', 'meihua'], now = new Date() }) {
  const year = now.getFullYear();
  const lunar = Solar.fromDate(now).getLunar();
  const dayGan = lunar.getDayGan(), dayZhi = lunar.getDayZhi();

  const views = [];
  if (systems.includes('bazi')) views.push(baziView(bazi, gender, year));
  if (systems.includes('ziwei') && ziwei) views.push(ziweiView(ziwei, year));
  const meihua = systems.includes('meihua') ? meihuaView(event.title, now) : null;
  if (meihua) views.push(meihua);
  const liuyao = systems.includes('liuyao') ? liuyaoView(options, event.id, dayGan, dayZhi) : [];

  // 六爻整体倾向：取各选项卦象倾向的分布
  const liuyaoTendencies = liuyao.map(l => l.tendency);

  // ---- 共识 ----
  const allT = [...views.map(v => v.tendency), ...liuyaoTendencies];
  const counts = {};
  allT.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const consensusTendency = ranked[0] && ranked[0][1] >= 2 ? ranked[0][0] : null;

  const consensus = consensusTendency
    ? {
        tendency: consensusTendency,
        meta: TENDENCY_META[consensusTendency],
        text: `这次用了几套互不相干的方法，其中 ${ranked[0][1]} 处都指向「${consensusTendency}」——也就是${TENDENCY_META[consensusTendency].desc}。几套方法各自算出同一个方向，比任何单独一套更值得参考。`,
        sources: [
          ...views.filter(v => v.tendency === consensusTendency).map(v => SYSTEM_SHORT[v.system]),
          ...liuyao.filter(l => l.tendency === consensusTendency).map(l => `六爻·${l.optionName}`)
        ]
      }
    : { tendency: null, text: '这一次几套方法没有指向同一个方向。这本身就是有用的信息：说明这件事没有一个明显更优的答案，最后还是得靠你自己的取舍。', sources: [] };

  // ---- 分歧 ----
  const divergence = [];
  const byTendency = {};
  views.forEach(v => { (byTendency[v.tendency] = byTendency[v.tendency] || []).push(v); });
  if (Object.keys(byTendency).length > 1) {
    divergence.push({
      system: null,
      text: Object.entries(byTendency)
        .map(([t, vs]) => `${vs.map(v => `${SYSTEM_SHORT[v.system]}（它看的是${v.scope}）`).join('、')}指向「${t}」`)
        .join('；') + '。这不是谁对谁错——它们关注的时间尺度和对象本来就不一样，八字看的是几年的大环境，六爻梅花看的是眼下这件事。'
    });
  }
  const uniqLy = [...new Set(liuyaoTendencies)];
  if (uniqLy.length > 1) {
    divergence.push({
      system: 'liuyao',
      text: `六爻给每个选项单独摇了一卦，结果各不相同：${liuyao.map(l => `${l.optionName}是${l.gua.ben.name}，偏${l.tendency}`).join('；')}。这说明它们的区别不在于「哪个更好」，而在于会把你带进性质不同的局面。`
    });
  }
  if (!divergence.length) divergence.push({ system: null, text: '本次各体系的读法基本一致，没有明显对立。' });

  // ---- 需要用户决定的变量 ----
  const variables = extractVariables(event, options, liuyao);

  // ---- 每个选项的汇总视图 ----
  const optionViews = options.map(o => {
    const ly = liuyao.find(l => l.optionId === o.id);
    const inPoles = variables.flatMap(v => v.sides.filter(s => s.options.some(x => x.id === o.id)).map(s => s.pole));
    return {
      option: o,
      liuyao: ly,
      tendency: ly ? ly.tendency : null,
      meta: ly ? TENDENCY_META[ly.tendency] : null,
      poles: [...new Set(inPoles)],
      summary: ly
        ? `这个选项摇出来的卦偏向「${ly.tendency}」。${ly.gua.ben.plain}`
        : '这次没有启用六爻，所以这个选项没有单独的卦。'
    };
  });

  const insight = makeInsight({
    title: event.title,
    summary: consensus.tendency
      ? `综合下来，你现在这个阶段的结构偏向「${consensus.tendency}」。`
      : '几套方法给出的方向不一致，说明这件事的答案不在盘面上，而在你自己的取舍里。',
    note: '这个工作台不会替你选。下面「需要你决定的变量」那一段，才是真正决定结果的东西。',
    systems: [
      ...views.map(v => ({ system: v.system, label: SYSTEM_LABEL[v.system], interpretation: v.interpretation, evidence: v.evidence })),
      liuyao.length && {
        system: 'liuyao', label: SYSTEM_LABEL.liuyao,
        interpretation: liuyao.map(l => `${l.optionName}：${l.gua.ben.name}${l.gua.bian ? `之${l.gua.bian.name}` : ''}（${l.tendency}）`).join('；'),
        evidence: liuyao.flatMap(l => l.evidence.slice(0, 2))
      }
    ].filter(Boolean)
  });

  return {
    year, dayGanZhi: dayGan + dayZhi,
    views, liuyao, meihua,
    consensus, divergence, variables, optionViews, insight,
    systems
  };
}
