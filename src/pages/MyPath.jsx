import React, { useState } from 'react';
import { PageHeader, Card, Button, Field, inputCls, Empty, Tabs , tint} from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import { EVENT_STATUS, EVENT_TYPES } from '../store/store';

function OutcomeForm({ event, onSave }) {
  const [choice, setChoice] = useState(event.outcome?.final_choice || '');
  const [result, setResult] = useState(event.outcome?.actual_result || '');
  const [reflection, setReflection] = useState(event.outcome?.reflection || '');

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-b1">
      <Field label="我最后怎么选的">
        <div className="flex gap-2 flex-wrap mb-2">
          {event.options.map(o => (
            <button key={o.option_id} onClick={() => setChoice(o.name)}
              className={`px-3 py-1 rounded-lg text-[12px] border transition-colors ${choice === o.name ? 'border-jade/40 bg-tint-jade text-jade' : 'border-b1 text-t3 hover:text-t2'}`}>
              {o.name}
            </button>
          ))}
        </div>
        <input value={choice} onChange={e => setChoice(e.target.value)} placeholder="也可以直接写" className={inputCls} />
      </Field>
      <Field label="后来实际发生了什么">
        <textarea value={result} onChange={e => setResult(e.target.value)} rows={3} placeholder="过了一段时间之后，真实的结果是……" className={`${inputCls} resize-none`} />
      </Field>
      <Field label="现在回头看，当时的判断怎么样">
        <textarea value={reflection} onChange={e => setReflection(e.target.value)} rows={2} placeholder="当时哪些考虑是对的，哪些没想到……" className={`${inputCls} resize-none`} />
      </Field>
      <Button size="sm" onClick={() => onSave(event.event_id, { final_choice: choice, actual_result: result, reflection })}>
        保存
      </Button>
      <p className="text-[11px] text-t4 leading-relaxed">
        补充现实结果不会改变你的命盘，也不会覆盖当时的解读；它只影响之后 AI 对你历史行为的理解。
      </p>
    </div>
  );
}

export default function MyPath({ view, events, onSetOutcome, onOpenEvent, onFocus }) {
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('all');

  const base = view === 'path-done'
    ? events.filter(e => ['chosen', 'waiting', 'reviewed', 'archived'].includes(e.status))
    : view === 'path-review'
      ? events.filter(e => e.outcome?.final_choice)
      : events;

  const list = filter === 'all' ? base : base.filter(e => e.status === filter);

  const title = view === 'path-done' ? '已完成事件' : view === 'path-review' ? '回看' : '事件记录';
  const subtitle = view === 'path-review'
    ? '当时你怎么看，最后怎么选，后来实际发生了什么——这三样放在一起，才是有用的记录。'
    : '每一个现实事件都会自动进入这里。原始解读永久保留，你可以随时回来补充后续。';

  if (!events.length) {
    return <Empty icon="⟡" title="还没有走过的路" desc="在「我遇到的事」里建立第一件事，它会自动进入这里。" />;
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-4">
        <PageHeader title={title} subtitle={subtitle} />

        <Tabs
          value={filter}
          onChange={setFilter}
          size="sm"
          tabs={[{ key: 'all', label: '全部' }, ...Object.entries(EVENT_STATUS).map(([k, v]) => ({ key: k, label: v.label }))]}
        />

        <div className="space-y-3">
          {list.map(e => {
            const open = expanded === e.event_id;
            const st = EVENT_STATUS[e.status];
            const type = EVENT_TYPES.find(t => t.key === e.event_type);
            return (
              <Card key={e.event_id} className="!p-0">
                <button
                  onClick={() => { setExpanded(open ? null : e.event_id); onFocus?.(`事件：${e.title}`); }}
                  className="w-full text-left px-5 py-4 hover:bg-subtle transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm text-t1">{e.title}</div>
                      <div className="text-[11px] text-t4 mt-1.5 flex items-center gap-2 flex-wrap">
                        <span>{new Date(e.created_at).toLocaleDateString('zh-CN')}</span>
                        <span className="text-t5">·</span>
                        <span>{type?.label}</span>
                        <span className="text-t5">·</span>
                        <span>{e.options.length} 个选项</span>
                        <span className="text-t5">·</span>
                        <span>{e.readings.length} 次解读</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] shrink-0" style={{ background: tint(st.color, 11), color: st.color }}>{st.label}</span>
                  </div>
                  {e.outcome?.final_choice && (
                    <div className="text-[12px] text-jade/70 mt-2">最终选择：{e.outcome.final_choice}</div>
                  )}
                </button>

                {open && (
                  <div className="px-5 pb-5 animate-in">
                    {e.description && <p className="text-[12px] text-t3 leading-relaxed mb-3">{e.description}</p>}

                    <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-2">当时的解读（不可覆盖）</div>
                    {e.readings.length ? (
                      <div className="space-y-2">
                        {e.readings.map(r => (
                          <div key={r.reading_id} className="rounded-xl border border-b1 bg-inset px-4 py-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] text-t3">{r.system === 'multi' ? '多体系' : r.system}</span>
                              <span className="text-[10px] font-mono text-t4">{new Date(r.created_at).toLocaleString('zh-CN')}</span>
                            </div>
                            <p className="text-[12px] text-t2 leading-relaxed">{r.result?.summary}</p>
                            {r.result?.consensus && <p className="text-[12px] text-t3 mt-1.5 leading-relaxed"><span className="text-jade/60">共识 </span>{r.result.consensus}</p>}
                            {r.result?.variables?.map((v, i) => (
                              <p key={i} className="text-[12px] text-t3 mt-1 leading-relaxed"><span className="text-violet/60">取舍 </span>{v}</p>
                            ))}
                            {r.result?.optionTendencies && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.result.optionTendencies.map((o, i) => (
                                  <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-hover text-t3">{o.name} → {o.tendency}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-t4">这件事还没有做过解读。</p>
                    )}

                    <div className="mt-4">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-1">后来怎么样了？</div>
                      <OutcomeForm event={e} onSave={onSetOutcome} />
                    </div>

                    <div className="mt-4 pt-3 border-t border-b1">
                      <Button variant="ghost" size="sm" onClick={() => onOpenEvent(e)}>回到这件事的工作台</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          {!list.length && <p className="text-[12px] text-t4 px-1">这个筛选下暂时没有记录。</p>}
        </div>

        <Disclaimer />
      </div>
    </div>
  );
}
