import React, { useState } from 'react';
import { PageHeader, Card, Button, Field, inputCls, Tabs , tint} from '../components/ui';
import WhyCard from '../components/WhyCard';
import Disclaimer from '../components/Disclaimer';
import HexagramView from '../components/HexagramView';
import { runDecision } from '../engines/decision';
import { EVENT_TYPES, EVENT_STATUS } from '../store/store';

/** 第一步：你现在遇到了什么 */
function NewEvent({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('decision');

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <PageHeader
        title="你现在遇到了什么？"
        subtitle="用你自己的话写下来就行。每一件事会成为一个独立的 Case，之后所有解读、你的选择、以及后来实际发生的事，都挂在它下面。"
      />
      <div className="rounded-2xl border border-b1 bg-card p-6 space-y-4">
        <Field label="这件事" required>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="例如：我现在有两份工作，不知道选哪份。"
            className={inputCls}
          />
        </Field>
        <Field label="背景" hint="可选，但写得越具体，后面的取舍分析越有依据">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            placeholder="现在的处境、时间压力、你已经在犹豫什么……"
            className={`${inputCls} resize-none`}
          />
        </Field>
        <Field label="这属于哪一类问题" hint="MVP 需要你确认一次">
          <div className="grid grid-cols-2 gap-2">
            {EVENT_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => t.ready && setType(t.key)}
                disabled={!t.ready}
                className={`text-left rounded-xl border px-3.5 py-2.5 transition-all
                  ${type === t.key ? 'border-jade/40 bg-tint-jade' : t.ready ? 'border-b1 hover:border-b2' : 'border-b1 opacity-35 cursor-not-allowed'}`}
              >
                <div className="text-[13px] text-t1 flex items-center gap-2">
                  {t.label}
                  {!t.ready && <span className="text-[9px] text-t4 border border-b1 rounded px-1">P1</span>}
                </div>
                <div className="text-[11px] text-t4 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </Field>
        <Button size="lg" className="w-full" disabled={!title.trim()} onClick={() => onCreate({ title: title.trim(), description, event_type: type })}>
          建立这件事
        </Button>
      </div>
      <div className="mt-6"><Disclaimer /></div>
    </div>
  );
}

const SYSTEM_OPTIONS = [
  { key: 'multi', label: '多体系' },
  { key: 'bazi', label: '八字' },
  { key: 'ziwei', label: '紫微' },
  { key: 'liuyao', label: '六爻' },
  { key: 'meihua', label: '梅花' }
];

export default function ChooseWorkbench({
  event, events, bazi, ziwei, gender, onCreate, onOpenEvent, onAddOption, onRemoveOption,
  onSaveReading, onSetOutcome, onFocus, onUpdateEvent
}) {
  const [mode, setMode] = useState('multi');
  const [optName, setOptName] = useState('');
  const [optDesc, setOptDesc] = useState('');
  const [ran, setRan] = useState(null);
  const [choice, setChoice] = useState('');

  if (!event) {
    if (events.length) {
      return (
        <div className="h-full overflow-y-auto scrollbar-thin">
          <div className="max-w-3xl mx-auto px-8 py-10">
            <PageHeader title="我该如何选择" subtitle="选择一件已有的事，或新建一件。" right={<Button onClick={() => onOpenEvent(null, true)}>新建一件事</Button>} />
            <div className="space-y-2">
              {events.filter(e => e.event_type === 'decision').map(e => (
                <button key={e.event_id} onClick={() => onOpenEvent(e)} className="w-full text-left rounded-xl border border-b1 bg-card px-5 py-4 hover:border-b2 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm text-t1">{e.title}</div>
                      <div className="text-[11px] text-t4 mt-1">
                        {e.options.length} 个选项 · {e.readings.length} 次解读 · {new Date(e.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] shrink-0" style={{ background: tint(EVENT_STATUS[e.status].color, 11), color: EVENT_STATUS[e.status].color }}>
                      {EVENT_STATUS[e.status].label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return <div className="h-full overflow-y-auto scrollbar-thin"><NewEvent onCreate={onCreate} /></div>;
  }

  if (event === 'new') return <div className="h-full overflow-y-auto scrollbar-thin"><NewEvent onCreate={onCreate} /></div>;

  const systems = mode === 'multi' ? ['bazi', 'ziwei', 'liuyao', 'meihua'].filter(s => s !== 'ziwei' || ziwei) : [mode];
  const canRun = event.options.length >= 2;

  const run = () => {
    const result = runDecision({
      bazi, ziwei, gender,
      event: { id: event.event_id, title: event.title, description: event.description },
      options: event.options.map(o => ({ id: o.option_id, name: o.name, description: o.description })),
      systems
    });
    setRan(result);
    onSaveReading(event.event_id, {
      system: mode,
      input: { systems, options: event.options.map(o => o.name) },
      result: {
        summary: result.insight.summary,
        consensus: result.consensus.text,
        divergence: result.divergence.map(d => d.text),
        variables: result.variables.map(v => v.statement),
        optionTendencies: result.optionViews.map(o => ({ name: o.option.name, tendency: o.tendency }))
      },
      evidence: result.insight.systems.map(s => ({ system: s.system, interpretation: s.interpretation, evidence: s.evidence }))
    });
    onFocus?.(`解读结果 · ${mode === 'multi' ? '多体系' : mode}`);
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title={event.title}
          subtitle={event.description}
          right={<Button variant="ghost" size="sm" onClick={() => onOpenEvent(null)}>返回列表</Button>}
        />

        <Card title="选项" right={<span className="text-[11px] text-t4">至少两个选项才能进行比较</span>}>
          <div className="space-y-2 mb-4">
            {event.options.map((o, i) => (
              <div key={o.option_id} className="flex items-start gap-3 rounded-xl border border-b1 bg-subtle px-4 py-3">
                <span className="font-display text-lg text-t4 shrink-0">{String.fromCharCode(65 + i)}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-t1">{o.name}</div>
                  {o.description && <div className="text-[12px] text-t3 mt-0.5 leading-relaxed">{o.description}</div>}
                </div>
                <button onClick={() => onRemoveOption(event.event_id, o.option_id)} className="text-t5 hover:text-cinnabar/70 text-sm shrink-0">×</button>
              </div>
            ))}
            {!event.options.length && <p className="text-[12px] text-t4">还没有选项。</p>}
          </div>

          <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
            <input value={optName} onChange={e => setOptName(e.target.value)} placeholder="选项名称" className={inputCls} />
            <input value={optDesc} onChange={e => setOptDesc(e.target.value)} placeholder="这个选项具体是什么（越具体越好）" className={inputCls} />
            <Button
              disabled={!optName.trim()}
              onClick={() => { onAddOption(event.event_id, { name: optName.trim(), description: optDesc.trim() }); setOptName(''); setOptDesc(''); setRan(null); }}
            >
              添加
            </Button>
          </div>
        </Card>

        <Card title="解读模式" right={
          <Button disabled={!canRun} onClick={run}>{ran ? '重新解读' : '开始解读'}</Button>
        }>
          <Tabs
            value={mode}
            onChange={k => { setMode(k); setRan(null); }}
            tabs={SYSTEM_OPTIONS.map(s => ({ ...s, disabled: s.key === 'ziwei' && !ziwei }))}
          />
          <p className="mt-3 text-[11px] text-t4 leading-relaxed">
            {mode === 'multi'
              ? '多体系不会把各家结论平均成一个分数，而是分别给出：共识、分歧、以及真正需要你自己决定的变量。'
              : `只用${SYSTEM_OPTIONS.find(s => s.key === mode).label}这一个视角解读。`}
            {!ziwei && ' 当前档案缺少公历出生日期，紫微不可用。'}
          </p>
          {!canRun && <p className="mt-2 text-[12px] text-gold/70">请先添加至少两个选项。</p>}
        </Card>

        {ran && (
          <div className="space-y-4 animate-in">
            <div className="rounded-2xl border border-jade/25 bg-tint-jade p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-jade/70 mb-2">共识</div>
              <p className="text-[14px] text-t1 leading-relaxed">{ran.consensus.text}</p>
              {ran.consensus.sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {ran.consensus.sources.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-hover text-t3">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gold/25 bg-tint-gold p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold/70 mb-2">分歧</div>
              <div className="space-y-2">
                {ran.divergence.map((d, i) => (
                  <p key={i} className="text-[13px] text-t2 leading-relaxed">{d.text}</p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-violet/25 bg-tint-violet p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-violet/70 mb-1">真正需要你决定的变量</div>
              <p className="text-[11px] text-t4 mb-3">这部分不是命理能替你回答的。系统不会输出「建议选 B」。</p>
              <div className="space-y-3">
                {ran.variables.map(v => (
                  <div key={v.id} className="rounded-xl bg-inset px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[13px] text-t1">{v.poles[0]}</span>
                      <span className="text-t4 text-xs">vs</span>
                      <span className="text-[13px] text-t1">{v.poles[1]}</span>
                      {!v.discriminating && <span className="ml-auto text-[10px] text-t4">选项描述未拉开差距</span>}
                    </div>
                    <p className="text-[13px] text-t2 leading-relaxed">{v.statement}</p>
                    <p className="text-[11px] text-t4 mt-1">{v.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card title="每个选项的结构">
              <div className="grid grid-cols-2 gap-3">
                {ran.optionViews.map(ov => (
                  <div key={ov.option.id} className="rounded-xl border border-b1 bg-subtle p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-t1">{ov.option.name}</span>
                      {ov.meta && (
                        <span className="px-2 py-0.5 rounded text-[11px]" style={{ background: tint(ov.meta.color, 11), color: ov.meta.color }}>
                          {ov.tendency}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-t3 leading-relaxed">{ov.summary}</p>
                    {ov.poles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ov.poles.map(p => <span key={p} className="px-1.5 py-0.5 rounded text-[10px] bg-hover text-t4">{p}</span>)}
                      </div>
                    )}
                    {ov.liuyao && (
                      <div className="mt-3 pt-3 border-t border-b1">
                        <HexagramView gua={ov.liuyao.gua} compact />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <WhyCard insight={ran.insight} />

            <Card title="做出选择">
              <p className="text-[12px] text-t4 mb-3 leading-relaxed">
                记录你最后的决定。这条记录会进入「我的路」，之后你可以回来补充实际发生了什么——原始解读不会被覆盖。
              </p>
              <div className="flex gap-2 flex-wrap mb-3">
                {event.options.map(o => (
                  <button
                    key={o.option_id}
                    onClick={() => setChoice(o.name)}
                    className={`px-3.5 py-1.5 rounded-lg text-[13px] border transition-colors ${choice === o.name ? 'border-jade/40 bg-tint-jade text-jade' : 'border-b1 text-t3 hover:text-t1'}`}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
              <Button disabled={!choice} onClick={() => { onSetOutcome(event.event_id, { final_choice: choice, actual_result: '', reflection: '' }); onFocus?.(`已选择：${choice}`); }}>
                记录这个选择
              </Button>
              {event.outcome?.final_choice && (
                <p className="mt-3 text-[12px] text-jade/70">已记录最终选择：{event.outcome.final_choice}</p>
              )}
            </Card>
          </div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
