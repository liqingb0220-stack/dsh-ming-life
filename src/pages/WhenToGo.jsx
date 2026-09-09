import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Button, Field, inputCls, Empty, DateInput, tint } from '../components/ui';
import WhyCard from '../components/WhyCard';
import Disclaimer from '../components/Disclaimer';
import { buildCandidates, explainDay } from '../engines/almanac';
import { ACTIVITIES, MATCH_LEVELS, resolveActivity } from '../data/activities';
import AskDSH from '../components/AskDSH';
import { toolPrompt, timingPrompt } from '../dsh/facts';

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export default function WhenToGo({ bazi, onFocus }) {
  const today = new Date();
  const [purpose, setPurpose] = useState('搬家入宅');
  const activity = useMemo(() => resolveActivity(purpose), [purpose]);
  const [from, setFrom] = useState(iso(today));
  const [to, setTo] = useState(iso(addDays(today, 45)));
  const [excluded, setExcluded] = useState([]);
  const [starred, setStarred] = useState([]);
  const [selected, setSelected] = useState(null);
  const [compare, setCompare] = useState([]);

  const days = useMemo(() => {
    const f = new Date(from + 'T00:00:00'), t = new Date(to + 'T00:00:00');
    if (isNaN(f) || isNaN(t) || t < f) return [];
    const span = Math.round((t - f) / 86400000);
    if (span > 180) return [];
    return buildCandidates({ from: f, to: t, activityKey: activity, bazi, excluded });
  }, [from, to, activity, bazi, excluded]);

  const act = activity;
  const available = days.filter(d => !d.excluded && !d.jiHits.length);
  const ranked = [...available].sort((a, b) => b.score - a.score);
  const detail = selected ? days.find(d => d.iso === selected) : null;
  const compareDays = compare.map(i => days.find(d => d.iso === i)).filter(Boolean);

  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  // 按周排布的日历
  const weeks = useMemo(() => {
    if (!days.length) return [];
    const out = [];
    let week = new Array(new Date(days[0].iso + 'T00:00:00').getDay()).fill(null);
    days.forEach(d => {
      week.push(d);
      if (week.length === 7) { out.push(week); week = []; }
    });
    if (week.length) out.push([...week, ...new Array(7 - week.length).fill(null)]);
    return out;
  }, [days]);

  if (!bazi) return <Empty title="尚未建立档案" desc="择日会结合你的日主与命局，先建立档案。" />;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="择日"
          subtitle="这里不评「最吉之日」，只按传统黄历条目与你的命局，统计每一天与这件事的匹配项和相冲项，规则可以逐条核对。"
        />

        <Card title="要做的是什么事">
          <input value={purpose} onChange={e => { setPurpose(e.target.value); setSelected(null); setCompare([]); }} placeholder="用你自己的话说，例如：迁居到新城市、与伴侣家人见面、提出离职" className={inputCls} />
          <div className="flex gap-1.5 flex-wrap mt-2">
            {ACTIVITIES.map(a => <button key={a.key} onClick={() => { setPurpose(a.label); setSelected(null); setCompare([]); }} className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${act.key === a.key ? 'border-jade/40 text-jade' : 'border-b1 text-t4 hover:text-t2'}`}>{a.label}</button>)}
          </div>
          <p className="mt-3 text-[12px] text-t3">{act.matched && act.mapped ? `按黄历里的「${act.mapped}」来对：` : ''}{act.hint}</p>
          {!act.matched && purpose.trim() && <div className="mt-2"><AskDSH prompt={timingPrompt(purpose, from, to)} label="把这件事交给 DSH 一起看" /></div>}
          <div className="grid grid-cols-2 gap-3 mt-4 max-w-md">
            <Field label="从"><DateInput value={from} onChange={e => setFrom(e.target.value)} /></Field>
            <Field label="到"><DateInput value={to} onChange={e => setTo(e.target.value)} /></Field>
          </div>
          {!days.length && <p className="mt-3 text-[12px] text-cinnabar/70">日期范围无效，或超过 180 天。</p>}
        </Card>

        {days.length > 0 && (
          <>
            <Card
              title={`候选日期 · 共 ${days.length} 天`}
              right={
                <div className="flex items-center gap-3 flex-wrap">
                  {MATCH_LEVELS.map(l => (
                    <span key={l.key} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: tint(l.color, 25), border: `1px solid ${l.color}70` }} />
                      <span className="text-[10px] text-t4">{l.label}</span>
                    </span>
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <div key={d} className="text-center text-[10px] text-t4 pb-1">{d}</div>
                ))}
              </div>
              <div className="space-y-1.5">
                {weeks.map((w, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1.5">
                    {w.map((d, di) => {
                      if (!d) return <div key={di} />;
                      const isSel = selected === d.iso;
                      const inCompare = compare.includes(d.iso);
                      const isStar = starred.includes(d.iso);
                      return (
                        <button
                          key={di}
                          onClick={() => { setSelected(d.iso); onFocus?.(`${d.iso} ${d.dayGZ}`); }}
                          className={`rounded-lg px-1.5 py-2 text-left transition-all border relative
                            ${d.excluded ? 'opacity-25' : ''}
                            ${isSel ? 'ring-1 ring-jade/60' : ''}`}
                          style={{
                            background: d.excluded ? 'var(--bg-subtle)' : tint(d.level.color, 8),
                            borderColor: inCompare ? '#a98cf5' : tint(d.level.color, 27)
                          }}
                        >
                          <div className="flex items-baseline justify-between">
                            <span className="text-[13px] text-t1">{d.date.getDate()}</span>
                            {isStar && <span className="text-[10px] text-gold">★</span>}
                          </div>
                          <div className="text-[9px] text-t4 leading-tight">{d.lunarText}</div>
                          <div className="text-[9px] font-mono leading-tight" style={{ color: d.level.color }}>{d.dayGZ}</div>
                          {d.jiHits.length > 0 && <div className="text-[8px] text-cinnabar/80 leading-tight">忌{d.jiHits[0]}</div>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-t4">
                在这个范围内，有 {available.length} 天没有出现与本事件直接相忌的条目，{days.filter(d => d.jiHits.length).length} 天出现了。
              </p>
            </Card>

            <Card title="按匹配项排序（不是吉凶排名）">
              <div className="space-y-2">
                {ranked.slice(0, 6).map(d => (
                  <div key={d.iso} className="flex items-center gap-3 rounded-xl border border-b1 bg-subtle px-4 py-2.5">
                    <button onClick={() => { setSelected(d.iso); onFocus?.(`${d.iso} ${d.dayGZ}`); }} className="text-left min-w-0 flex-1">
                      <div className="text-[13px] text-t1">
                        {d.iso} <span className="text-t4">{d.lunarText} · {d.dayGZ}</span>
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: d.level.color }}>
                        {d.level.label} · 命中「{d.yiHits.join('、') || '无直接对应条目'}」
                      </div>
                    </button>
                    <button onClick={() => toggle(starred, setStarred, d.iso)} className={`text-sm shrink-0 ${starred.includes(d.iso) ? 'text-gold' : 'text-t5 hover:text-gold/60'}`}>★</button>
                    <button onClick={() => toggle(compare, setCompare, d.iso)} className={`text-[11px] shrink-0 px-2 py-1 rounded border ${compare.includes(d.iso) ? 'border-violet/50 text-violet' : 'border-b1 text-t4 hover:text-t2'}`}>对比</button>
                    <button onClick={() => toggle(excluded, setExcluded, d.iso)} className="text-[11px] shrink-0 px-2 py-1 rounded border border-b1 text-t4 hover:text-cinnabar/70">排除</button>
                  </div>
                ))}
                {!ranked.length && <p className="text-[12px] text-t4">这个范围内没有可用日期，试着放宽范围。</p>}
              </div>
              {excluded.length > 0 && (
                <p className="mt-3 text-[11px] text-t4">
                  已排除 {excluded.length} 天：{excluded.join('、')}
                  <button onClick={() => setExcluded([])} className="ml-2 text-jade/60 hover:text-jade">清除</button>
                </p>
              )}
            </Card>

            {compareDays.length >= 2 && (
              <Card title="A / B 对比">
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(compareDays.length, 3)}, minmax(0,1fr))` }}>
                  {compareDays.slice(0, 3).map(d => (
                    <div key={d.iso} className="rounded-xl border border-violet/25 bg-tint-violet p-4">
                      <div className="text-[13px] text-t1">{d.iso}</div>
                      <div className="text-[11px] text-t4 mb-2">{d.lunarText} · {d.dayGZ} · {d.tianShen}（{d.tianShenType}）· {d.zhiXing}日</div>
                      <div className="text-[11px] mb-2" style={{ color: d.level.color }}>{d.level.label}</div>
                      <div className="space-y-1">
                        {d.plus.map((x, i) => <div key={i} className="text-[11px] text-jade/70">+ {x.label} {x.value}</div>)}
                        {d.minus.map((x, i) => <div key={i} className="text-[11px] text-cinnabar/70">− {x.label} {x.value}</div>)}
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setCompare([])} className="mt-3 text-[11px] text-t4 hover:text-t2">清空对比</button>
              </Card>
            )}

            {detail && (
              <div className="space-y-4 animate-in">
                <Card title={`${detail.iso} 的完整黄历`}>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      ['干支', `${detail.yearGZ} ${detail.monthGZ} ${detail.dayGZ}`],
                      ['值神', `${detail.tianShen}（${detail.tianShenType}）`],
                      ['建除', `${detail.zhiXing}日`],
                      ['星宿', `${detail.xiu}宿（${detail.xiuLuck}）`],
                      ['冲煞', `冲${detail.chongDesc} 煞${detail.sha}`],
                      ['旬空', detail.xunKong.join('、')],
                      ['喜神/财神', `${detail.xiPosition} / ${detail.caiPosition}`],
                      ['胎神', detail.taiShen]
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-subtle px-3 py-2">
                        <div className="text-[10px] text-t4">{k}</div>
                        <div className="text-[12px] text-t2 mt-0.5">{v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-jade/70 mb-1.5">宜</div>
                      <p className="text-[12px] text-t3 leading-relaxed">{detail.yi.join(' ') || '—'}</p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-cinnabar/70 mb-1.5">忌</div>
                      <p className="text-[12px] text-t3 leading-relaxed">{detail.ji.join(' ') || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-b1 text-[11px] text-t4 leading-relaxed">
                    彭祖百忌：{detail.pengZu.join('；')}
                  </div>
                </Card>

                <AskDSH prompt={toolPrompt('择日', `想做的事：${act.label}；候选日 ${detail.iso}（${detail.yearGZ} ${detail.monthGZ} ${detail.dayGZ}），值神${detail.tianShen}（${detail.tianShenType}），建除${detail.zhiXing}，${detail.xiu}宿（${detail.xiuLuck}），冲${detail.chongDesc}；宜 ${detail.yi.slice(0, 8).join(' ')}；忌 ${detail.ji.slice(0, 8).join(' ')}；与我命局：${[...detail.plus, ...detail.minus].map(x => `${x.label} ${x.value}`).join('、')}`)} label="请 DSH 解读这一天" />
                <WhyCard insight={explainDay(detail, bazi)} defaultOpen />

                <Card title="当日时辰">
                  <div className="grid grid-cols-6 gap-2">
                    {detail.times.map(t => (
                      <div key={t.ganZhi} className="rounded-lg bg-subtle px-2 py-2">
                        <div className="text-[12px] text-t2 font-mono">{t.ganZhi}</div>
                        <div className="text-[10px] text-jade/60 mt-1 leading-tight">{t.yi.slice(0, 3).join(' ') || '—'}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
