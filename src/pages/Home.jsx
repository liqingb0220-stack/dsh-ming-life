import React, { useMemo } from 'react';
import { PageHeader, Card, Button } from '../components/ui';
import Disclaimer, { FictionBadge } from '../components/Disclaimer';
import { DomainChips } from './Reveal';
import { yearSignals } from '../engines/signals';

const ENTRIES = [
  { key: 'who', icon: '☯', title: '认识我', color: '#e8b96a', text: '命局结构、六个维度、以及 DSH 给的结论。', links: [{ key: 'who', label: '我是谁' }, { key: 'where-to', label: '我将去向何方' }] },
  { key: 'ask', icon: '⌘', title: '我有事想问', color: '#4fd6b8', text: '直接问。工作台起卦、摆事实，DSH 解读。', links: [{ key: 'ask', label: '去问' }] },
  { key: 'who-with', icon: '⁂', title: '谁与我同行', color: '#6bb8ff', text: '两个人的结构差在哪、能不能分工。', links: [{ key: 'who-with', label: '合盘' }] },
  { key: 'alternate', icon: '⧗', title: '我的另一条时间线', color: '#a98cf5', text: '改变一个选择，看看另一种人生。', fiction: true, links: [{ key: 'alternate', label: '进入' }] }
];

export default function Home({ onNavigate, bazi, ziwei, gender, events, onOpenEvent }) {
  const year = new Date().getFullYear();
  const ys = useMemo(() => (bazi ? yearSignals(bazi, ziwei, gender, year) : null), [bazi, ziwei, gender, year]);
  const recent = events.filter(e => e.question).slice(0, 3);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <PageHeader title="今天，你想看人生的哪一部分？" subtitle="排盘引擎算事实，规则引擎标信号，DSH 负责真正的解读。" />

        <div className="grid grid-cols-2 gap-4">
          {ENTRIES.map(e => (
            <button key={e.key} onClick={() => onNavigate(e.links[0].key)}
              className="text-left rounded-2xl border border-b1 bg-card p-6 hover:border-b2 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl" style={{ color: e.color }}>{e.icon}</span>
                <h3 className="font-display text-lg text-t1">{e.title}</h3>
                {e.fiction && <FictionBadge />}
              </div>
              <p className="text-[13px] text-t3 leading-relaxed">{e.text}</p>
              <div className="mt-4 flex gap-2 flex-wrap">
                {e.links.map(l => (
                  <span key={l.key} onClick={ev => { ev.stopPropagation(); onNavigate(l.key); }}
                    className="px-2.5 py-1 rounded-md text-[12px] border border-b1 text-t3 group-hover:text-t2 group-hover:border-b2 transition-colors">{l.label} ›</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="col-span-3">
            <Card title="现在">
              {ys ? (
                <div>
                  <div className="flex items-baseline gap-3"><span className="font-display text-2xl text-t1">{ys.year}</span><span className="text-[12px] text-t3">{ys.age} 岁 · {ys.stage} · 流年 {ys.liuNian.split('（')[0]}{ys.daYun ? ` · 大运 ${ys.daYun}` : ''}</span></div>
                  <div className="mt-3"><DomainChips ys={ys} /></div>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => onNavigate('where-to')}>请 DSH 解读现在与未来十年 ›</Button>
                </div>
              ) : <p className="text-[12px] text-t4">缺公历出生日期，定位不了流年。</p>}
            </Card>
          </div>
          <div className="col-span-2 space-y-4">
            <Card title="最近问的">
              {recent.length ? recent.map(e => (
                <button key={e.event_id} onClick={() => onOpenEvent(e)} className="block w-full text-left text-[12.5px] text-t2 hover:text-t1 py-1 truncate">{e.question}</button>
              )) : <p className="text-[12px] text-t4">还没问过。</p>}
            </Card>
            {bazi && (
              <button onClick={() => onNavigate('reveal')} className="w-full text-left rounded-2xl border border-b1 bg-card hover:border-b2 transition-colors px-4 py-3">
                <div className="text-[13px] text-t1">回看命盘开卷</div>
                <div className="text-[11px] text-t4 mt-0.5">欢迎页那段简短解读</div>
              </button>
            )}
          </div>
        </div>
        <div className="mt-6"><Disclaimer /></div>
      </div>
    </div>
  );
}
