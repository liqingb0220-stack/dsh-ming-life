import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Button, inputCls, Tabs, Empty , tint} from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import { almanacOf } from '../engines/almanac';
import { HEXAGRAMS, HEX_INDEX, TENDENCY_META } from '../data/hexagrams';
import AskDSH from '../components/AskDSH';
import { toolPrompt } from '../dsh/facts';
import { TRIGRAMS, TRIGRAM_LIST } from '../data/trigrams';
import { PALACE_TABLE } from '../engines/liuyao';

/* ---------------- 黄历 ---------------- */
export function HuangliTool({ bazi }) {
  const [offset, setOffset] = useState(0);
  const date = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + offset); return d; }, [offset]);
  const a = useMemo(() => almanacOf(date), [date]);

  const cell = (k, v, color) => (
    <div className="rounded-lg bg-subtle px-3 py-2">
      <div className="text-[10px] text-t4">{k}</div>
      <div className="text-[12px] mt-0.5" style={{ color: color || 'rgba(255,255,255,.75)' }}>{v}</div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="黄历"
          subtitle="传统历注的完整条目。这些是历法与择日传统的既有内容，本页只做呈现，不做吉凶判断。"
          right={
            <div className="flex items-center gap-2">
              <button onClick={() => setOffset(o => o - 1)} className="px-2.5 py-1 rounded border border-b1 text-t3 hover:text-t1">‹</button>
              <button onClick={() => setOffset(0)} className="px-3 py-1 rounded border border-b1 text-[12px] text-t2 hover:text-t1">今天</button>
              <button onClick={() => setOffset(o => o + 1)} className="px-2.5 py-1 rounded border border-b1 text-t3 hover:text-t1">›</button>
            </div>
          }
        />

        <Card>
          <div className="flex items-baseline gap-4 flex-wrap mb-4">
            <span className="font-display text-[28px] text-t1">{a.iso}</span>
            <span className="text-[14px] text-t3">{a.lunarText}</span>
            <span className="font-mono text-[14px] text-gold/80">{a.yearGZ}年 {a.monthGZ}月 {a.dayGZ}日</span>
            {a.jieQi && <span className="px-2 py-0.5 rounded text-[11px] bg-tint-jade text-jade">{a.jieQi}</span>}
            {a.festivals.map(f => <span key={f} className="px-2 py-0.5 rounded text-[11px] bg-tint-violet text-violet">{f}</span>)}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="rounded-xl border border-jade/20 bg-tint-jade p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-jade/70 mb-2">宜</div>
              <p className="text-[13px] text-t2 leading-relaxed">{a.yi.join('　') || '—'}</p>
            </div>
            <div className="rounded-xl border border-cinnabar/20 bg-tint-cinnabar p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cinnabar/70 mb-2">忌</div>
              <p className="text-[13px] text-t2 leading-relaxed">{a.ji.join('　') || '—'}</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-4 gap-2">
          {cell('值神', `${a.tianShen}（${a.tianShenType}）`, a.tianShenType === '黄道' ? '#4fd6b8' : '#ff6b6b')}
          {cell('建除十二值', `${a.zhiXing}日`)}
          {cell('二十八宿', `${a.xiu}${a.xiuAnimal}（${a.xiuLuck}）`, a.xiuLuck === '吉' ? '#4fd6b8' : '#ff6b6b')}
          {cell('冲煞', `冲${a.chongDesc} 煞${a.sha}`)}
          {cell('旬空', a.xunKong.join('、'))}
          {cell('喜神', a.xiPosition, '#e8b96a')}
          {cell('财神', a.caiPosition, '#e8b96a')}
          {cell('福神', a.fuPosition, '#e8b96a')}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card title="吉神宜趋">
            <p className="text-[12px] text-t3 leading-relaxed">{a.jiShen.join('　') || '—'}</p>
          </Card>
          <Card title="凶煞宜忌">
            <p className="text-[12px] text-t3 leading-relaxed">{a.xiongSha.join('　') || '—'}</p>
          </Card>
        </div>

        <Card title="彭祖百忌 / 胎神">
          <p className="text-[12px] text-t3 leading-relaxed">{a.pengZu.join('；')}</p>
          <p className="text-[12px] text-t3 mt-2">胎神占方：{a.taiShen}</p>
        </Card>

        <Card title="时辰宜忌">
          <div className="grid grid-cols-4 gap-2">
            {a.times.map(t => (
              <div key={t.ganZhi} className="rounded-lg bg-subtle px-3 py-2.5">
                <div className="text-[13px] font-mono text-t2">{t.ganZhi}</div>
                <div className="text-[10px] text-jade/60 mt-1 leading-relaxed">宜 {t.yi.slice(0, 4).join(' ') || '—'}</div>
                <div className="text-[10px] text-cinnabar/50 mt-0.5 leading-relaxed">忌 {t.ji.slice(0, 3).join(' ') || '—'}</div>
              </div>
            ))}
          </div>
        </Card>

        {bazi && (
          <Card title="与你的命局">
            <p className="text-[13px] text-t2 leading-relaxed">
              你的日主是 {bazi.dayMaster.gan}（{bazi.dayMaster.wuxing}，{bazi.strength.label}，喜 {bazi.strength.favor.join('、')}）。
              今日 {a.dayGZ}，日支 {a.dayZhi} 与你的日支 {bazi.pillars[2].zhi}
              {a.dayZhi === bazi.pillars[2].zhi ? ' 相同' : ' 无特殊关系'}。
              需要按事件类型挑日子时，用「何时出发」，那里会把匹配项逐条列出来。
            </p>
          </Card>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}

/* ---------------- 易经六十四卦 ---------------- */
export function YijingTool() {
  const [q, setQ] = useState('');
  const [tendency, setTendency] = useState('');
  const [sel, setSel] = useState(1);

  const rows = useMemo(() => {
    const out = [];
    Object.entries(HEX_INDEX).forEach(([up, lows]) => {
      Object.entries(lows).forEach(([low, no]) => {
        out.push({ no, up, low, ...HEXAGRAMS[no], meta: null });
      });
    });
    return out.sort((a, b) => a.no - b.no);
  }, []);

  const filtered = rows.filter(r =>
    (!q || r.name.includes(q) || r.theme.includes(q) || r.plain.includes(q) || String(r.no) === q) &&
    (!tendency || r.tendency === tendency)
  );

  const cur = rows.find(r => r.no === sel);
  const bits = cur ? [...TRIGRAMS[cur.low].bits, ...TRIGRAMS[cur.up].bits] : [];
  const palaceInfo = cur ? PALACE_TABLE[bits.join('')] : null;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-5xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="易经 · 六十四卦"
          subtitle="按上下卦排列的完整卦表。每一卦标注了本工作台在决策场景中使用的倾向标签，以及它在京房八宫中的位置。"
          right={
            <div className="flex gap-2">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜卦名 / 主题 / 卦序" className={`${inputCls} !py-1.5 !text-[12px]`} style={{ width: 170 }} />
              <select value={tendency} onChange={e => setTendency(e.target.value)} className={`${inputCls} !py-1.5 !text-[12px]`} style={{ width: 100 }}>
                <option value="">全部倾向</option>
                {Object.keys(TENDENCY_META).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          }
        />

        {cur && (
          <Card>
            <div className="flex gap-6 items-start">
              <div className="shrink-0 text-center">
                <div className="w-20 space-y-1.5">
                  {[...bits].reverse().map((b, i) => (
                    <div key={i} className="flex gap-1 h-2.5">
                      {b ? <div className="flex-1 rounded-sm bg-gold" />
                        : <><div className="rounded-sm bg-gold" style={{ width: '42%' }} /><div style={{ width: '16%' }} /><div className="rounded-sm bg-gold" style={{ width: '42%' }} /></>}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-t4 mt-2">
                  上{TRIGRAMS[cur.up].name}{TRIGRAMS[cur.up].symbol}<br />下{TRIGRAMS[cur.low].name}{TRIGRAMS[cur.low].symbol}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2"><AskDSH prompt={toolPrompt('易经', `第 ${cur.no} 卦 ${cur.name}，上${TRIGRAMS[cur.up].name}下${TRIGRAMS[cur.low].name}，主题「${cur.theme}」${palaceInfo ? `，${palaceInfo.palaceName}宫${palaceInfo.posLabel}` : ''}`)} label="请 DSH 解读这一卦" /></div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-display text-[24px] text-t1">{cur.name}</span>
                  <span className="text-[12px] text-t4 font-mono">第 {cur.no} 卦</span>
                  <span className="px-2 py-0.5 rounded text-[11px]" style={{ background: tint(TENDENCY_META[cur.tendency].color, 11), color: TENDENCY_META[cur.tendency].color }}>
                    {cur.tendency}
                  </span>
                </div>
                <div className="text-[13px] text-gold/75 mt-1.5">主题：{cur.theme}</div>
                <p className="text-[14px] text-t2 leading-relaxed mt-2">{cur.plain}</p>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="rounded-lg bg-subtle px-3 py-2">
                    <div className="text-[10px] text-t4">上卦</div>
                    <div className="text-[12px] text-t2 mt-0.5">{TRIGRAMS[cur.up].name}（{TRIGRAMS[cur.up].nature}·{TRIGRAMS[cur.up].wuxing}）</div>
                    <div className="text-[10px] text-t4">{TRIGRAMS[cur.up].trait}</div>
                  </div>
                  <div className="rounded-lg bg-subtle px-3 py-2">
                    <div className="text-[10px] text-t4">下卦</div>
                    <div className="text-[12px] text-t2 mt-0.5">{TRIGRAMS[cur.low].name}（{TRIGRAMS[cur.low].nature}·{TRIGRAMS[cur.low].wuxing}）</div>
                    <div className="text-[10px] text-t4">{TRIGRAMS[cur.low].trait}</div>
                  </div>
                  <div className="rounded-lg bg-subtle px-3 py-2">
                    <div className="text-[10px] text-t4">京房八宫</div>
                    <div className="text-[12px] text-t2 mt-0.5">{palaceInfo.palaceName}宫 · {palaceInfo.posLabel}</div>
                    <div className="text-[10px] text-t4">世 {palaceInfo.shiYao} 爻 / 应 {palaceInfo.yingYao} 爻 · 宫属{palaceInfo.palaceWuxing}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card title={`卦表 · ${filtered.length} 卦`}>
          <div className="grid grid-cols-8 gap-1.5">
            {filtered.map(r => (
              <button key={r.no} onClick={() => setSel(r.no)}
                className={`rounded-lg px-1.5 py-2 text-center transition-all border
                  ${sel === r.no ? 'border-jade/50 bg-tint-jade' : 'border-b1 bg-subtle hover:border-b2'}`}>
                <div className="text-[9px] text-t4">{r.no}</div>
                <div className="text-[12px] text-t1 leading-tight">{r.name.length > 3 ? r.name.slice(-2) : r.name}</div>
                <div className="text-[9px] mt-0.5" style={{ color: TENDENCY_META[r.tendency].color }}>{r.theme}</div>
              </button>
            ))}
          </div>
          {!filtered.length && <p className="text-[12px] text-t4">没有匹配的卦。</p>}
        </Card>

        <Card title="八卦速查">
          <div className="grid grid-cols-8 gap-2">
            {TRIGRAM_LIST.map(t => (
              <div key={t.key} className="rounded-lg bg-subtle px-2 py-2.5 text-center">
                <div className="text-[20px] text-gold">{t.symbol}</div>
                <div className="text-[12px] text-t2 mt-1">{t.name}</div>
                <div className="text-[10px] text-t4">{t.nature} · {t.wuxing} · {t.num}</div>
                <div className="text-[9px] text-t4 mt-1 leading-tight">{t.trait}</div>
              </div>
            ))}
          </div>
        </Card>

        <Disclaimer />
      </div>
    </div>
  );
}
