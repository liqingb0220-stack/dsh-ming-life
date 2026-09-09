import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Button, Field, inputCls, Empty, Tabs, Bar } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import HexagramView, { MeihuaView } from '../components/HexagramView';
import AskDSH from '../components/AskDSH';
import { liuyaoFacts, meihuaFacts } from '../engines/cast';
import { toolPrompt } from '../dsh/facts';
import { tenGodColor } from '../data/colors';
import { castCoins, buildLiuYao, LIUQIN_MEANING, LIUSHEN_MEANING } from '../engines/liuyao';
import { castByTime, castByNumbers, buildMeihua } from '../engines/meihua';
import { ziweiAtYear } from '../engines/ziwei';
import { baziPro, ziweiPro } from '../engines/pro';
import { TEN_GODS, WUXING_TRAIT } from '../data/tenGods';
import { MAJOR_STARS } from '../data/stars';
import { Solar } from 'lunar-javascript';

const WUXING_COLOR = { 木: 'var(--wx-mu)', 火: 'var(--wx-huo)', 土: 'var(--wx-tu)', 金: 'var(--wx-jin)', 水: 'var(--wx-shui)' };

/* ---------------- 八字 ---------------- */
export function BaziTool({ bazi, corr }) {
  const [mode, setMode] = useState('basic');
  const pro = useMemo(() => (bazi ? baziPro(bazi) : null), [bazi]);
  if (!bazi) return <Empty title="尚未建立档案" />;
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="八字"
          subtitle={bazi.lunarText ? `${bazi.lunarText} · 生肖${bazi.animal}` : `四柱直接录入 · 生肖${bazi.animal}`}
          right={<Tabs value={mode} onChange={setMode} size="sm" tabs={[{ key: 'basic', label: '基础盘' }, { key: 'pro', label: '专业盘' }]} />}
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-t4">{corr?.applied ? corr.note : corr?.note || '出生地未填或未识别，按钟表时间排盘。'}</p>
          <AskDSH prompt={toolPrompt('八字', `四柱 ${bazi.pillars.map(p => p.gan + p.zhi).join(' ')}；日主 ${bazi.dayMaster.gan}（${bazi.dayMaster.wuxing}）${bazi.strength.label}，喜 ${bazi.strength.favor.join('、')}；十神 ${bazi.tenGods.map(t => `${t.god}${t.weight}`).join('、')}；大运 ${bazi.daYun.map(d => `${d.ganZhi}(${d.startAge}–${d.endAge})`).join(' ')}`)} label="请 DSH 解读这张盘" />
        </div>
        {mode === 'pro' && (
          <>
            <Card title="藏干十神全展开">
              <div className="grid grid-cols-4 gap-3">
                {pro.pillars.map(p => (
                  <div key={p.pos} className="rounded-xl border border-b1 bg-subtle p-4">
                    <div className="text-[10px] text-t4 mb-2">{p.pos}柱</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl" style={{ color: WUXING_COLOR[p.wuxingGan] }}>{p.gan}</span>
                      <span className="font-display text-2xl" style={{ color: WUXING_COLOR[p.wuxingZhi] }}>{p.zhi}</span>
                    </div>
                    <div className="text-[11px] text-violet/70 mt-1">{p.ssGan}</div>
                    <div className="mt-2.5 space-y-1">
                      {p.hideDetail.map(h => (
                        <div key={h.gan} className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-6 text-t4">{h.weightLabel}</span>
                          <span style={{ color: WUXING_COLOR[h.wuxing] }}>{h.gan}</span>
                          <span className="text-t3">{h.shiShen}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-b1">
                      <div className="text-[10px] text-t4">日主长生</div>
                      <div className="text-[11px] text-gold/75">{p.changSheng.name}</div>
                      <div className="text-[9px] text-t4 leading-tight mt-0.5">{p.changSheng.meaning}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card title="地支关系">
                {pro.relations.length ? (
                  <ul className="space-y-2">
                    {pro.relations.map((r, i) => (
                      <li key={i} className="text-[12px] leading-relaxed">
                        <span className="font-mono text-t2">{r.pair}</span>
                        <span className={r.tone > 0 ? 'text-jade ml-2' : 'text-cinnabar ml-2'}>{r.label}</span>
                        <div className="text-[11px] text-t3 mt-0.5">{r.plain}</div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[12px] text-t4">四支之间没有构成传统的合冲刑害关系。</p>}
              </Card>
              <Card title="旬空与十二长生">
                <div className="text-[12px] text-t2 leading-relaxed">
                  <div>旬首 <span className="font-mono text-t1">{pro.xunKong.xunShou}</span>，空亡 <span className="font-mono text-cinnabar/80">{pro.xunKong.kong.join('、')}</span></div>
                  <div className="text-[11px] text-t3 mt-1">
                    {pro.xunKong.pillars.length ? `落在${pro.xunKong.pillars.join('、')}柱上` : '命局四支都不落空'}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-b1 space-y-1">
                  {pro.dayMasterCS.map(c => (
                    <div key={c.pos} className="flex items-baseline gap-2 text-[11px]">
                      <span className="text-t4 w-8">{c.pos}支{c.zhi}</span>
                      <span className="text-gold/80 w-10">{c.name}</span>
                      <span className="text-t4">{c.meaning}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card title="要点">
              <ul className="space-y-1.5">
                {pro.notes.map((n, i) => <li key={i} className="text-[12px] text-t3 leading-relaxed">· {n}</li>)}
              </ul>
            </Card>
          </>
        )}

        <Card title="四柱">
          <div className="grid grid-cols-4 gap-3">
            {bazi.pillars.map(p => (
              <div key={p.pos} className="rounded-xl border border-b1 bg-subtle p-4">
                <div className="text-[10px] text-t4 mb-2">{p.pos}柱 · {p.meaning}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-display text-2xl" style={{ color: WUXING_COLOR[p.wuxingGan] }}>{p.gan}</span>
                  <span className="font-display text-2xl" style={{ color: WUXING_COLOR[p.wuxingZhi] }}>{p.zhi}</span>
                </div>
                <div className="text-[11px] text-t3">{p.ssGan}</div>
                <div className="text-[10px] text-t4 mt-1.5">藏干 {p.hide.join(' ')}</div>
                <div className="text-[10px] text-t4">
                  {Array.isArray(p.ssZhi) ? p.ssZhi.filter(Boolean).join(' ') : p.ssZhi}
                </div>
                {p.naYin !== '—' && <div className="text-[10px] text-t4 mt-1">纳音 {p.naYin}</div>}
              </div>
            ))}
          </div>
          {bazi.taiYuan && (
            <div className="mt-3 text-[11px] text-t4">胎元 {bazi.taiYuan} · 命宫 {bazi.mingGong}</div>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card title="五行分布">
            <div className="space-y-2.5">
              {Object.entries(bazi.wuxingPct).map(([w, pct]) => (
                <div key={w}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: WUXING_COLOR[w] }}>{w} · {WUXING_TRAIT[w].keyword}</span>
                    <span className="font-mono text-t3">{pct}%（{bazi.wuxing[w]}）</span>
                  </div>
                  <Bar value={pct * 2} color={WUXING_COLOR[w]} height={5} />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-b1 text-[12px] text-t3 leading-relaxed">
              {bazi.strength.basis}
              <div className="text-jade/70 mt-1">日主{bazi.strength.label} · 喜 {bazi.strength.favor.join('、')}</div>
            </div>
          </Card>

          <Card title="十神分布">
            <div className="space-y-2">
              {bazi.tenGods.map(t => (
                <div key={t.god} className="flex items-start gap-3">
                  <span className="text-[12px] w-9 shrink-0" style={{ color: tenGodColor(t.god, bazi.dayMaster.wuxing) }}>{t.god}</span>
                  <div className="flex-1 pt-1.5"><Bar value={(t.weight / bazi.tenGods[0].weight) * 100} color={tenGodColor(t.god, bazi.dayMaster.wuxing)} height={4} /></div>
                  <span className="text-[10px] font-mono text-t4 w-8 text-right shrink-0">{t.weight}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 pt-3 border-t border-b1 text-[12px] text-t3 leading-relaxed">
              最重的是 <span className="text-t2">{bazi.tenGods[0].god}</span>：{TEN_GODS[bazi.tenGods[0].god].plain}
            </p>
          </Card>
        </div>

        <Card title="大运">
          {bazi.daYun.length ? (
            <>
              <div className="text-[11px] text-t4 mb-3">
                出生后 {bazi.startInfo.year} 年 {bazi.startInfo.month} 个月起运
              </div>
              <div className="grid grid-cols-5 gap-2">
                {bazi.daYun.map(d => {
                  const now = new Date().getFullYear();
                  const current = now >= d.startYear && now <= d.endYear;
                  return (
                    <div key={d.ganZhi + d.startYear} className={`rounded-xl border p-3 ${current ? 'border-jade/40 bg-tint-jade' : 'border-b1 bg-subtle'}`}>
                      <div className="font-display text-lg text-t1">{d.ganZhi}</div>
                      <div className="text-[10px] text-t4 mt-1">{d.startAge}–{d.endAge} 岁</div>
                      <div className="text-[10px] text-t4">{d.startYear}–{d.endYear}</div>
                      <div className="text-[10px] text-violet/70 mt-1.5">{[d.shiShenGan, d.shiShenZhi].filter(Boolean).join(' / ')}</div>
                      {current && <div className="text-[9px] text-jade mt-1">当前</div>}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-[12px] text-t4">当前档案由四柱直接录入，缺少公历出生日期，无法排大运。</p>
          )}
        </Card>

        <Disclaimer />
      </div>
    </div>
  );
}

/* ---------------- 紫微 ---------------- */
export function ZiweiTool({ ziwei }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [focusPalace, setFocusPalace] = useState('命宫');
  const pro = useMemo(() => (ziwei ? ziweiPro(ziwei, focusPalace) : null), [ziwei, focusPalace]);
  if (!ziwei) {
    return <Empty title="紫微斗数需要公历出生日期" desc="当前档案由四柱直接建立。补充出生日期与时辰后即可生成命盘。" />;
  }
  const at = ziweiAtYear(ziwei, year);
  // 命盘按地支固定十二格排列：巳午未申 / 辰…酉 / 卯…戌 / 寅丑子亥
  const byBranch = {};
  ziwei.palaces.forEach(p => { byBranch[p.branch] = p; });
  const LAYOUT = [['巳', '午', '未', '申'], ['辰', null, null, '酉'], ['卯', null, null, '戌'], ['寅', '丑', '子', '亥']];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="紫微斗数"
          subtitle={`${ziwei.chineseDate} · ${ziwei.fiveElementsClass} · 命主${ziwei.soul} · 身主${ziwei.body}`}
          right={
            <div className="flex items-center gap-2">
              <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 rounded border border-b1 text-t3 hover:text-t1 text-sm">‹</button>
              <span className="font-mono text-sm text-t2 w-12 text-center">{year}</span>
              <button onClick={() => setYear(y => y + 1)} className="px-2 py-1 rounded border border-b1 text-t3 hover:text-t1 text-sm">›</button>
            </div>
          }
        />

        {ziwei && <AskDSH prompt={toolPrompt('紫微斗数', `${ziwei.fiveElementsClass}；${ziwei.palaces.map(p => `${p.name}${p.isSoul ? '(命)' : ''}${p.isBody ? '(身)' : ''} ${p.stem}${p.branch}：${[...p.majorStars.filter(x => x.isMajor), ...p.minorStars].map(x => `${x.name}${x.brightness ? `(${x.brightness})` : ''}${x.mutagen ? `化${x.mutagen}` : ''}`).join(' ') || '无主星'}`).join('；')}`)} label="请 DSH 解读这张盘" />}
        <Card title={`命盘 · ${year} 年大限流年`}>
          <div className="grid grid-cols-4 gap-1.5">
            {LAYOUT.flat().map((branch, i) => {
              if (!branch) {
                if (i === 5) return (
                  <div key={i} className="col-span-2 row-span-2 rounded-xl border border-b1 bg-subtle p-4 flex flex-col justify-center" style={{ gridRow: 'span 2' }}>
                    <div className="text-[11px] text-t4">中宫</div>
                    <div className="text-[13px] text-t2 mt-2">{ziwei.lunarDate}</div>
                    <div className="text-[11px] text-t3 mt-1">{ziwei.chineseDate}</div>
                    <div className="text-[11px] text-t3 mt-2">{ziwei.fiveElementsClass} · {ziwei.zodiac} · {ziwei.sign}</div>
                    <div className="text-[11px] text-jade/70 mt-3">{year} 大限：{at.decadal.palaceName}宫（{at.decadal.range.join('–')}岁）</div>
                    <div className="text-[11px] text-gold/70">{year} 流年命宫：{at.yearly.palaceName}宫</div>
                    <div className="text-[10px] text-t4 mt-2">流年四化 {at.yearly.mutagen?.join(' ')}</div>
                  </div>
                );
                return null;
              }
              const p = byBranch[branch];
              if (!p) return <div key={i} />;
              const isDecadal = ziwei.palaces[at.decadal.index]?.branch === branch;
              const isYearly = ziwei.palaces[at.yearly.index]?.branch === branch;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-2.5 min-h-[118px] flex flex-col
                    ${p.isSoul ? 'border-gold/40 bg-tint-gold' : isYearly ? 'border-jade/30 bg-tint-jade' : isDecadal ? 'border-violet/25 bg-tint-violet' : 'border-b1 bg-subtle'}`}
                >
                  <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mb-1.5">
                    {p.majorStars.map(s => (
                      <span key={s.name} className="text-[11px] text-violet/90">
                        {s.name}<span className="text-t4">{s.brightness}</span>
                        {s.mutagen && <span className="text-cinnabar">化{s.mutagen}</span>}
                      </span>
                    ))}
                    {p.minorStars.slice(0, 3).map(s => (
                      <span key={s.name} className="text-[10px] text-t3">{s.name}{s.mutagen && <span className="text-cinnabar">化{s.mutagen}</span>}</span>
                    ))}
                  </div>
                  <div className="text-[9px] text-t5 leading-tight">{p.adjectiveStars.slice(0, 4).join(' ')}</div>
                  <div className="mt-auto pt-1.5 flex items-end justify-between">
                    <div>
                      <div className={`text-[11px] ${p.isSoul ? 'text-gold' : 'text-t2'}`}>
                        {p.name}{p.isBody && <span className="text-azure ml-1">身</span>}
                      </div>
                      <div className="text-[9px] text-t4">{p.decadalRange.join('–')}岁</div>
                    </div>
                    <div className="text-[10px] font-mono text-t4">{p.stem}{p.branch}</div>
                  </div>
                  {(isDecadal || isYearly) && (
                    <div className="text-[9px] mt-1">
                      {isDecadal && <span className="text-violet/70">大限 </span>}
                      {isYearly && <span className="text-jade/70">流年</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="三方四正" right={
          <select value={focusPalace} onChange={e => setFocusPalace(e.target.value)} className={`${inputCls} !py-1 !text-[12px]`} style={{ width: 110 }}>
            {ziwei.palaces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        }>
          <div className="grid grid-cols-4 gap-2">
            {pro.trine.map((t, i) => (
              <div key={i} className={`rounded-xl border p-3 ${i === 0 ? 'border-gold/35 bg-tint-gold' : 'border-b1 bg-subtle'}`}>
                <div className="text-[10px] text-t4">{t.role}</div>
                <div className="text-[13px] text-t1 mt-0.5">{t.palace.name} <span className="font-mono text-[11px] text-t4">{t.palace.stem}{t.palace.branch}</span></div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.palace.majorStars.map(s2 => (
                    <span key={s2.name} className="text-[11px] text-violet/85">
                      {s2.name}<span className="text-t4">{s2.brightness}</span>{s2.mutagen && <span className="text-cinnabar">化{s2.mutagen}</span>}
                    </span>
                  ))}
                  {!t.palace.majorStars.length && <span className="text-[11px] text-t4">无主星</span>}
                </div>
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-1.5">
            {pro.notes.map((n, i) => <li key={i} className="text-[12px] text-t3 leading-relaxed">· {n}</li>)}
          </ul>
        </Card>

        <Card title="命宫主星">
          <div className="space-y-2">
            {ziwei.soulMajors.map(s => (
              <div key={s.name} className="rounded-xl border border-b1 bg-subtle px-4 py-3">
                <div className="text-[13px] text-violet/90 mb-1">
                  {s.name}<span className="text-t4 ml-1">{s.brightness}</span>{s.mutagen && <span className="text-cinnabar ml-1">化{s.mutagen}</span>}
                </div>
                <p className="text-[12px] text-t3 leading-relaxed">{MAJOR_STARS[s.name]?.plain}</p>
              </div>
            ))}
            {!ziwei.soulMajors.length && <p className="text-[12px] text-t4">命宫无主星。</p>}
          </div>
        </Card>

        <Disclaimer />
      </div>
    </div>
  );
}

/* ---------------- 六爻 ---------------- */
export function LiuyaoTool() {
  const [question, setQuestion] = useState('');
  const [gua, setGua] = useState(null);

  const cast = () => {
    const lunar = Solar.fromDate(new Date()).getLunar();
    const c = castCoins();
    setGua(buildLiuYao({ ...c, dayGan: lunar.getDayGan(), dayZhi: lunar.getDayZhi(), question }));
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-5">
        <PageHeader title="六爻" subtitle="三枚铜钱摇六次成卦。装卦采用京房纳甲，世应按八宫卦序定位，六亲以卦宫五行为我。" />

        <Card>
          <Field label="所问何事" hint="可留空">
            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="心里想着这件事，再摇卦" className={inputCls} />
          </Field>
          <Button className="mt-3" onClick={cast}>{gua ? '重新摇卦' : '摇卦'}</Button>
        </Card>

        {gua && (
          <>
            <Card title="卦象" className="animate-in">
              <HexagramView gua={gua} />
              <div className="mt-4 pt-3 border-t border-b1">
                <AskDSH prompt={toolPrompt('六爻', liuyaoFacts(gua), question)} />
              </div>
            </Card>

            <Card title="读法">
              <div className="space-y-2.5 text-[13px] text-t2 leading-relaxed">
                <p>
                  本卦 <span className="text-t1">{gua.ben.name}</span>（{gua.ben.meta.palaceName}宫{gua.ben.meta.posLabel}）——{gua.ben.plain}
                </p>
                {gua.bian ? (
                  <p>
                    动爻 {gua.moving.map(i => i + 1).join('、')}，变为 <span className="text-t1">{gua.bian.name}</span>——{gua.bian.plain}事情的走向偏「{gua.bian.tendency}」。
                  </p>
                ) : (
                  <p>六爻皆静，无动爻。按传统读法，形势暂时不会自己改变。</p>
                )}
                <p>
                  世爻在第 {gua.shi.pos} 爻（{gua.shi.ganZhi}·{gua.shi.liuQin}），代表你自己；应爻在第 {gua.ying.pos} 爻（{gua.ying.ganZhi}·{gua.ying.liuQin}），代表对方或外部条件。
                  两者关系为「{gua.shiYingRel.label}」——{gua.shiYingRel.desc}。
                </p>
                <p>互卦 <span className="text-t1">{gua.hu.name}</span>，代表事情中段的样子：{gua.hu.plain}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-b1 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-1.5">六亲</div>
                  {[...new Set(gua.yao.map(y => y.liuQin))].map(q => (
                    <div key={q} className="text-[11px] text-t3"><span className="text-t2">{q}</span> — {LIUQIN_MEANING[q]}</div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-1.5">动爻六神</div>
                  {gua.moving.length ? gua.moving.map(i => (
                    <div key={i} className="text-[11px] text-t3">
                      <span className="text-t2">{gua.yao[i].liuShen}</span> — {LIUSHEN_MEANING[gua.yao[i].liuShen]}
                    </div>
                  )) : <div className="text-[11px] text-t4">无动爻</div>}
                </div>
              </div>
            </Card>
          </>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}

/* ---------------- 梅花易数 ---------------- */
export function MeihuaTool() {
  const [method, setMethod] = useState('time');
  const [question, setQuestion] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [g, setG] = useState(null);

  const run = () => {
    const cast = method === 'time' ? castByTime(new Date()) : castByNumbers(Number(a) || 1, Number(b) || 1);
    setG(buildMeihua(cast, question));
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-5">
        <PageHeader title="梅花易数" subtitle="以时间或数字起卦，用体用生克看你与这件事之间的关系，而不是单纯看卦的吉凶。" />

        <Card>
          <Tabs value={method} onChange={setMethod} tabs={[{ key: 'time', label: '时间起卦' }, { key: 'number', label: '数字起卦' }]} size="sm" />
          <div className="mt-4 space-y-3">
            <Field label="所问何事" hint="可留空">
              <input value={question} onChange={e => setQuestion(e.target.value)} className={inputCls} placeholder="想问的事" />
            </Field>
            {method === 'number' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="第一个数" hint="定上卦"><input value={a} onChange={e => setA(e.target.value)} type="number" className={inputCls} placeholder="任意数字" /></Field>
                <Field label="第二个数" hint="定下卦"><input value={b} onChange={e => setB(e.target.value)} type="number" className={inputCls} placeholder="任意数字" /></Field>
              </div>
            )}
            <Button onClick={run}>{g ? '重新起卦' : '起卦'}</Button>
          </div>
        </Card>

        {g && (
          <>
            <Card title="卦象" className="animate-in">
              <div className="mb-3"><AskDSH prompt={toolPrompt('梅花易数', meihuaFacts(g), question)} /></div>
              <MeihuaView g={g} />
              <div className="mt-4 pt-3 border-t border-b1 text-[11px] text-t4 leading-relaxed font-mono">
                {g.cast.text}<br />
                {g.cast.formula.upper} → 上卦{g.ben.upper.name}<br />
                {g.cast.formula.lower} → 下卦{g.ben.lower.name}<br />
                {g.cast.formula.moving} → 动爻第 {g.movingLine} 爻
              </div>
            </Card>

            <Card title="读法">
              <div className="space-y-2.5 text-[13px] text-t2 leading-relaxed">
                <p>本卦 <span className="text-t1">{g.ben.name}</span>——{g.ben.plain}</p>
                <p>互卦 <span className="text-t1">{g.hu.name}</span>，事情中段：{g.hu.plain}</p>
                <p>变卦 <span className="text-t1">{g.bian.name}</span>，最终走向：{g.bian.plain}</p>
                <p>
                  体卦 {g.ti.trigram.name}（{g.ti.trigram.trait}），用卦 {g.yong.trigram.name}（{g.yong.trigram.trait}）。
                  两者关系为「{g.tiYong.label}」——{g.tiYong.desc}
                </p>
                <p className="text-t3">整体{g.verdict}。按传统读法，这只说明结构上顺或不顺，不预测具体结果。</p>
              </div>
            </Card>
          </>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
