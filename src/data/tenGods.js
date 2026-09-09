// 十神释义与画像维度权重。
// 维度：drive 行动力 / stability 稳定需求 / creation 创造倾向 / social 社交方式 / risk 风险倾向 / tension 内在张力
export const TEN_GODS = {
  比肩: { group: '同我', plain: '把自己当作主要依靠，独立、不轻易服从安排。', w: { drive: 1, stability: 1, social: 0, creation: 0, risk: 0, tension: 0 } },
  劫财: { group: '同我', plain: '行动力强、敢争敢抢，但容易在资源分配上起摩擦。', w: { drive: 2, stability: -1, social: 1, creation: 0, risk: 2, tension: 1 } },
  食神: { group: '我生', plain: '愿意表达与享受，创造带着松弛感，不急于求成。', w: { drive: 0, stability: 1, social: 1, creation: 2, risk: -1, tension: 0 } },
  伤官: { group: '我生', plain: '才华外露、不服既有规则，容易先出彩再出事。', w: { drive: 1, stability: -2, social: 1, creation: 2, risk: 1, tension: 2 } },
  偏财: { group: '我克', plain: '对机会敏感、人脉活络，钱与资源来去都快。', w: { drive: 1, stability: -1, social: 2, creation: 1, risk: 1, tension: 0 } },
  正财: { group: '我克', plain: '务实、看重可核算的回报，靠积累而非爆发。', w: { drive: 1, stability: 2, social: 0, creation: -1, risk: -1, tension: 0 } },
  七杀: { group: '克我', plain: '在压力下反而爆发，决断快，也容易把自己逼到极限。', w: { drive: 2, stability: -1, social: 0, creation: 0, risk: 2, tension: 2 } },
  正官: { group: '克我', plain: '重规则与责任，在明确的结构里最稳定。', w: { drive: 1, stability: 2, social: 0, creation: 0, risk: -2, tension: 1 } },
  偏印: { group: '生我', plain: '思路非常规、偏内向，喜欢独自消化问题。', w: { drive: -1, stability: 0, social: -2, creation: 1, risk: 0, tension: 2 } },
  正印: { group: '生我', plain: '依靠学习与支持系统，求安稳、不喜欢被推着走。', w: { drive: -1, stability: 2, social: -1, creation: 0, risk: -2, tension: 0 } }
};

export const WUXING_TRAIT = {
  木: { plain: '生长与扩张的倾向，喜欢往前伸展、开新局面。', keyword: '生发' },
  火: { plain: '外显与表达的倾向，情绪与热度来得快。', keyword: '外显' },
  土: { plain: '承载与稳定的倾向，重视根基与可靠。', keyword: '承载' },
  金: { plain: '收敛与决断的倾向，讲原则、下手干脆。', keyword: '决断' },
  水: { plain: '流动与变通的倾向，善于绕行与思考。', keyword: '变通' }
};

// gapThreshold：两人在该维度上算「明显差异」的分差。
// 取值为 60 张随机命盘两两比较（1770 对）后各维度差距的约 70 分位，
// 因为各维度的天然离散度并不相同——统一用一个阈值会让张力、社交永远读作「接近」。
export const DIMENSIONS = [
  {
    key: 'drive', label: '行动力', color: 'var(--jade)', gapThreshold: 15,
    low: '偏向观察与等待', high: '偏向主动出手',
    highText: '倾向于先动起来，在做的过程中再调整，不太愿意把事情一直悬着',
    lowText: '倾向于先把情况看清楚再动，宁可慢一点也不想白费力气',
    midText: '有时候先做再说，有时候要想清楚才动，取决于当时的压力'
  },
  {
    key: 'stability', label: '稳定需求', color: 'var(--gold)', gapThreshold: 14,
    low: '对变动容忍度高', high: '需要确定的结构',
    highText: '需要一个确定的框架才安心，计划被打乱会消耗你不少精力',
    lowText: '对变动的容忍度很高，长期一成不变反而让你不舒服',
    midText: '能接受变化，但希望变化是自己选的，而不是被推着走'
  },
  {
    key: 'creation', label: '创造倾向', color: 'var(--violet)', gapThreshold: 10,
    low: '偏向执行与完善', high: '偏向表达与创新',
    highText: '会被「能做出点东西来」的事吸引，纯重复的工作留不住你',
    lowText: '更擅长把已有的东西做扎实、做完善，而不是从零开新的',
    midText: '既能开新东西也能守摊子，但两边都不算特别强烈'
  },
  {
    key: 'social', label: '社交方式', color: 'var(--azure)', gapThreshold: 9,
    low: '偏向独处与深交', high: '偏向广连接',
    highText: '靠连接拿到机会，人多的场合能给你补充能量',
    lowText: '更看重少数几段深关系，泛泛的社交对你是消耗',
    midText: '社交上可进可退，但真正投入的关系数量不多'
  },
  {
    key: 'risk', label: '风险倾向', color: 'var(--cinnabar)', gapThreshold: 16,
    low: '偏向规避风险', high: '愿意承担不确定',
    highText: '愿意在看不清结果的时候先下注',
    lowText: '会先把最坏的情况算清楚，能不赌就不赌',
    midText: '愿意冒一定的险，但需要先看到退路'
  },
  {
    key: 'tension', label: '内在张力', color: 'var(--wx-tu)', gapThreshold: 8,
    low: '内部诉求较一致', high: '不同诉求容易打架',
    highText: '心里同时有几种互相拉扯的诉求，做选择时会比别人纠结',
    lowText: '内部想要的东西比较一致，纠结通常来自外部而不是自己',
    midText: '偶尔会自己跟自己拧巴，但不至于长期卡住'
  }
];
