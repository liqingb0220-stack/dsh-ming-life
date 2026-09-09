import React, { useState } from 'react';

/** 可视化人生地图：六条维度带 × 大运阶段。 */
export default function LifeMap({ map, onPick }) {
  const [hover, setHover] = useState(null);
  if (!map) return null;
  const { width, height, pad, bands, ticks, stageMarks, minAge } = map;

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin">
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 640, height: 'auto' }}>
          {/* 阶段分隔与标签 */}
          {stageMarks.map((s, i) => (
            <g key={i}>
              <line x1={s.x0} y1={pad - 16} x2={s.x0} y2={height - pad + 6} stroke="var(--b1)" />
              <text x={s.mid} y={pad - 22} fill="var(--t4)" fontSize="10" textAnchor="middle">{s.ganZhi}</text>
              <text x={s.mid} y={height - pad + 18} fill="var(--t4)" fontSize="9" textAnchor="middle">{s.startAge}–{s.endAge}</text>
            </g>
          ))}
          {ticks.map(t => (
            <text key={t.age} x={t.x} y={height - pad + 32} fill="var(--t5)" fontSize="9" textAnchor="middle">{t.age} 岁</text>
          ))}

          {/* 维度带 */}
          {bands.map(band => {
            const cy = band.y0 + band.bandH / 2;
            return (
              <g key={band.key}>
                <line x1={pad} y1={cy} x2={width - pad} y2={cy} stroke="var(--b1)" />
                <text x={pad - 8} y={cy} fill={band.color} fontSize="10" textAnchor="end" dominantBaseline="middle" opacity=".7">{band.label}</text>
                {band.points.map((p, i) => {
                  const h = p.h;
                  const isHover = hover && hover.stage === p.stage.startAge && hover.key === band.key;
                  return (
                    <rect
                      key={i}
                      x={p.x0 + 1.5} y={cy - h / 2} width={Math.max(2, p.x1 - p.x0 - 3)} height={h}
                      rx={Math.min(3, h / 2)}
                      fill={band.color}
                      opacity={isHover ? 0.95 : 0.18 + p.intensity * 0.6}
                      style={{ cursor: 'pointer', transition: 'opacity .2s' }}
                      onMouseEnter={() => setHover({ stage: p.stage.startAge, key: band.key, p, band })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onPick?.(Math.round((p.stage.startYear + p.stage.endYear) / 2), `${p.stage.startAge}–${p.stage.endAge} 岁 · ${band.label}`)}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 min-h-[42px]">
        {hover ? (
          <div className="rounded-xl border border-b1 bg-subtle px-4 py-2.5 animate-in">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full" style={{ background: hover.band.color }} />
              <span className="text-[13px] text-t1">{hover.p.stage.startAge}–{hover.p.stage.endAge} 岁 · {hover.band.label}</span>
              <span className="text-[11px] font-mono text-t4">{hover.p.stage.ganZhi}（{hover.p.stage.shiShen}）</span>
              <span className="text-[11px]" style={{ color: hover.p.domain.level.color }}>{hover.p.domain.level.label}</span>
              {hover.p.stage.decadalPalace && <span className="text-[11px] text-violet/60">紫微大限 {hover.p.stage.decadalPalace}宫</span>}
            </div>
            {(hover.p.domain.baziWhy[0] || hover.p.domain.ziweiWhy[0]) && (
              <div className="text-[11px] text-t3 mt-1 leading-relaxed">
                {hover.p.domain.baziWhy[0] || hover.p.domain.ziweiWhy[0]}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-t4 px-1">
            条块的高度表示该阶段在该维度上的结构强度。悬停看依据，点击展开这一段的完整解释。{map.summary}
          </p>
        )}
      </div>
    </div>
  );
}
