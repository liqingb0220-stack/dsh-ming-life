import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Button, inputCls } from '../components/ui';
import { FictionBadge } from '../components/Disclaimer';
import Interpretation from '../components/Interpretation';
import { yearSignals } from '../engines/signals';
import { buildRequest } from '../dsh/facts';

const EXAMPLES = [
  '如果当年选择了另一所学校、另一个专业',
  '如果当年接受了那份外地的工作机会',
  '如果当年没有结束那段关系',
  '如果当年没有离开家乡'
];

/** 我的另一条时间线：只固定一个前提。命盘不变，只改一件事，看另一种可能性。 */
export default function Alternate({ timelines = [], profile, bazi, ziwei, corr, gender, interp = {}, hosted, onAdd, onRemove, onRequest }) {
  const [premise, setPremise] = useState('');
  const [year, setYear] = useState('');
  const list = timelines.filter(t => t.premise);
  const [activeId, setActiveId] = useState(list[0]?.timeline_id || null);   // 回到这页时默认打开最近一条
  const active = list.find(t => t.timeline_id === activeId) || null;
  const thisYear = new Date().getFullYear();

  const submit = () => {
    const p = premise.trim(); if (!p) return;
    const m = p.match(/(?:19|20)\d{2}/);
    const fy = Number(year) || (m ? Number(m[0]) : thisYear);
    const t = onAdd({ premise: p.replace(/^如果(当年|当初|那时)?/, '').trim(), from_year: fy });
    setPremise(''); setYear(''); setActiveId(t.timeline_id);
  };

  const request = useMemo(() => (active && bazi ? buildRequest('alt', { profile, bazi, ziwei, corr, gender, timeline: active }) : null), [active, profile, bazi, ziwei, corr, gender]);
  const then = useMemo(() => (active && bazi ? yearSignals(bazi, ziwei, gender, active.from_year) : null), [active, bazi, ziwei, gender]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="我的另一条时间线"
          subtitle="如果当年做了另一个决定，人生会变成什么样？命盘不变，只改那一件事。这里不算收入和资产，只看另一种可能性。"
          right={<div className="shrink-0 whitespace-nowrap"><FictionBadge /></div>}
        />

        <div className="rounded-2xl border border-b1 bg-card p-5 shadow-card">
          <textarea value={premise} onChange={e => setPremise(e.target.value)} rows={3}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(); }}
            placeholder="如果当年我……（只需要写清改变了哪一件事）"
            className="w-full bg-transparent outline-none resize-none text-[15px] leading-relaxed text-t1 placeholder:text-t5" />
          <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {EXAMPLES.map(x => <button key={x} onClick={() => setPremise(x)} className="px-2.5 py-1 rounded-full text-[11px] border border-b1 text-t3 hover:text-t1 hover:border-b2">{x}</button>)}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input value={year} onChange={e => setYear(e.target.value)} type="number" placeholder="哪一年（可不填）" className={`${inputCls} !w-36 !py-1 !text-[12px]`} />
              <Button size="sm" disabled={!premise.trim()} onClick={submit}>推演这条线</Button>
            </div>
          </div>
        </div>

        {active && request && (
          <div className="space-y-4 animate-in">
            <Card title={`如果当年……${active.premise}`} right={<span className="text-[11px] text-t4">{active.from_year} 年起</span>}>
              {then ? (
                <p className="text-[12px] text-t3 leading-relaxed">
                  分叉那年你 {then.age} 岁，{then.stage}{then.daYun ? `，大运 ${then.daYun}` : ''}，流年 {then.liuNian}。
                  {then.domains.filter(d => d.score >= 2).length ? `那一年盘面信号在${then.domains.filter(d => d.score >= 2).map(d => d.label).join('、')}。` : '那一年盘面比较安静。'}
                  这些是不会因为你的选择而变的部分。
                </p>
              ) : <p className="text-[12px] text-t4">缺公历出生日期，定位不了那一年。</p>}
            </Card>
            <Interpretation it={interp[request.key]} request={request} hosted={hosted} onRequest={onRequest} size="lg" title="DSH 的解读 · 另一种可能" />
          </div>
        )}

        {list.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-t4 px-1">分叉过的</div>
            {list.map(t => {
              const it = interp[`alt:${t.timeline_id}`];
              return (
                <div key={t.timeline_id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${activeId === t.timeline_id ? 'border-violet/40 bg-tint-violet' : 'border-b1 bg-card'}`}>
                  <button onClick={() => setActiveId(t.timeline_id)} className="text-left min-w-0 flex-1">
                    <div className="text-[13px] text-t1 truncate">如果当年……{t.premise}</div>
                    <div className="text-[11px] text-t4 mt-0.5">{t.from_year} 年起 · {it?.status === 'done' ? '已写' : it?.status === 'pending' ? 'DSH 写作中' : '未写'}</div>
                  </button>
                  <button onClick={() => { onRemove(t.timeline_id); if (activeId === t.timeline_id) setActiveId(null); }} className="text-t5 hover:text-cinnabar/70 shrink-0">×</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
