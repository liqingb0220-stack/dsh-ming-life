import React, { useState } from 'react';
import { SYSTEM_SHORT } from '../engines/insight';
import { tint } from './ui';
import { Annotated } from './Term';

const SYS_COLOR = {
  bazi: 'var(--gold)', ziwei: 'var(--violet)', liuyao: 'var(--jade)', meihua: 'var(--azure)',
  huangli: 'var(--cinnabar)', sound: 'var(--azure)', shape: 'var(--violet)', meaning: 'var(--gold)'
};

/**
 * 全产品统一的判断展示：
 *   人话（默认可见） → 各体系怎么看 → 具体依据
 * 术语一律自动加注，读者点一下就能看到它是什么意思。
 */
export default function WhyCard({ insight, dense = false, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [openSys, setOpenSys] = useState({});
  if (!insight) return null;

  return (
    <div className={`rounded-2xl border border-b1 bg-card shadow-card ${dense ? 'p-4' : 'p-5'}`}>
      {insight.title && <div className="text-[11px] uppercase tracking-[0.2em] text-t4 mb-2">{insight.title}</div>}
      <p className="text-[16px] leading-[1.7] text-t1 font-medium">
        <Annotated text={insight.summary} />
      </p>

      {insight.scenes?.length > 0 && (
        <ul className="mt-3 space-y-2">
          {insight.scenes.map((sc, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-[1.75] text-t2">
              <span className="text-t5 shrink-0 select-none mt-[3px]">—</span>
              <span><Annotated text={sc} /></span>
            </li>
          ))}
        </ul>
      )}

      {insight.because && (
        <p className="mt-3 text-[13.5px] leading-[1.75] text-t3">
          <Annotated text={insight.because} />
        </p>
      )}

      {insight.cost && (
        <div className="mt-3 rounded-xl border-l-2 border-gold pl-3 py-0.5">
          <span className="text-[11px] text-gold block mb-0.5">要留意的地方</span>
          <p className="text-[13.5px] leading-[1.7] text-t2"><Annotated text={insight.cost} /></p>
        </div>
      )}

      {insight.gift && (
        <div className="mt-2 rounded-xl border-l-2 border-jade pl-3 py-0.5">
          <span className="text-[11px] text-jade block mb-0.5">这也是你的长处</span>
          <p className="text-[13.5px] leading-[1.7] text-t2"><Annotated text={insight.gift} /></p>
        </div>
      )}

      {insight.advice && (
        <div className="mt-3 rounded-xl bg-tint-jade px-3.5 py-2.5">
          <span className="text-[11px] text-jade block mb-1">可以试试</span>
          <p className="text-[13.5px] leading-[1.7] text-t2"><Annotated text={insight.advice} /></p>
        </div>
      )}

      {insight.note && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-t3">
          <Annotated text={insight.note} />
        </p>
      )}

      {insight.systems.length > 0 && (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            className="mt-3 text-[12.5px] text-jade hover:opacity-80 transition-opacity flex items-center gap-1"
          >
            <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
            {open ? '收起' : '这是根据什么说的？'}
          </button>

          {open && (
            <div className="mt-3 space-y-2 animate-in">
              {insight.systems.map((s, i) => (
                <div key={i} className="rounded-xl border border-b1 bg-subtle">
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SYS_COLOR[s.system] }} />
                      <span className="text-[12px] font-medium" style={{ color: SYS_COLOR[s.system] }}>{s.label}</span>
                    </div>
                    <p className="text-[13.5px] leading-[1.7] text-t2">
                      <Annotated text={s.interpretation} />
                    </p>
                    {s.evidence?.length > 0 && (
                      <button
                        onClick={() => setOpenSys(p => ({ ...p, [i]: !p[i] }))}
                        className="mt-2 text-[11.5px] text-t3 hover:text-t1 transition-colors"
                      >
                        {openSys[i] ? '收起原始盘面' : `看原始盘面（${s.evidence.length} 条）`}
                      </button>
                    )}
                  </div>

                  {openSys[i] && s.evidence?.length > 0 && (
                    <div className="border-t border-b1 bg-inset px-4 py-3 space-y-2 animate-in rounded-b-xl">
                      <p className="text-[11px] text-t4 leading-relaxed pb-1">
                        下面是没有经过转述的盘面原文，用来核对上面那段话是从哪儿来的。
                      </p>
                      {s.evidence.map((e, j) => (
                        <div key={j} className="flex items-start gap-2 text-[12px]">
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-hover text-t3 font-mono text-[10px] mt-px">{e.label}</span>
                          <div className="min-w-0">
                            <span className="text-t1 font-mono">{e.value}</span>
                            {e.detail && <span className="text-t3 ml-1.5"><Annotated text={`— ${e.detail}`} /></span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function SystemTag({ system }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: tint(SYS_COLOR[system], 11), color: SYS_COLOR[system] }}>
      {SYSTEM_SHORT[system]}
    </span>
  );
}
