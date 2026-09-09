import React from 'react';

const Yao = ({ yang, moving, dim }) => (
  <div className="flex gap-1 items-center h-2">
    {yang ? (
      <div className="yao-line flex-1" style={{ background: dim ? 'var(--t5)' : 'var(--gold)' }} />
    ) : (
      <>
        <div className="yao-line" style={{ width: '42%', background: dim ? 'var(--t5)' : 'var(--gold)' }} />
        <div style={{ width: '16%' }} />
        <div className="yao-line" style={{ width: '42%', background: dim ? 'var(--t5)' : 'var(--gold)' }} />
      </>
    )}
    {moving && <span className="text-[9px] text-cinnabar shrink-0 -mr-2.5">○</span>}
  </div>
);

/** 六爻卦象。gua 来自 buildLiuYao */
export default function HexagramView({ gua, compact = false }) {
  if (!gua) return null;
  const yaos = [...gua.yao].reverse();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-11 space-y-1 shrink-0">
          {yaos.map(y => <Yao key={y.pos} yang={y.yang} moving={y.moving} />)}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] text-t2">
            {gua.ben.name}{gua.bian ? <span className="text-t4"> 之 {gua.bian.name}</span> : ''}
          </div>
          <div className="text-[10px] text-t4 mt-0.5">
            {gua.ben.meta.palaceName}宫{gua.ben.meta.posLabel} · 世{gua.shi.pos}应{gua.ying.pos} · {gua.ben.theme}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <div className="text-[10px] text-t4 mb-1.5 text-center">本卦</div>
          <div className="w-16 space-y-1.5">
            {yaos.map(y => <Yao key={y.pos} yang={y.yang} moving={y.moving} />)}
          </div>
          <div className="text-[11px] text-t2 mt-2 text-center whitespace-nowrap">{gua.ben.name}</div>
        </div>

        {gua.bian && (
          <div className="shrink-0">
            <div className="text-[10px] text-t4 mb-1.5 text-center">变卦</div>
            <div className="w-16 space-y-1.5">
              {[...gua.bian.bits].reverse().map((b, i) => <Yao key={i} yang={b === 1} dim />)}
            </div>
            <div className="text-[11px] text-t3 mt-2 text-center whitespace-nowrap">{gua.bian.name}</div>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          {yaos.map(y => (
            <div key={y.pos} className="flex items-center gap-2 text-[11px] leading-5">
              <span className="w-4 text-t4 font-mono">{y.pos}</span>
              <span className="w-11 font-mono text-t2">{y.ganZhi}</span>
              <span className="w-5 text-t4">{y.wuxing}</span>
              <span className="w-8 text-t2">{y.liuQin}</span>
              <span className="w-8 text-t4">{y.liuShen}</span>
              {y.isShi && <span className="px-1 rounded bg-tint-jade text-jade text-[10px]">世</span>}
              {y.isYing && <span className="px-1 rounded bg-tint-azure text-azure text-[10px]">应</span>}
              {y.moving && <span className="text-cinnabar text-[10px]">动 → {y.changedTo.ganZhi} {y.changedTo.liuQin}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="text-[12px] text-t3 leading-relaxed border-t border-b1 pt-3">
        <span className="text-t2">{gua.ben.name}</span>
        <span className="text-t4"> · {gua.ben.meta.palaceName}宫{gua.ben.meta.posLabel} · {gua.ben.theme}</span>
        <span className="ml-2">{gua.ben.plain}</span>
      </div>
    </div>
  );
}

/** 梅花卦象（体用） */
export function MeihuaView({ g }) {
  if (!g) return null;
  const Trio = ({ hex, label }) => (
    <div className="text-center">
      <div className="text-[10px] text-t4 mb-1.5">{label}</div>
      <div className="w-14 space-y-1.5 mx-auto">
        {[...hex.bits].reverse().map((b, i) => <Yao key={i} yang={b === 1} />)}
      </div>
      <div className="text-[11px] text-t2 mt-2 whitespace-nowrap">{hex.name}</div>
    </div>
  );
  return (
    <div className="flex items-start gap-8">
      <Trio hex={g.ben} label="本卦" />
      <Trio hex={g.hu} label="互卦" />
      <Trio hex={g.bian} label="变卦" />
      <div className="flex-1 min-w-0 space-y-1.5 text-[12px]">
        <div className="text-t2">体卦 <span className="text-jade">{g.ti.trigram.name}</span>（{g.ti.pos}·{g.ti.trigram.wuxing}） / 用卦 <span className="text-gold">{g.yong.trigram.name}</span>（{g.yong.pos}·{g.yong.trigram.wuxing}）</div>
        <div className="text-t2">体用关系：<span className="text-t1">{g.tiYong.label}</span> — {g.tiYong.desc}</div>
        <div className="text-t3">
          初 <span className="text-t2">{g.process.start.label}</span> → 中 <span className="text-t2">{g.process.middle.label}</span> → 末 <span className="text-t2">{g.process.end.label}</span>
        </div>
        <div className="text-t3">动爻第 {g.movingLine} 爻 · 整体{g.verdict}</div>
      </div>
    </div>
  );
}
