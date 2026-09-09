/**
 * 插件 node 半侧用到的引擎入口。esbuild 会把它连同 src/engines 打成 dsh/engines.mjs。
 * 两件事：把排盘/信号函数导出去；把一份档案写成给 DSH 看的 CONTEXT.md。
 */
import { buildBazi } from '../engines/bazi';
import { buildZiwei } from '../engines/ziwei';
import { correctedBirth } from '../engines/solar';
import { chartSignals, yearSignals, signalsToText, yearToText } from '../engines/signals';
import { profileFacts } from './facts';

export { buildBazi, buildZiwei, correctedBirth, chartSignals, yearSignals };

export function chartsOf(profile) {
  if (!profile?.birth_date) return { bazi: null, ziwei: null, corr: null };
  const corr = correctedBirth(profile);
  const args = { date: corr.date || profile.birth_date, time: corr.time || profile.birth_time, gender: profile.gender || '男', timeUnknown: !!profile.time_unknown };
  return { bazi: buildBazi(args), ziwei: buildZiwei(args), corr };
}

const KEY_LABEL = k => {
  if (k === 'reveal') return '命盘开卷（第一屏的简短解读）';
  if (k === 'who') return '我是谁';
  if (k === 'where-to') return '我将去向何方（现在与未来十年）';
  if (k.startsWith('year:')) return `${k.slice(5)} 年`;
  if (k.startsWith('event:')) return k.includes('#') ? `一个问题的第 ${k.split('#')[1]} 轮追问` : '一个问题';
  if (k.startsWith('person:')) return '合盘';
  if (k.startsWith('alt:')) return '另一条时间线';
  if (k === 'places') return '地点（国内版）';
  if (k === 'places:intl') return '地点（国际版）';
  if (k.startsWith('naming:')) return '起名';
  return k;
};

/**
 * 写给 DSH 的上下文。三层分工写在最前面：排盘引擎算事实，规则引擎标信号，解读由你来写。
 */
export function contextDocument(profile, opts = {}) {
  const { bazi, ziwei, corr } = chartsOf(profile);
  const name = profile.name || '用户';
  const lines = [
    '# 玄学人生工作台 · 上下文', '',
    `你正在与 DSH Desktop 的「玄学人生工作台」协作。本会话的工作目录就是当前档案文件夹，档案主人是 **${name}**。`, '',
    '## 先读这一段：怎么说话', '',
    '**这份文档是写给你的，不是写给用户的。不要把里面的规则复述给他。**', '',
    '- 命理在这里是一种**看结构的读法**，不是预言。所有判断都用「多半、往往、容易、通常」这类留余地的说法，',
    '  不说「必然、一定、注定、命中」，不说「劫、灾、凶、破财、克夫、克妻」这类会吓到人的词。',
    '- **不替用户做决定。** 他问「该选哪个」，你给的是「如果你更在意 X，A 更贴；更在意 Y，B 更贴」，最后一句留给他。',
    '- **不制造焦虑。** 讲到不顺的年份或结构，同时讲清楚它对应的是哪一类事、以及顺的那一面在哪；不要只说坏的。',
    '- 用户问「为什么这样说」时，引用盘面依据（哪个十神、哪颗星、哪一年的干支），说清楚推理链。',
    '- 说人话但保持专业克制。「七杀」「化忌」这类词可以用，但第一次出现时顺手解释一句它在这个人身上是什么样。',
    '- 提到用户的关系人，一律用「伴侣」「家人」「同事」「朋友」这类中性称谓，不要用「男朋友」「女朋友」之类的说法，也不要复述用户的私人细节去举例。',
    '- 排版从简：短段落、`##` 小标题，不铺大表格。', '',
    '## 工作台怎么分工', '',
    '三层：**排盘引擎**算事实（四柱、大运流年、紫微宫位星曜、卦象），**规则引擎**标信号（十神偏重与缺失、干支关系、四化、每年六个方面的强弱），**你**写真正的解读。',
    '工作台里没有预写的解读文案——用户看到的每一段解读都是你写的。', '',
    '### 解读请求怎么处理', '',
    '- 工作台会自动发来以 `【工作台请求解读 #key】` 开头的消息，里面已经带好事实和信号，并说明了要你写哪几个小标题。',
    '- **先在对话里正常回答，然后必须写回文件**——把同样的内容写进 `profile.json`：`interpretations["key"]` 里把 `status` 改成 `"done"`，`text` 填你的回答（Markdown，`##` 小标题），`at` 填 ISO 时间。**不要动 `request` 字段**，不要删别的 key。写完界面几秒内自动显示。',
    '- 「我有事想问」里的追问也走这条路：key 形如 `event:<id>#2`、`#3`（第几轮），消息里带着前几轮的问答。**写回到消息里给的那个带 `#` 的 key**，不要覆盖第一轮的 `event:<id>`。如果你第一轮在「想先问你」里向他要过信息，`#2` 多半就是他的回答。',
    '- `【工具阁】` 开头的消息只需要在对话里回答，不用写文件。',
    '- 事实以消息里给的为准；你可以补充自己的命理知识，但不要改写事实（比如把日主强弱说反）。', '',
  ];

  if (!bazi) {
    lines.push('## 当前档案', '', `- ${name}：还没有出生信息，只能做与命盘无关的对话。`, '');
    return `${lines.join('\n')}\n`;
  }

  const year = new Date().getFullYear();
  const ys = yearSignals(bazi, ziwei, profile.gender, year);
  lines.push('## 当前档案（排盘引擎）', '', profileFacts(profile, bazi, ziwei, corr), '');
  lines.push('## 信号（规则引擎，只是标记）', '', signalsToText(chartSignals(bazi, ziwei)), '');
  if (ys) lines.push(`## 今年（${year}）六个方面`, '', yearToText(ys), '');

  const interp = profile.interpretations || {};
  const pending = Object.entries(interp).filter(([, v]) => v?.status === 'pending');
  const done = Object.entries(interp).filter(([, v]) => v?.status === 'done');
  lines.push('## 解读的状态', '');
  if (pending.length) { lines.push('**等你写回的**（工作台已经发过请求，界面在转圈）：'); pending.forEach(([k, v]) => lines.push(`- \`${k}\`　${KEY_LABEL(k)}　请求于 ${v.request?.at || ''}`)); lines.push(''); }
  if (done.length) { lines.push('已写回的：' + done.map(([k]) => `\`${k}\``).join('、')); lines.push(''); }
  if (!pending.length && !done.length) lines.push('还没有任何解读。用户打开某一页时工作台会自动发请求。', '');

  const qs = (profile.events || []).filter(e => e.question || e.event_type === 'question');
  lines.push('## 他问过的事', '');
  if (!qs.length) lines.push('- 还没问过。');
  qs.slice(0, 15).forEach(e => {
    const st = interp[`event:${e.event_id}`]?.status;
    lines.push(`- \`event:${e.event_id}\`　${e.question || e.title}　${String(e.created_at || '').slice(0, 10)}　${st === 'done' ? '已解读' : st === 'pending' ? '等你解读' : '未请求'}`);
    if (e.cast?.liuyao?.text) lines.push(`  - 六爻：${e.cast.liuyao.text}`);
    if (e.cast?.meihua?.text) lines.push(`  - 梅花：${e.cast.meihua.text}`);
    Object.entries(interp)
      .filter(([k]) => k.startsWith(`event:${e.event_id}#`))
      .sort((a, b) => Number(a[0].split('#')[1]) - Number(b[0].split('#')[1]))
      .forEach(([k, v]) => lines.push(`  - 追问 \`${k}\`：${v?.question || ''}　${v?.status === 'done' ? '已答' : v?.status === 'pending' ? '等你写回' : ''}`));
    if (e.outcome?.actual_result) lines.push(`  - 后来：${e.outcome.actual_result}`);
  });
  lines.push('');

  const tls = (profile.timelines || []).filter(t => t.premise);
  if (tls.length) { lines.push('## 他分叉过的时间线', '', ...tls.map(t => `- \`alt:${t.timeline_id}\`　如果当年……${t.premise}（${t.from_year} 年起）　${interp[`alt:${t.timeline_id}`]?.status === 'done' ? '已写' : '等你写'}`), ''); }
  const persons = profile.persons || [];
  if (persons.length) { lines.push('## 合盘里的人', '', ...persons.map(p => `- \`person:${p.person_id}\`　${p.nickname}（${p.kind}）${p.birth_date}${p.time_unknown ? ' 时辰不详' : ' ' + (p.birth_time || '')}${p.birth_place ? ` ${p.birth_place}` : ''}`), ''); }

  lines.push(
    '## 编辑 profile.json 的规则', '',
    '- `profile.json` 是工作台与你共用的唯一事实源，你直接编辑它，界面几秒内自动刷新。',
    '- **可以写**：`interpretations[key]` 的 `status` / `text` / `at`；`events[].outcome.actual_result`（用户说了后来怎么样）。',
    '- **不要改**：出生信息、`birth_place`、`birth_lng`、`calibration`、`events[].question`、`events[].cast`、任何 `request` 字段。',
    '- 不要写评分、不要写「运势分」——工作台不给分数，你也不要给。',
    '- 这些字段规则是给你看的实现细节，不要念给用户听。', ''
  );
  if (opts.folder) lines.push(`档案文件夹：\`${opts.folder}\``, '');
  return `${lines.join('\n')}\n`;
}
