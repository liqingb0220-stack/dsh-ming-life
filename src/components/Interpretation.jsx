import React, { useEffect, useState, useRef } from 'react';
import Md from './Md';
import { Button, inputCls } from './ui';
import * as DSH from '../dsh/bridge';

// 同一次会话里，同一个 key+hash 只自动发一次
const requested = new Set();

/**
 * 一块由 DSH 写的解读。
 * 工作台负责：把事实与信号交出去、显示加载、把写回的文本渲染出来。
 * 装在 DSH 里时自动发送；单机时给用户一段可复制的话。
 */
export default function Interpretation({ it, request, hosted, auto = true, title = 'DSH 的解读', onRequest, size = 'md', empty = '', tabs = null, lead = null }) {
  const { key, prompt, hash } = request;
  const [tick, setTick] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const timer = useRef(null);

  // DSH 有时只填了 text 没改 status：只要 text 比这次请求新，就当写回了
  const textFresh = !!it?.text && (!it.request?.at || !it.at || it.at >= it.request.at);
  const done = !!it?.text && (it.status === 'done' || (it.status !== 'pending' && textFresh) || (it.status === 'pending' && textFresh && it.at && it.request?.at && it.at > it.request.at));
  const pending = it?.status === 'pending' && !done;
  const stale = done && !DSH.snapshotMode && it.request?.hash && hash && it.request.hash !== hash;

  useEffect(() => {
    if (!hosted || !auto || DSH.snapshotMode) return;
    const tag = `${key}|${hash}`;
    if (requested.has(tag)) return;
    if (!it || (stale && !pending)) { requested.add(tag); onRequest(request); }
  }, [hosted, auto, key, hash, !!it, stale, pending]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pending) return undefined;
    timer.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer.current);
  }, [pending]);

  const waited = pending && it.request?.at ? Math.max(0, Math.round((Date.now() - new Date(it.request.at).getTime()) / 1000)) : 0;
  const tooLong = pending && waited > 150;
  const slow = pending && waited > 45;
  const remind = () => DSH.ask({ auto: true, key, question: `【提醒写回 #${key}】你刚才如果已经在对话里回答了「${title}」，请把那段回答原样写进 profile.json 的 interpretations["${key}"]：status 改成 "done"，text 填全文，at 填 ISO 时间。如果还没回答，请现在回答并写回。` });

  return (
    <section className="rounded-2xl border border-b1 bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-[11px] uppercase tracking-[0.2em] text-t4">{title}</div>
        <div className="flex items-center gap-2">
          {pending && <span className="text-[11px] text-gold flex items-center gap-1.5"><span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />DSH 正在解读 · {waited}s</span>}
          {done && !pending && <span className="text-[10px] text-t4 font-mono">{it.at ? new Date(it.at).toLocaleString('zh-CN') : ''}</span>}
          {hosted && slow && !tooLong && <Button size="sm" variant="ghost" onClick={remind}>DSH 只在对话里答了？让它写回</Button>}
          {hosted && (done || tooLong) && <Button size="sm" variant="ghost" onClick={() => onRequest(request, true)}>{tooLong ? '再发一次' : '重新解读'}</Button>}
        </div>
      </div>

      {tabs && <div className="mb-3">{tabs}</div>}
      {lead && <div className="mb-3">{lead}</div>}

      {done && <div className={stale ? 'opacity-60' : ''}><Md text={it.text} size={size} /></div>}
      {stale && <p className="mt-2 text-[11px] text-gold">盘面事实变了（比如改了出生信息），正在按新的重新解读；上面是旧版本。</p>}

      {pending && !done && (
        <div className="space-y-2.5 py-1">
          {[92, 100, 78, 96, 60].map((w, i) => <div key={i} className="h-3 rounded bg-hover animate-pulse" style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }} />)}
          <p className="text-[11px] text-t4 pt-1">事实和信号已经交给 DSH，它写回档案后会自动出现在这里。{slow ? ' 如果右侧对话里已经有回答但这里没出现，点上面的按钮提醒它写回。' : ''}</p>
        </div>
      )}

      {!done && !pending && (
        hosted
          ? <div className="text-[12px] text-t4">{empty || '还没有解读。'}{auto ? '' : <Button size="sm" className="ml-2" onClick={() => onRequest(request)}>让 DSH 解读</Button>}</div>
          : (
            <div>
              <p className="text-[12px] text-t4 leading-relaxed">{empty || '这一块由 DSH 生成。装在 DSH 里会自动请求；这里可以把下面这段话复制给你在用的对话。'}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => setShowPrompt(s => !s)}>{showPrompt ? '收起' : '看要发给 DSH 的话'}</Button>
              {showPrompt && <textarea readOnly value={prompt} rows={10} className={`${inputCls} mt-2 text-[12px] font-mono leading-relaxed resize-y`} onFocus={e => e.target.select()} />}
            </div>
          )
      )}
      {hosted && !auto && !done && pending && null}
    </section>
  );
}
