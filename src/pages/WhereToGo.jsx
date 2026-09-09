import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Button, inputCls, Empty, Tabs } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import Interpretation from '../components/Interpretation';
import AskDSH from '../components/AskDSH';
import { placeFacts, cityFacts } from '../engines/places';
import { buildRequest, placeQuestionPrompt } from '../dsh/facts';
import { WX_COLOR } from '../data/colors';

function Compass({ facts }) {
  const R = 92, cx = 118, cy = 118;
  const order = ['正北', '东北', '正东', '东南', '正南', '西南', '正西', '西北'];
  const mark = (arr, label, color) => arr.map(t => {
    const i = order.indexOf(t.direction); if (i < 0) return null;
    const a = ((i * 45 - 90) * Math.PI) / 180;
    return <text key={label + t.zhi} x={cx + Math.cos(a) * (R - 26)} y={cy + Math.sin(a) * (R - 26)} fill={color} fontSize="9" textAnchor="middle" dominantBaseline="middle">{label}</text>;
  });
  return (
    <svg viewBox="0 0 236 236" className="w-[236px] h-[236px]">
      {facts.directions.map((d, i) => {
        const a0 = ((i * 45 - 112.5) * Math.PI) / 180, a1 = ((i * 45 - 67.5) * Math.PI) / 180;
        const p = `M${cx},${cy} L${cx + Math.cos(a0) * R},${cy + Math.sin(a0) * R} A${R},${R} 0 0 1 ${cx + Math.cos(a1) * R},${cy + Math.sin(a1) * R} Z`;
        const am = ((i * 45 - 90) * Math.PI) / 180;
        return (
          <g key={d.key}>
            <path d={p} fill={WX_COLOR[d.wuxing]} opacity={d.isFavor ? 0.28 : 0.08} stroke="var(--b1)" />
            <text x={cx + Math.cos(am) * (R + 13)} y={cy + Math.sin(am) * (R + 13)} fill="var(--t3)" fontSize="10" textAnchor="middle" dominantBaseline="middle">{d.name}</text>
            <text x={cx + Math.cos(am) * (R - 12)} y={cy + Math.sin(am) * (R - 12)} fill={WX_COLOR[d.wuxing]} fontSize="10" textAnchor="middle" dominantBaseline="middle">{d.trigram}</text>
          </g>
        );
      })}
      {mark(facts.taohua, '桃花', 'var(--cinnabar)')}
      {mark(facts.yima, '驿马', 'var(--azure)')}
      <circle cx={cx} cy={cy} r={3.5} fill="var(--gold)" />
      <text x={cx} y={cy + 14} fill="var(--t3)" fontSize="9" textAnchor="middle">{facts.origin.name}</text>
    </svg>
  );
}

/** 地点：工作台算方位事实，DSH 说哪儿是定情之地、转折之地、奇遇之地。 */
export default function WhereToGo({ bazi, ziwei, profile, corr, gender, interp = {}, hosted, onRequest }) {
  const [q, setQ] = useState('');
  const [scope, setScope] = useState('cn');
  const facts = useMemo(() => (bazi ? placeFacts(bazi, ziwei, profile, scope) : null), [bazi, ziwei, profile, scope]);
  const request = useMemo(() => (facts ? buildRequest('places', { profile, bazi, ziwei, corr, gender, places: facts }) : null), [facts, profile, bazi, ziwei, corr, gender]);
  if (!bazi) return <Empty title="尚未建立档案" desc="地点会用到你的日主与喜用，先建立档案。" />;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-5">
        <PageHeader title="地点" subtitle={`以${facts.origin.source === 'birth' ? `出生地 ${facts.origin.name}` : '北京（没填出生地）'}为原点看八个方位。定情之地、转折之地、奇遇之地在哪里，由 DSH 依据下面的方位事实给出。`}
          right={<Tabs value={scope} onChange={setScope} size="sm" tabs={[{ key: 'cn', label: '国内版' }, { key: 'intl', label: '国际版' }]} />} />

        <Interpretation key={request.key} it={interp[request.key]} request={request} hosted={hosted} onRequest={onRequest} size="lg" title={`DSH 的解读 · ${scope === 'intl' ? '国际版' : '国内版'}`} />

        <Card title="你也可以问我其他地方">
          <div className="flex gap-2">
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="例如：成都适合我发展吗？　去日本工作两年是否合适？" className={inputCls} />
            <AskDSH prompt={placeQuestionPrompt(q, cityFacts((q.match(/[一-龥]{2,5}/g) || []).find(w => cityFacts(w, facts).indexOf('不在') < 0) || q, facts))} label="问 DSH" className="shrink-0" />
          </div>
        </Card>

        <Card title="方位事实" right={<span className="text-[11px] text-t4">着色深的是日主所喜的方位</span>}>
          <div className="flex gap-6 flex-wrap items-start">
            <Compass facts={facts} />
            <div className="flex-1 min-w-[240px] space-y-1.5 text-[12px]">
              {facts.directions.map(d => (
                <div key={d.key} className="flex gap-2">
                  <span className="w-9 shrink-0 text-t2">{d.name}</span>
                  <span className="w-14 shrink-0" style={{ color: WX_COLOR[d.wuxing] }}>{d.trigram}·{d.wuxing}{d.isFavor ? ' ✓' : ''}</span>
                  <span className="text-t4 truncate">{[...d.near, ...d.far].slice(0, 6).join('、') || '—'}</span>
                </div>
              ))}
              <div className="pt-2 text-[11px] text-t4 leading-relaxed">
                {facts.taohua.length > 0 && <div>桃花位：{facts.taohua.map(t => `${t.zhi}（${t.direction}）`).join('、')}</div>}
                {facts.yima.length > 0 && <div>驿马位：{facts.yima.map(t => `${t.zhi}（${t.direction}）`).join('、')}</div>}
                {facts.movePalace && <div>紫微迁移宫：{facts.movePalace}</div>}
              </div>
            </div>
          </div>
        </Card>
        <Disclaimer />
      </div>
    </div>
  );
}
