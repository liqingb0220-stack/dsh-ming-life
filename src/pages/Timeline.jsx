import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Tabs, Empty, tint } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import Interpretation from '../components/Interpretation';
import { DomainChips } from './Reveal';
import { buildStages, buildYears, LEVELS } from '../engines/timeline';
import { yearSignals } from '../engines/signals';
import { buildRequest } from '../dsh/facts';
import { buildLifeMap } from '../engines/lifemap';
import LifeMap from '../components/LifeMap';
import { DOMAINS } from '../data/stars';

const GRAINS = [
  { key: '5', label: '5 年' }, { key: '10', label: '10 年' },
  { key: 'life', label: '一生' }, { key: 'map', label: '人生地图' }
];

export default function Timeline({ bazi, ziwei, gender, onFocus, profile, corr, interp, hosted, onRequest }) {
  const [grain, setGrain] = useState('10');
  const [showTable, setShowTable] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const ready = bazi && bazi.daYun.length > 0;
  const thisYear = new Date().getFullYear();

  const request = useMemo(() => (ready ? buildRequest('where-to', { profile, bazi, ziwei, corr, gender }) : null), [profile, bazi, ziwei, corr, gender, ready]);
  const yearReq = useMemo(() => (ready && selectedYear ? buildRequest('year', { profile, bazi, ziwei, corr, gender, year: selectedYear }) : null), [profile, bazi, ziwei, corr, gender, selectedYear, ready]);
  const stages = useMemo(() => (ready ? buildStages(bazi, ziwei, gender) : []), [bazi, ziwei, gender, ready]);
  const years = useMemo(() => {
    if (!ready) return [];
    if (grain === '5') return buildYears(bazi, ziwei, gender, thisYear, thisYear + 4);
    if (grain === '10') return buildYears(bazi, ziwei, gender, thisYear, thisYear + 9);
    return [];
  }, [bazi, ziwei, gender, grain, ready, thisYear]);
  const lifeMap = useMemo(() => (ready && grain === 'map' ? buildLifeMap(bazi, ziwei, gender) : null), [bazi, ziwei, gender, ready, grain]);
  const detail = useMemo(() => (ready && selectedYear ? yearSignals(bazi, ziwei, gender, selectedYear) : null), [bazi, ziwei, gender, selectedYear, ready]);
  const nowSig = useMemo(() => (ready ? yearSignals(bazi, ziwei, gender, thisYear) : null), [bazi, ziwei, gender, ready, thisYear]);

  if (!ready) return <Empty title="暂时排不出时间轴" desc="时间轴依赖大运，需要公历出生日期。补充出生信息后就能看。" />;

  const cells = grain === 'life' ? stages : years;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="我将去向何方"
          subtitle="不是预言。盘面只能说哪几段「有话可讲」、讲的是哪一类事；具体怎么走，是你在那段时间里做了什么。"
        />

        {nowSig && (
          <Card title="现在" right={<span className="text-[11px] text-t4">六个方面都列出来，不只挑最强的</span>}>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-2xl text-t1">{thisYear}</span>
              <span className="text-[12px] text-t3">{nowSig.age} 岁 · {nowSig.stage}{nowSig.daYun ? ` · 大运 ${nowSig.daYun}` : ''} · 流年 {nowSig.liuNian}</span>
            </div>
            {nowSig.ziweiYear && <div className="text-[11px] text-t4 mt-1">紫微：{nowSig.ziweiYear}</div>}
            <div className="mt-3"><DomainChips ys={nowSig} /></div>
            <button onClick={() => { setSelectedYear(thisYear); onFocus?.(`${thisYear} 年`); }} className="mt-3 text-[12px] text-jade hover:opacity-80">展开今年 ›</button>
          </Card>
        )}

        {request && <Interpretation it={interp[request.key]} request={request} hosted={hosted} onRequest={onRequest} size="lg" title="DSH 的解读 · 现在与未来十年" />}

        {detail && yearReq && (
          <div className="space-y-4 animate-in">
            <Card title={`${detail.year} 年 · 盘面事实`} right={<button onClick={() => setSelectedYear(null)} className="text-[11px] text-t4 hover:text-t2">收起</button>}>
              <p className="text-[12px] text-t3">{detail.age} 岁，{detail.stage}。{detail.daYun ? `大运 ${detail.daYun}，` : ''}流年 {detail.liuNian}。{detail.ziweiYear ? `紫微：${detail.ziweiYear}。` : ''}</p>
              <div className="mt-3 space-y-2">
                {detail.domains.map(d => (
                  <div key={d.key} className="flex gap-3 text-[12px]">
                    <span className="w-16 shrink-0" style={{ color: d.score >= 2 ? d.color : 'var(--t4)' }}>{d.label} · {d.level}</span>
                    <span className="text-t4 leading-relaxed">{d.why.join('；') || '这一面没有明显信号'}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-t4">{detail.consensus.length ? `两套体系都标出：${detail.consensus.join('、')}。` : '两套体系没有同时标出同一方面。'}{detail.divergence.length ? ` 只有一套标出：${detail.divergence.join('、')}。` : ''}</p>
            </Card>
            <Interpretation it={interp[yearReq.key]} request={yearReq} hosted={hosted} onRequest={onRequest} title={`DSH 的解读 · ${detail.year} 年`} />
          </div>
        )}

        <div className="rounded-2xl border border-b1 bg-subtle">
          <button onClick={() => setShowTable(s => !s)} className="w-full text-left px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-[13px] text-t2">完整表格与人生地图</div>
              <div className="text-[11px] text-t4 mt-0.5">六个维度 × 逐年／大运的结构强度。规则引擎的原始输出，点任一格看那一年。</div>
            </div>
            <span className={`text-t4 transition-transform ${showTable ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {showTable && (
            <div className="px-5 pb-5 space-y-4 animate-in">
              <Tabs value={grain} onChange={setGrain} tabs={GRAINS} size="sm" />
              {grain === 'map' ? (
                <LifeMap map={lifeMap} onPick={(year, label) => { setSelectedYear(year); onFocus?.(label); }} />
              ) : (
                <>
                  <div className="overflow-x-auto scrollbar-thin -mx-1 px-1">
                    <table className="w-full border-separate" style={{ borderSpacing: '2px' }}>
                      <thead>
                        <tr>
                          <th className="text-left text-[10px] uppercase tracking-wider text-t4 font-normal pb-2 pr-3">{grain === 'life' ? '阶段' : '年份'}</th>
                          {DOMAINS.map(d => <th key={d.key} className="text-[11px] text-t3 font-normal pb-2 px-1 min-w-[72px]">{d.label}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {cells.map(c => {
                          const isYear = c.kind === 'year';
                          const midYear = isYear ? c.year : Math.round((c.startYear + c.endYear) / 2);
                          const active = isYear && selectedYear === c.year;
                          return (
                            <tr key={isYear ? c.year : c.startAge}>
                              <td className={`text-left pr-3 py-1 cursor-pointer ${active ? 'text-jade' : 'text-t2 hover:text-t1'}`}
                                onClick={() => { setSelectedYear(midYear); onFocus?.(isYear ? `${c.year} 年` : `${c.startAge}–${c.endAge} 岁`); }}>
                                <div className="text-[13px] font-mono whitespace-nowrap">{isYear ? c.year : `${c.startAge}–${c.endAge}岁`}</div>
                                <div className="text-[10px] text-t4 whitespace-nowrap">{isYear ? `${c.age}岁 ${c.ganZhi}` : c.ganZhi}</div>
                              </td>
                              {DOMAINS.map(d => {
                                const dom = c.domains.find(x => x.key === d.key);
                                const strong = dom.score >= 2;
                                return (
                                  <td key={d.key} className="px-1 py-1">
                                    <div onClick={() => { setSelectedYear(midYear); onFocus?.(`${isYear ? c.year + ' 年' : c.startAge + '–' + c.endAge + ' 岁'} · ${d.label}`); }}
                                      className="rounded-md text-center py-1.5 cursor-pointer transition-all hover:brightness-125"
                                      style={{ background: strong ? tint(dom.level.color, 12) : 'var(--bg-subtle)', border: `1px solid ${strong ? tint(dom.level.color, 20) : 'var(--b1)'}` }}>
                                      <span className="text-[11px]" style={{ color: strong ? dom.level.color : 'var(--t4)' }}>{dom.level.label}</span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    {LEVELS.map(l => (
                      <div key={l.key} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: tint(l.color, 27), border: `1px solid ${tint(l.color, 40)}` }} />
                        <span className="text-[11px] text-t4">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <Disclaimer />
      </div>
    </div>
  );
}
