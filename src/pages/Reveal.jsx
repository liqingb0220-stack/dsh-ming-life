import React, { useMemo, useState } from 'react';
import { Button, tint } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import Interpretation from '../components/Interpretation';
import { chartSignals, yearSignals } from '../engines/signals';
import { buildRequest } from '../dsh/facts';

const WX = { 木: 'var(--wx-mu)', 火: 'var(--wx-huo)', 土: 'var(--wx-tu)', 金: 'var(--wx-jin)', 水: 'var(--wx-shui)' };

/** 信号列表：规则引擎标出来的，按组折叠 */
export function SignalList({ signals, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const groups = [...new Set(signals.map(s => s.group))];
  return (
    <div className="rounded-2xl border border-b1 bg-subtle">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left px-5 py-3.5 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-t2">盘面事实与信号 · {signals.length} 条</div>
          <div className="text-[11px] text-t4 mt-0.5">排盘引擎算出的事实，规则引擎标出的信号。上面的解读就是从这些来的。</div>
        </div>
        <span className={`text-t4 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 animate-in">
          {groups.map(g => (
            <div key={g}>
              <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-1.5">{g}</div>
              <ul className="space-y-1">
                {signals.filter(s => s.group === g).map((s, i) => (
                  <li key={i} className="text-[12.5px] leading-relaxed flex gap-2">
                    <span className="text-t3 shrink-0">{s.label}</span>
                    <span className="text-t1">{s.value}</span>
                    {s.detail && <span className="text-t4">— {s.detail}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DomainChips({ ys }) {
  if (!ys) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {ys.domains.map(d => (
        <span key={d.key} className="px-2 py-0.5 rounded text-[11px]" style={{ background: tint(d.color, d.score >= 2 ? 14 : 6), color: d.score >= 2 ? d.color : 'var(--t4)' }} title={d.why.join('；')}>
          {d.label} · {d.level}
        </span>
      ))}
    </div>
  );
}

/** 命盘开卷——建档后的第一屏：欢迎 + 事实 + DSH 的简短解读。 */
export default function Reveal({ bazi, ziwei, profile, corr, gender, interp, hosted, onRequest, onNavigate, onSeen }) {
  const year = new Date().getFullYear();
  const signals = useMemo(() => chartSignals(bazi, ziwei), [bazi, ziwei]);
  const ys = useMemo(() => yearSignals(bazi, ziwei, gender, year), [bazi, ziwei, gender, year]);
  const request = useMemo(() => buildRequest('reveal', { profile, bazi, ziwei, corr, gender }), [profile, bazi, ziwei, corr, gender]);
  const go = key => { onSeen?.(); onNavigate(key); };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-app">
      <div className="max-w-2xl mx-auto px-8 py-14">
        <div className="animate-in">
          <h1 className="font-display text-[30px] text-t1">你好，{profile.name}。</h1>
          <p className="mt-2 text-[15px] text-t3 leading-relaxed">欢迎你来到命理工作台，这是你简短的命理解读。</p>
        </div>

        <div className="mt-10 text-center animate-in" style={{ animationDelay: '.1s' }}>
          <div className="flex justify-center gap-3 mb-2">
            {bazi.pillars.map(p => (
              <div key={p.pos} className="text-center">
                <div className="font-display text-[34px] leading-none" style={{ color: WX[p.wuxingGan] }}>{p.gan}</div>
                <div className="font-display text-[34px] leading-none mt-1" style={{ color: WX[p.wuxingZhi] }}>{p.zhi}</div>
                <div className="text-[10px] text-t5 mt-2">{p.pos}</div>
              </div>
            ))}
          </div>
          <div className="text-[12px] text-t4 mt-3">
            日主 {bazi.dayMaster.gan}（{bazi.dayMaster.wuxing}）· {bazi.strength.label} · 喜 {bazi.strength.favor.join('、')}
            {ziwei && <> · 命宫 {ziwei.soulMajors.map(s => s.name).join('、') || '无主星'}</>}
          </div>
          {corr?.applied && <div className="text-[11px] text-t4 mt-1.5">{corr.note}</div>}
          {corr?.note && !corr.applied && <div className="text-[11px] text-gold/80 mt-1.5">{corr.note}</div>}
          {ys && <div className="mt-4 flex justify-center"><DomainChips ys={ys} /></div>}
        </div>

        <div className="mt-10 animate-in" style={{ animationDelay: '.2s' }}>
          <Interpretation it={interp[request.key]} request={request} hosted={hosted} onRequest={onRequest} size="lg" title="DSH 的解读" />
        </div>

        <div className="mt-4 animate-in" style={{ animationDelay: '.3s' }}>
          <SignalList signals={signals} />
        </div>

        <div className="mt-10 grid gap-3 animate-in" style={{ animationDelay: '.4s' }}>
          {[
            { key: 'who', title: '我是谁', desc: '命局结构、六个维度、DSH 的解读' },
            { key: 'where-to', title: '我将去向何方', desc: '现在所处的阶段，以及未来十年信号最集中的几段' },
            { key: 'ask', title: '我有事想问', desc: '直接问，工作台起卦、摆事实，DSH 解读' }
          ].map(e => (
            <button key={e.key} onClick={() => go(e.key)}
              className="text-left rounded-2xl border border-b1 bg-card hover:border-b2 hover:bg-hover transition-all px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[15px] text-t1">{e.title}</div>
                <div className="text-[12px] text-t4 mt-0.5">{e.desc}</div>
              </div>
              <span className="text-t4 text-lg">›</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => go('home')}>进入工作台</Button>
          <span className="text-[11px] text-t4">左上角随时可以回到这一页</span>
        </div>
        <div className="mt-8"><Disclaimer compact /></div>
      </div>
    </div>
  );
}
