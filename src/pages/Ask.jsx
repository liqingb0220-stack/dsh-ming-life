import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Button, Tabs, inputCls, tint } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import Interpretation from '../components/Interpretation';
import AskDSH from '../components/AskDSH';
import HexagramView, { MeihuaView } from '../components/HexagramView';
import { DomainChips } from './Reveal';
import { yearSignals, yearToText } from '../engines/signals';
import { buildRequest, buildFollowUp } from '../dsh/facts';

/**
 * 一个问题的所有轮次：第 1 轮是 event:<id>，之后的追问是 event:<id>#2、#3……
 * 每一轮都是 interpretations 里独立的一条，走同一套写回协议。
 */
export function roundsOf(event, interp) {
  const baseKey = `event:${event.event_id}`;
  const follows = Object.entries(interp)
    .filter(([k]) => k.startsWith(`${baseKey}#`))
    .map(([k, v]) => ({ key: k, round: Number(k.slice(baseKey.length + 1)) || 0, it: v, question: v?.question || '' }))
    .filter(r => r.round >= 2)
    .sort((a, b) => a.round - b.round);
  return [{ key: baseKey, round: 1, it: interp[baseKey], question: event.question }, ...follows];
}

/** 我有事想问：一个问题 = 一件事。工作台起卦、摆事实；DSH 解读；追问是同一问题的下一轮。 */
export default function Ask({ events, activeEvent, profile, bazi, ziwei, corr, gender, interp, hosted, onAsk, onOpen, onRemove, onOutcome, onRequest }) {
  const [text, setText] = useState('');
  const [follow, setFollow] = useState('');
  const [round, setRound] = useState(null); // null = 看最新一轮
  const [outcome, setOutcome] = useState(activeEvent?.outcome?.actual_result || '');
  const year = new Date().getFullYear();
  const ys = useMemo(() => yearSignals(bazi, ziwei, gender, year), [bazi, ziwei, gender, year]);
  const questions = events.filter(e => e.event_type === 'question' || e.question);

  useEffect(() => { setRound(null); setFollow(''); }, [activeEvent?.event_id]);

  const submit = () => { const q = text.trim(); if (!q) return; onAsk(q); setText(''); };

  if (activeEvent) {
    const e = activeEvent;
    const rounds = roundsOf(e, interp);
    const latest = rounds[rounds.length - 1];
    const current = rounds.find(r => r.round === round) || latest;
    const ctx = { profile, bazi, ziwei, corr, gender, event: e };
    const previousOf = r => rounds.filter(x => x.round < r.round).map(x => ({ question: x.question, text: x.it?.text || '' }));
    const requestOf = r => (r.round === 1 ? buildRequest('event', ctx) : buildFollowUp({ ...ctx, round: r.round, question: r.question, previous: previousOf(r) }));
    const request = requestOf(current);

    // 追问：新开一轮，进 pending，交给 DSH；DSH 写回后这一轮就出现在解读里
    const nextRound = latest.round + 1;
    const nextRequest = () => buildFollowUp({ ...ctx, round: nextRound, question: follow.trim(), previous: rounds.map(x => ({ question: x.question, text: x.it?.text || '' })) });
    const submitFollow = () => { if (!follow.trim()) return; onRequest(nextRequest()); setFollow(''); setRound(nextRound); };
    const latestAnswered = !!latest.it?.text;

    const tabs = rounds.length > 1 ? (
      <Tabs size="sm" value={current.round} onChange={setRound} tabs={rounds.map(r => ({
        key: r.round,
        label: (
          <span className="flex items-center gap-1.5">
            {r.round === 1 ? '第一次解读' : `追问 ${r.round - 1}`}
            {r.it?.status === 'pending' && !r.it?.text && <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />}
          </span>
        )
      }))} />
    ) : null;
    const lead = current.round > 1 ? (
      <div className="rounded-xl bg-subtle border border-b1 px-4 py-3 text-[13px] text-t2 leading-relaxed">
        <span className="text-[10px] uppercase tracking-[0.18em] text-t4 mr-2">你说</span>{current.question}
      </div>
    ) : null;

    return (
      <div className="h-full overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-8 py-10 space-y-4">
          <PageHeader title={e.question} subtitle={`${new Date(e.created_at).toLocaleString('zh-CN')} 问${rounds.length > 1 ? ` · 追问了 ${rounds.length - 1} 轮` : ''}`} />

          <Interpretation key={current.key} it={current.it} request={request} hosted={hosted} auto={current.round === 1} onRequest={onRequest} size="lg"
            title={current.round === 1 ? 'DSH 的解读' : `DSH 的解读 · 第 ${current.round} 轮`} tabs={tabs} lead={lead}
            empty={current.round > 1 ? '这一轮 DSH 还没有写回。' : ''} />

          <Card title="继续问" right={<span className="text-[11px] text-t4">{latestAnswered ? '答案会作为下一轮出现在上面' : 'DSH 还没答完这一轮，也可以先问'}</span>}>
            <div className="flex gap-2">
              <input value={follow} onChange={ev => setFollow(ev.target.value)} onKeyDown={ev => { if (ev.key === 'Enter' && hosted) submitFollow(); }}
                placeholder="就这段解读继续追问，或回答 DSH 想先问你的问题……" className={inputCls} />
              {hosted
                ? <Button size="sm" disabled={!follow.trim()} onClick={submitFollow} className="shrink-0">发给 DSH</Button>
                : <AskDSH prompt={follow.trim() ? nextRequest().prompt : ''} label="发给 DSH" className="shrink-0" />}
            </div>
          </Card>

          <Card title="为这一问起的卦" right={<span className="text-[11px] text-t4">建问题时起的，不会变</span>}>
            {e.cast ? (
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-2">六爻</div>
                  {e.cast.liuyao?.gua ? <HexagramView gua={e.cast.liuyao.gua} /> : null}
                  <p className="text-[11px] text-t4 mt-2 leading-relaxed">{e.cast.liuyao?.text}</p>
                </div>
                <div className="pt-4 border-t border-b1">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-2">梅花</div>
                  {e.cast.meihua?.gua ? <MeihuaView g={e.cast.meihua.gua} /> : null}
                  <p className="text-[11px] text-t4 mt-2 leading-relaxed">{e.cast.meihua?.text}</p>
                </div>
              </div>
            ) : <p className="text-[12px] text-t4">这个问题没有起卦。</p>}
          </Card>

          {ys && (
            <Card title={`${year} 年的盘面`}>
              <DomainChips ys={ys} />
              <p className="text-[11px] text-t4 mt-2 whitespace-pre-line leading-relaxed">{yearToText(ys).split('\n')[0]}</p>
            </Card>
          )}

          <Card title="后来怎么样了" right={<span className="text-[11px] text-t4">可不填；填了 DSH 下次能回看</span>}>
            <div className="flex gap-2">
              <input value={outcome} onChange={ev => setOutcome(ev.target.value)} placeholder="过了一段时间之后……" className={inputCls} />
              <Button size="sm" disabled={!outcome.trim()} onClick={() => onOutcome(e.event_id, outcome.trim())}>记下</Button>
            </div>
            {e.outcome?.actual_result && <p className="text-[11px] text-jade/70 mt-2">已记：{e.outcome.actual_result}</p>}
          </Card>

          <div className="flex items-center justify-between">
            <Disclaimer />
            <button onClick={() => onRemove(e.event_id)} className="text-[11px] text-t5 hover:text-cinnabar/70 shrink-0 ml-4">删除这个问题</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-5">
        <PageHeader title="我有事想问" subtitle="用你自己的话问。工作台会为这一问起卦、把今年的盘面摆出来，然后交给 DSH 解读。不用先分类。" />
        <div className="rounded-2xl border border-b1 bg-card p-5 shadow-card">
          <textarea value={text} onChange={ev => setText(ev.target.value)} rows={3} autoFocus
            onKeyDown={ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') submit(); }}
            placeholder="例如：是否接受一份新的工作机会？　下半年是否适合转换方向？　这段关系是否继续？"
            className="w-full bg-transparent outline-none resize-none text-[15px] leading-relaxed text-t1 placeholder:text-t5" />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-t5">⌘ + 回车</span>
            <Button size="sm" disabled={!text.trim()} onClick={submit}>提问</Button>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-t4 px-1">问过的</div>
            {questions.map(e => {
              const rs = roundsOf(e, interp);
              const it = rs[rs.length - 1].it; // 看最新一轮的状态
              const st = it?.status === 'done' ? { t: rs.length > 1 ? `已解读 · 追问 ${rs.length - 1} 轮` : '已解读', c: 'var(--jade)' } : it?.status === 'pending' ? { t: 'DSH 解读中', c: 'var(--gold)' } : { t: '未解读', c: 'var(--t4)' };
              return (
                <button key={e.event_id} onClick={() => onOpen(e)} className="w-full text-left rounded-xl border border-b1 bg-card px-5 py-3.5 hover:border-b2 transition-colors flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[14px] text-t1 truncate">{e.question || e.title}</div>
                    <div className="text-[11px] text-t4 mt-1">{new Date(e.created_at).toLocaleDateString('zh-CN')}{e.cast?.liuyao?.gua ? ` · ${e.cast.liuyao.gua.ben.name}` : ''}{e.outcome?.actual_result ? ' · 有后续' : ''}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] shrink-0" style={{ background: tint(st.c, 11), color: st.c }}>{st.t}</span>
                </button>
              );
            })}
          </div>
        )}
        <Disclaimer />
      </div>
    </div>
  );
}
