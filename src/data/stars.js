// 紫微斗数十四主星释义与画像权重。
export const MAJOR_STARS = {
  紫微: { plain: '习惯站在主导位置，对局面有掌控欲，也在意体面。', w: { drive: 1, stability: 1, social: 1, creation: 0, risk: 0, tension: 1 } },
  天机: { plain: '思虑快、方案多，容易想得比做得多。', w: { drive: 0, stability: -1, social: 0, creation: 2, risk: 0, tension: 2 } },
  太阳: { plain: '愿意付出与照亮他人，对外表达强，也容易过劳。', w: { drive: 2, stability: 0, social: 2, creation: 1, risk: 0, tension: 1 } },
  武曲: { plain: '务实、执行硬，对资源与结果敏感，情绪表达偏少。', w: { drive: 2, stability: 2, social: -1, creation: -1, risk: 0, tension: 0 } },
  天同: { plain: '追求舒适与关系和谐，抗拒被逼着改变。', w: { drive: -1, stability: 2, social: 1, creation: 0, risk: -2, tension: 0 } },
  廉贞: { plain: '原则与欲望并存，做事有强烈的个人风格。', w: { drive: 1, stability: -1, social: 0, creation: 1, risk: 1, tension: 2 } },
  天府: { plain: '守成与积累型，喜欢把家底攒厚再动。', w: { drive: 0, stability: 2, social: 0, creation: -1, risk: -2, tension: 0 } },
  太阴: { plain: '细腻、重内在感受，偏好在幕后经营。', w: { drive: -1, stability: 1, social: -1, creation: 1, risk: -1, tension: 1 } },
  贪狼: { plain: '欲望与好奇心都强，兴趣广、擅长交际与转身。', w: { drive: 1, stability: -2, social: 2, creation: 2, risk: 2, tension: 1 } },
  巨门: { plain: '善于分析与质疑，靠说话吃饭，也容易因说话起争议。', w: { drive: 0, stability: -1, social: 1, creation: 1, risk: 0, tension: 2 } },
  天相: { plain: '协调与辅佐型，讲究得体，倾向配合而非独断。', w: { drive: 0, stability: 2, social: 1, creation: 0, risk: -1, tension: 0 } },
  天梁: { plain: '有老成与承担的一面，习惯替人善后。', w: { drive: 0, stability: 2, social: 0, creation: 0, risk: -1, tension: 1 } },
  七杀: { plain: '果断、说做就做，倾向以行动打破僵局。', w: { drive: 2, stability: -2, social: 0, creation: 0, risk: 2, tension: 1 } },
  破军: { plain: '先破后立，愿意推翻重来，过程消耗大。', w: { drive: 2, stability: -2, social: 0, creation: 2, risk: 2, tension: 2 } }
};

// 四化含义
export const MUTAGEN = {
  禄: { plain: '资源与顺畅的一面被放大', tone: 'positive' },
  权: { plain: '掌控与推动的一面被放大', tone: 'positive' },
  科: { plain: '声名与被看见的一面被放大', tone: 'positive' },
  忌: { plain: '执着与卡点的一面被放大', tone: 'caution' }
};

// 宫位与人生维度的对应
export const PALACE_DOMAIN = {
  命宫: 'self', 兄弟: 'relation', 夫妻: 'relation', 子女: 'creation',
  财帛: 'wealth', 疾厄: 'body', 迁移: 'move', 仆役: 'relation',
  官禄: 'career', 田宅: 'wealth', 福德: 'body', 父母: 'relation'
};

export const DOMAINS = [
  { key: 'career', label: '事业', color: 'var(--jade)' },
  { key: 'wealth', label: '财富', color: 'var(--gold)' },
  { key: 'relation', label: '关系', color: 'var(--azure)' },
  { key: 'move', label: '迁移', color: 'var(--violet)' },
  { key: 'creation', label: '创造', color: 'var(--wx-tu)' },
  { key: 'body', label: '身心', color: 'var(--cinnabar)' }
];
