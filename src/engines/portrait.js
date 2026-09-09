import { DIMENSIONS, TEN_GODS } from '../data/tenGods';
import { MAJOR_STARS } from '../data/stars';
import { TEN_GOD_SCENES, STAR_SCENES, TENSION_SCENES, STRENGTH_SCENES } from '../data/scenes';
import { TEN_GODS_FULL } from '../data/readings';
import { analyzeDistribution, summarize } from './distribution';
import { godParagraph, absentParagraph, stateParagraphs, hedge, weave, stripLead } from './compose';
import { makeInsight, ev, SYSTEM_LABEL } from './insight';

const K = 25;

function scoreFrom(items) {
  // items: [{ key, share, w }]
  const out = {};
  DIMENSIONS.forEach(d => {
    const raw = items.reduce((acc, it) => acc + it.share * (it.w[d.key] || 0), 0);
    out[d.key] = Math.max(2, Math.min(98, Math.round(50 + raw * K)));
  });
  return out;
}

/** 八字侧的维度贡献 */
function baziItems(bazi) {
  const total = bazi.tenGods.reduce((a, t) => a + t.weight, 0) || 1;
  return bazi.tenGods
    .filter(t => TEN_GODS[t.god])
    .map(t => ({ key: t.god, share: t.weight / total, w: TEN_GODS[t.god].w, weight: t.weight }));
}

/** 紫微侧的维度贡献：命宫主星权重最高，身宫、福德次之 */
function ziweiItems(ziwei) {
  const picks = [];
  const push = (palaceName, factor) => {
    const p = ziwei.palaces.find(x => x.name === palaceName);
    if (!p) return;
    p.majorStars.filter(s => MAJOR_STARS[s.name]).forEach(s => picks.push({ key: s.name, palace: palaceName, factor, star: s }));
  };
  ziwei.soulMajors.forEach(s => picks.push({ key: s.name, palace: ziwei.borrowedFrom ? `迁移（命宫无主星，借对宫）` : '命宫', factor: 1, star: s }));
  const bodyPalace = ziwei.palaces.find(p => p.isBody);
  if (bodyPalace && bodyPalace.name !== '命宫') push(bodyPalace.name, 0.6);
  push('福德', 0.4);
  push('官禄', 0.4);
  const total = picks.reduce((a, p) => a + p.factor, 0) || 1;
  return picks.map(p => ({ ...p, share: p.factor / total, w: MAJOR_STARS[p.key].w }));
}

/**
 * 生成「我是谁」画像。
 */
export function buildPortrait(bazi, ziwei) {
  const bItems = baziItems(bazi);
  const zItems = ziwei ? ziweiItems(ziwei) : [];
  const bScore = scoreFrom(bItems);
  const zScore = ziwei ? scoreFrom(zItems) : null;

  const dimensions = DIMENSIONS.map(d => {
    const b = bScore[d.key];
    const z = zScore ? zScore[d.key] : null;
    const score = z === null ? b : Math.round((b + z) / 2);
    const gap = z === null ? 0 : Math.abs(b - z);

    const topB = [...bItems].sort((a, x) => Math.abs(x.share * (x.w[d.key] || 0)) - Math.abs(a.share * (a.w[d.key] || 0))).filter(i => i.w[d.key]).slice(0, 3);
    const topZ = [...zItems].sort((a, x) => Math.abs(x.share * (x.w[d.key] || 0)) - Math.abs(a.share * (a.w[d.key] || 0))).filter(i => i.w[d.key]).slice(0, 2);

    const level = score >= 68 ? 'high' : score <= 32 ? 'low' : 'mid';
    const desc = level === 'high' ? d.highText : level === 'low' ? d.lowText : d.midText;

    return {
      ...d,
      score,
      baziScore: b,
      ziweiScore: z,
      gap,
      level,
      desc,
      insight: makeInsight({
        title: d.label,
        summary: `你${desc}。`,
        // 场景取自贡献最大的那个十神／主星，这样「说的就是我」才立得住
        scenes: [
          ...(topB[0] && TEN_GOD_SCENES[topB[0].key] ? TEN_GOD_SCENES[topB[0].key].scenes.slice(0, 2) : []),
          ...(topZ[0] && STAR_SCENES[topZ[0].key] ? STAR_SCENES[topZ[0].key].scenes.slice(0, 1) : [])
        ],
        because: topB[0] && TEN_GOD_SCENES[topB[0].key] ? TEN_GOD_SCENES[topB[0].key].because : '',
        cost: topB[0] && TEN_GOD_SCENES[topB[0].key] ? TEN_GOD_SCENES[topB[0].key].cost : '',
        note: gap >= 20 ? `八字和紫微在这一项上给出的读法不太一样（${b} 对 ${z}），说明这部分本身就有两面。` : '',
        systems: [
          {
            system: 'bazi',
            label: SYSTEM_LABEL.bazi,
            interpretation: topB.length
              ? `你命里分量较重的是 ${topB.map(t => t.key).join('、')}。其中${topB[0].key}的意思是：${TEN_GODS[topB[0].key].plain}这类结构多了，就会往上面说的方向偏。`
              : '这一项在八字里没有明显的偏向，说明它不是你命盘中突出的部分。',
            evidence: [
              ...topB.map(t => ev('ten_god', t.key, `在你的十神里占 ${(t.share * 100).toFixed(0)}%，${TEN_GODS[t.key].plain}`)),
              ev('strength', `日主 ${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}），${bazi.strength.label}`, bazi.strength.basis)
            ]
          },
          ziwei && {
            system: 'ziwei',
            label: SYSTEM_LABEL.ziwei,
            interpretation: topZ.length
              ? `紫微盘上，${topZ.map(t => `${t.palace}有${t.key}`).join('、')}。${topZ[0].key}这颗星代表的是：${MAJOR_STARS[topZ[0].key].plain}`
              : '这一项在紫微盘里没有明显的偏向。',
            evidence: [
              ...topZ.map(t => ev('star', `${t.key}${t.star.brightness || ''}`, `落${t.palace}${t.star.mutagen ? ` · 化${t.star.mutagen}` : ''}`)),
              ev('palace', `命宫 ${ziwei.soulPalace.stem}${ziwei.soulPalace.branch}`, `${ziwei.fiveElementsClass} · 命主${ziwei.soul} · 身主${ziwei.body}`)
            ]
          }
        ]
      })
    };
  });

  return { dimensions, bItems, zItems, themes: buildThemes(bazi, ziwei, dimensions) };
}

const dimOf = (dims, key) => dims.find(d => d.key === key);

/** 人生主题：从画像维度 + 命局结构派生 */
function buildThemes(bazi, ziwei, dims) {
  const themes = [];
  const drive = dimOf(dims, 'drive'), stab = dimOf(dims, 'stability'), risk = dimOf(dims, 'risk');
  const social = dimOf(dims, 'social'), create = dimOf(dims, 'creation'), tension = dimOf(dims, 'tension');
  const topGod = bazi.tenGods[0];
  const soulStars = ziwei ? ziwei.soulMajors.map(s => s.name) : [];
  const officePalace = ziwei ? ziwei.palaces.find(p => p.name === '官禄') : null;
  const spousePalace = ziwei ? ziwei.palaces.find(p => p.name === '夫妻') : null;

  const dist = analyzeDistribution(bazi);
  const overall = summarize(bazi, dist);
  const topGods = dist.shares.slice().sort((a, b) => b.pct - a.pct).filter(x => x.pct > 0);
  const lead = topGods[0], second = topGods[1];
  const F = k => TEN_GODS_FULL[k];
  const starScene = soulStars.map(n => STAR_SCENES[n]).filter(Boolean)[0];

  // 同一条场景在整份报告里只用一次，重复会立刻暴露这是模板
  const used = new Set();
  const pick = (pools, n) => {
    const out = [];
    for (const pool of pools) for (const sc of pool || []) {
      if (out.length >= n) return out;
      if (used.has(sc)) continue;
      used.add(sc); out.push(sc);
    }
    return out;
  };

  // ── 0 总述。先给一段能一口气读完的整体印象，再分开讲。
  themes.push(makeInsight({
    title: '总的来说',
    summary: weave([
      `你的命盘里，${lead.god}的分量最重`,
      second ? `，其次是${second.god}` : '',
      `。${F(lead.god).headline.replace(/。$/, '')}`,
      second && F(second.god) ? `；同时你身上也有${F(second.god).headline.replace(/^你/, '').replace(/。$/, '')}的一面。` : '。',
      `日主${bazi.strength.label}，${bazi.strength.label === '偏弱' ? '意思是命里帮扶你自己的力量偏少，所以你的状态更依赖外部条件——有人托着、环境顺的时候，你能发挥出平时看不到的水平' : bazi.strength.label === '偏强' ? '意思是命里帮扶你自己的力量足，所以你主意大、扛得住，但也不太听得进劝' : '意思是帮扶和消耗大致平衡，你的状态会跟着环境走，弹性比较大'}。`
    ]),
    scenes: pick([F(lead.god)?.scenes, F(second?.god)?.scenes], 3),
    because: `十神是拿命里每个字跟「你自己」比出来的十种关系。${lead.god}占 ${lead.pct}%，它${stripLead(F(lead.god).because)}`,
    systems: [
      {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: `${overall.text}十神占比：${dist.shares.filter(x => x.pct > 0).map(x => `${x.god} ${x.pct}%`).join('、')}${dist.absent.length ? `；命里没有${dist.absent.map(x => x.god).join('、')}` : ''}。`,
        evidence: [
          ev('pillar', bazi.pillars.map(p => p.gan + p.zhi).join(' '), `年、月、日、时四柱；日主是 ${bazi.dayMaster.gan}`),
          ev('strength', bazi.strength.label, bazi.strength.basis),
          ...dist.shares.filter(x => x.pct >= 10).map(x => ev('ten_god', `${x.god} ${x.pct}%`, F(x.god)?.headline || ''))
        ]
      },
      ziwei && {
        system: 'ziwei', label: SYSTEM_LABEL.ziwei,
        interpretation: soulStars.length
          ? `紫微那边，你的命宫里坐着${soulStars.join('、')}。命宫是十二格里最核心的一格，代表基本性格。${MAJOR_STARS[soulStars[0]]?.plain || ''}`
          : '你的命宫里没有主星，传统上要借对面那一宫来看，也就是说你的性格更容易被环境带出来。',
        evidence: [
          ev('star', soulStars.join('、') || '（无主星）', ziwei.borrowedFrom ? `借${ziwei.borrowedFrom}宫` : '命宫本位'),
          ev('palace', `${ziwei.fiveElementsClass} · 命主${ziwei.soul} · 身主${ziwei.body}`, '五行局决定大限从几岁起算')
        ]
      }
    ]
  }));

  // ── 1 我如何做决定
  const decisive = topGods.find(t => ['七杀', '劫财', '伤官'].includes(t.god));
  const careful = topGods.find(t => ['正官', '正印', '正财', '偏印'].includes(t.god));
  const leadDecide = decisive || careful || lead;
  themes.push(makeInsight({
    title: '我如何做决定',
    summary: weave([
      drive.score >= 60 && risk.score >= 55
        ? '遇到事情，你的本能反应是先动起来，在做的过程里再调整，而不是站在原地把所有可能性想完'
        : drive.score <= 40 || risk.score <= 40
          ? '遇到事情，你的本能反应是先把情况看清楚——不是不敢，是不想白费力气'
          : `遇到事情，你${hedge(0)}会在「先做再说」和「想清楚再动」之间摆一阵`,
      '。',
      leadDecide ? `这跟你命里${leadDecide.god}分量重有关：它${stripLead(F(leadDecide.god).because).replace(/。$/, '')}。` : '',
      `再加上你日主${bazi.strength.label}，${bazi.strength.label === '偏弱' ? '真到了要拍板的时候，你会比别人更想找个人商量一下——不是没主见，是需要一个确认' : bazi.strength.label === '偏强' ? '一旦你自己想清楚了，别人再怎么劝也很难改变你' : '你的决定会随当时的处境调整，所以同样的事在不同阶段你可能做出不同的选择'}。`
    ]),
    scenes: pick([F(leadDecide?.god)?.scenes, STRENGTH_SCENES[bazi.strength.label]?.scenes], 3),
    cost: STRENGTH_SCENES[bazi.strength.label]?.cost || '',
    advice: F(leadDecide?.god)?.advice,
    systems: [
      {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: `${leadDecide ? `${leadDecide.god}占 ${leadDecide.pct}%，是你命里分量最重的几个之一。` : ''}${F(leadDecide?.god)?.work || ''}`,
        evidence: [
          leadDecide && ev('ten_god', `${leadDecide.god} ${leadDecide.pct}%`, F(leadDecide.god).headline),
          ev('strength', bazi.strength.label, bazi.strength.basis)
        ].filter(Boolean)
      },
      ziwei && starScene && {
        system: 'ziwei', label: SYSTEM_LABEL.ziwei,
        interpretation: `${starScene.headline}${starScene.cost}`,
        evidence: [ev('star', soulStars.join('、'), MAJOR_STARS[soulStars[0]]?.plain || '')]
      }
    ]
  }));

  // ── 2 我在什么环境里最舒服（原「面对变化」，改成更能落地的角度）
  const absentKey = dist.absent.find(a => ['正官', '正印', '七杀', '正财', '食神'].includes(a.god)) || dist.absent[0];
  themes.push(makeInsight({
    title: '我在什么环境里最舒服',
    summary: weave([
      lead && F(lead.god) ? F(lead.god).work : '',
      absentKey ? `另外，你命里没有${absentKey.god}，这一点${hedge(1)}比「有什么」更能解释你为什么在某些地方待不住。` : ''
    ]),
    scenes: pick([F(lead.god)?.social, F(second?.god)?.scenes], 2),
    because: absentKey ? F(absentKey.god).absent : '',
    advice: absentKey ? F(absentKey.god).advice : '',
    systems: [
      {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: `十神里${dist.strong.length ? `${dist.strong.map(x => `${x.god}偏旺（${x.pct}%）`).join('、')}` : '没有特别旺的一项'}${dist.absent.length ? `，而${dist.absent.map(x => x.god).join('、')}是完全没有的` : ''}${dist.scarce.length ? `，${dist.scarce.map(x => x.god).join('、')}也很少` : ''}。旺的那几项决定你擅长什么，缺的那几项决定你在哪种环境里会莫名难受。`,
        evidence: dist.shares.map(x => ev('ten_god', `${x.god} ${x.pct}%`, x.pct === 0 ? '命里没有' : F(x.god)?.headline || ''))
      }
    ]
  }));

  // ── 3 顺的时候与不顺的时候（同一个结构，处境不同表现完全不同）
  const states = stateParagraphs(lead.god);
  themes.push(makeInsight({
    title: '顺的时候，和不顺的时候',
    summary: `同一个人在不同处境里会长成不一样的样子。以你命里最重的${lead.god}来说——`,
    scenes: states.map(x => `${x.title}：${x.text.replace(/^若处于[生扶制约]+状态[，,]/, '')}`),
    because: `命理里把这叫「生扶」和「制约」：同一个十神，有源头供着的时候是一种表现，被压着的时候是另一种。所以${hedge(2)}不是你变了，是你所处的位置变了。`,
    gift: F(lead.god)?.gift || '',
    systems: [
      {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: `${lead.god}在你命里占 ${lead.pct}%。它顺不顺，主要看大运流年有没有给它源头——这也是为什么同一张命盘，不同年份的体感差别很大。`,
        evidence: [
          ev('ten_god', `${lead.god} ${lead.pct}%`, F(lead.god).headline),
          ev('strength', `日主${bazi.strength.label}，喜 ${bazi.strength.favor.join('、')}`, bazi.strength.basis)
        ]
      }
    ]
  }));

  // ── 4 反复出现的矛盾
  const conflicts = detectConflicts(bazi, ziwei);
  const mainTension = conflicts.map(c => TENSION_SCENES[c.name]).filter(Boolean)[0];
  const mainConflict = conflicts.find(c => TENSION_SCENES[c.name]) || conflicts[0];
  themes.push(makeInsight({
    title: '哪些矛盾可能反复出现',
    summary: mainTension
      ? weave([mainTension.headline, `这不是性格缺陷，是你命里两股性质相反的力量都占了分量，${hedge(3)}会在同一件事上同时被两边拉。`])
      : conflicts.length
        ? `你命里有互相拧着的结构：${conflicts[0].plain}`
        : '你命盘内部的诉求比较一致，纠结更多来自外部环境，而不是自己跟自己过不去。',
    scenes: pick([mainTension?.scenes], 2),
    because: conflicts.length ? `这来自${mainConflict.basis}。${conflicts.length > 1 ? `除此之外还有${conflicts.slice(1).map(c => c.name).join('、')}，几组叠在一起，所以你的纠结不止一种。` : ''}` : '',
    cost: mainTension ? mainTension.cost : '',
    note: tension.score >= 62 ? '你的「内在张力」偏高，说明这种拉扯是长期的，不是某个阶段才有——认识它比消灭它现实。' : '',
    systems: [
      {
        system: 'bazi', label: SYSTEM_LABEL.bazi,
        interpretation: conflicts.filter(c => c.system === 'bazi').map(c => `所谓${c.name}，是指${c.basis}。传统上把它读作：${c.plain}`).join('　') || '八字这一层没有出现典型的对冲结构。',
        evidence: conflicts.filter(c => c.system === 'bazi').map(c => ev('rule', c.name, c.basis))
      },
      ziwei && {
        system: 'ziwei', label: SYSTEM_LABEL.ziwei,
        interpretation: conflicts.filter(c => c.system === 'ziwei').map(c => `${c.name}——${c.plain}`).join('　') || '紫微这一层，你的命宫结构相对单纯。',
        evidence: conflicts.filter(c => c.system === 'ziwei').map(c => ev('rule', c.name, c.basis))
      }
    ]
  }));

  return themes;
}

/** 典型对冲结构识别 */
export function detectConflicts(bazi, ziwei) {
  const out = [];
  const w = god => (bazi.tenGods.find(t => t.god === god)?.weight) || 0;
  const both = (a, b) => w(a) >= 0.5 && w(b) >= 0.5;

  if (both('正官', '七杀')) out.push({ system: 'bazi', name: '官杀混杂', plain: '对规则既服从又想挣脱，容易在「听话」和「反抗」之间来回。', basis: '命里正官和七杀同时都有分量——正官是规则，七杀是压力，两者性质相近但一个温和一个强硬' });
  if (both('伤官', '正官')) out.push({ system: 'bazi', name: '伤官见官', plain: '表达欲和外部要求经常撞车，在有上级的环境里尤其明显。', basis: '命里伤官和正官同时出现——伤官是不服管的表达欲，正官是要守的规矩' });
  if (both('正印', '偏财')) out.push({ system: 'bazi', name: '财印相碍', plain: '想安稳和想抓机会互相拉扯，常常两头都不肯放。', basis: '命里正印和偏财同时出现——正印求安稳，偏财求机会' });
  if (both('偏印', '食神')) out.push({ system: 'bazi', name: '枭神夺食', plain: '想法很多，但落地的时候容易被自己否掉。', basis: '命里偏印和食神同时出现——食神是往外做出东西，偏印是往内收回来' });
  if (both('比肩', '正财') || both('劫财', '正财') || both('劫财', '偏财')) out.push({ system: 'bazi', name: '比劫夺财', plain: '资源怎么分、合作怎么算账，是会反复出现的摩擦点。', basis: '命里比肩劫财和财星同时有分量——比劫代表同辈，财代表资源，两者会争' });

  if (ziwei) {
    const soul = ziwei.soulMajors.map(s => s.name);
    const PAIRS = [
      [['紫微', '破军'], '既想守住格局又想推翻重来。'],
      [['天机', '巨门'], '想得多、也说得多，容易先把自己绕进去。'],
      [['贪狼', '天同'], '既想要刺激又想要安逸。'],
      [['七杀', '天梁'], '既想冲又想稳，行动前后落差大。'],
      [['廉贞', '贪狼'], '欲望强度高，取舍上容易反复。']
    ];
    PAIRS.forEach(([pair, plain]) => {
      if (pair.every(p => soul.includes(p))) out.push({ system: 'ziwei', name: `命宫同时有${pair.join('和')}`, plain, basis: `这两颗星性质相反，却落在同一个宫里` });
    });
    const jiStar = ziwei.palaces.flatMap(p => [...p.majorStars, ...p.minorStars].filter(s => s.mutagen === '忌').map(s => ({ star: s.name, palace: p.name })));
    jiStar.slice(0, 1).forEach(j => out.push({ system: 'ziwei', name: `${j.star}化忌落在${j.palace}`, plain: `${j.palace}这方面容易反复投入，又反复卡住。`, basis: '化忌是四化里代表「执着与卡点」的那一化，它落在哪一宫，哪一宫的事就容易绕不开' }));
  }
  return out;
}
