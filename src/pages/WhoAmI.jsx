import React, { useMemo } from 'react';
import { PageHeader, Card, Bar, tint } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import Interpretation from '../components/Interpretation';
import { SignalList } from './Reveal';
import { buildPortrait } from '../engines/portrait';
import { tenGodShares } from '../engines/distribution';
import { chartSignals } from '../engines/signals';
import { buildRequest } from '../dsh/facts';

import { WX_COLOR as WX, tenGodColor } from '../data/colors';

/** 我是谁：工作台摆结构（五行、十神、六维、紫微），结论由 DSH 写。 */
export default function WhoAmI({ bazi, ziwei, profile, corr, gender, interp, hosted, onRequest }) {
  const portrait = useMemo(() => buildPortrait(bazi, ziwei), [bazi, ziwei]);
  const shares = useMemo(() => tenGodShares(bazi).filter(s => s.pct > 0).sort((a, b) => b.pct - a.pct), [bazi]);
  const signals = useMemo(() => chartSignals(bazi, ziwei), [bazi, ziwei]);
  const request = useMemo(() => buildRequest('who', { profile, bazi, ziwei, corr, gender }), [profile, bazi, ziwei, corr, gender]);
  const body = ziwei?.palaces.find(p => p.isBody);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-5">
        <PageHeader title="我是谁" subtitle="下面的结构是排盘算出来的，稳定、可核对；结论那一块由 DSH 根据这些结构来写。" />

        <Interpretation it={interp[request.key]} request={request} hosted={hosted} onRequest={onRequest} size="lg" title="DSH 的解读" />

        <div className="grid grid-cols-2 gap-4">
          <Card title="五行">
            <div className="space-y-2">
              {Object.entries(bazi.wuxingPct).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-5 text-[13px]" style={{ color: WX[k] }}>{k}</span>
                  <div className="flex-1"><Bar value={v} color={WX[k]} height={5} /></div>
                  <span className="w-12 text-right text-[11px] font-mono text-t3">{v}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-t4">日主 {bazi.dayMaster.gan}（{bazi.dayMaster.wuxing}）{bazi.strength.label}，喜 {bazi.strength.favor.join('、')}。</p>
          </Card>
          <Card title="十神占比" right={<span className="text-[10px] text-t4">颜色 = 相对日主的五行</span>}>
            <div className="space-y-2">
              {shares.map(s => (
                <div key={s.god} className="flex items-center gap-3">
                  <span className="w-9 text-[12px]" style={{ color: tenGodColor(s.god, bazi.dayMaster.wuxing) }}>{s.god}</span>
                  <div className="flex-1"><Bar value={s.pct} color={tenGodColor(s.god, bazi.dayMaster.wuxing)} height={5} /></div>
                  <span className="w-10 text-right text-[11px] font-mono text-t3">{s.pct}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="六个维度" right={<span className="text-[11px] text-t4">0–100，八字与紫微合算</span>}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {portrait.dimensions.map(d => (
              <div key={d.key}>
                <div className="flex justify-between text-[12px] mb-1"><span className="text-t2">{d.label}</span><span className="font-mono text-t4">{d.score}</span></div>
                <Bar value={d.score} color={d.color || 'var(--jade)'} height={4} />
              </div>
            ))}
          </div>
        </Card>

        {ziwei && (
          <Card title="紫微">
            <div className="grid grid-cols-3 gap-3 text-[12px]">
              <div className="rounded-xl bg-subtle px-3 py-2.5"><div className="text-[10px] text-t4">命宫</div><div className="text-t1 mt-0.5">{ziwei.soulPalace.stem}{ziwei.soulPalace.branch} · {ziwei.soulMajors.map(s => s.name).join('、') || '无主星'}</div></div>
              <div className="rounded-xl bg-subtle px-3 py-2.5"><div className="text-[10px] text-t4">身宫</div><div className="text-t1 mt-0.5">{body ? `${body.name} · ${body.majorStars.filter(s => s.isMajor).map(s => s.name).join('、') || '无主星'}` : '—'}</div></div>
              <div className="rounded-xl bg-subtle px-3 py-2.5"><div className="text-[10px] text-t4">五行局</div><div className="text-t1 mt-0.5">{ziwei.fiveElementsClass}</div></div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {ziwei.palaces.map(p => (
                <div key={p.index} className={`rounded-lg px-2 py-1.5 border ${p.isSoul ? 'border-gold/40 bg-tint-gold' : 'border-b1'}`}>
                  <div className="text-[10px] text-t4">{p.name}{p.isBody ? '·身' : ''}</div>
                  <div className="text-[11px] text-t2 truncate">{p.majorStars.filter(s => s.isMajor).map(s => `${s.name}${s.mutagen ? `化${s.mutagen}` : ''}`).join(' ') || '—'}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <SignalList signals={signals} />
        <Disclaimer />
      </div>
    </div>
  );
}
