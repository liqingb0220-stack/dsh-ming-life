import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Button, Field, inputCls, Tabs, Empty, Bar, DateInput, TimeInput, tint } from '../components/ui';
import { resolvePlace } from '../engines/solar';
import Disclaimer from '../components/Disclaimer';
import { compareCharts, RELATION_KINDS } from '../engines/relation';
import * as S from '../store/store';
import Interpretation from '../components/Interpretation';
import { buildRequest } from '../dsh/facts';

function AddPerson({ onAdd, onCancel }) {
  const [nickname, setNickname] = useState('');
  const [kind, setKind] = useState('partner');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState('女');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthLng, setBirthLng] = useState('');
  const [err, setErr] = useState('');
  const place = resolvePlace(birthPlace);

  return (
    <Card title="添加一个人">
      <div className="grid grid-cols-2 gap-4">
        <Field label="昵称" required>
          <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="怎么称呼这个人" className={inputCls} />
        </Field>
        <Field label="与我的关系">
          <select value={kind} onChange={e => setKind(e.target.value)} className={inputCls}>
            {RELATION_KINDS.map(k => <option key={k.key} value={k.key}>{k.label}</option>)}
          </select>
        </Field>
        <Field label="出生日期" required>
          <DateInput value={birthDate} onChange={e => setBirthDate(e.target.value)} min="1900-01-01" max="2100-12-31" />
        </Field>
        <Field label="出生时间">
          <div className="flex items-center gap-3">
            <TimeInput value={birthTime} onChange={e => setBirthTime(e.target.value)} disabled={timeUnknown} className={timeUnknown ? 'opacity-30' : ''} />
            <label className="flex items-center gap-1.5 text-[12px] text-t3 shrink-0 cursor-pointer">
              <input type="checkbox" checked={timeUnknown} onChange={e => setTimeUnknown(e.target.checked)} className="accent-jade" />不确定
            </label>
          </div>
        </Field>
        <Field label="性别">
          <Tabs value={gender} onChange={setGender} size="sm" tabs={[{ key: '男', label: '男' }, { key: '女', label: '女' }]} />
        </Field>
        <Field label="出生地" hint="用于真太阳时校正">
          <input value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="例如：广东 广州" className={inputCls} />
          {place && <p className="mt-1 text-[11px] text-t4">识别为 {place.name}（东经 {place.lng}°）</p>}
          {birthPlace.trim() && !place && (
            <div className="mt-1.5 flex items-center gap-2"><span className="text-[11px] text-gold/80">没认出，可填经度：</span><input value={birthLng} onChange={e => setBirthLng(e.target.value)} type="number" step="0.1" placeholder="116.4" className={`${inputCls} !w-24 !py-1 !text-[12px]`} /></div>
          )}
        </Field>
      </div>
      {err && <p className="mt-3 text-[12px] text-cinnabar/80">{err}</p>}
      <p className="mt-3 text-[11px] text-t4 leading-relaxed">
        只在本地保存，用于生成互动结构。填别人的出生信息前，请确认对方知情。
      </p>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => {
          if (!nickname.trim()) return setErr('请填写昵称。');
          if (!birthDate) return setErr('请填写出生日期。');
          if (!timeUnknown && !birthTime) return setErr('请填写出生时间，或勾选「不确定」。');
          onAdd({ nickname: nickname.trim(), kind, birthDate, birthTime, timeUnknown, gender, birthPlace: birthPlace.trim(), birthLng: !place ? birthLng : '' });
        }}>添加</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>取消</Button>}
      </div>
    </Card>
  );
}

export default function WhoWithMe({ bazi, ziwei, persons, nickname, onAdd, onRemove, onFocus, profile, corr, gender, interp = {}, hosted, onRequest }) {
  const [activeId, setActiveId] = useState(null);
  const [adding, setAdding] = useState(false);

  const active = persons.find(p => p.person_id === activeId) || null;

  const result = useMemo(() => {
    if (!active || !bazi) return null;
    const charts = S.personCharts(active);
    return compareCharts(
      { bazi, ziwei, name: nickname || '我' },
      { ...charts, name: active.nickname }
    );
  }, [active, bazi, ziwei, nickname]);

  const request = useMemo(() => {
    if (!active || !result) return null;
    const charts = S.personCharts(active);
    return buildRequest('person', {
      profile, bazi, ziwei, corr, gender,
      person: { ...active, kindLabel: RELATION_KINDS.find(k => k.key === active.kind)?.label || '' },
      relation: {
        themPillars: charts.bazi.pillars.map(p => p.gan + p.zhi).join(' '),
        themDayMaster: `${charts.bazi.dayMaster.gan}（${charts.bazi.dayMaster.wuxing}）${charts.bazi.strength.label}`,
        themSoul: charts.ziwei ? charts.ziwei.soulMajors.map(s => s.name).join('、') || '无主星' : '',
        ganRel: `${result.ganRelInfo.text}；对方于我为${result.theyToMe}，我于对方为${result.meToThem}`,
        zhiRels: result.zhiRels.map(r => r.label).join('、'),
        palaceRels: result.palaceRels.map(r => `命宫地支${r.label}`).join('、'),
        dims: result.dimPairs.map(d => `- ${d.label}：我 ${d.mine} / 对方 ${d.theirs}${d.gap >= d.gapThreshold ? '（差距明显）' : ''}`)
      }
    });
  }, [active, result, profile, bazi, ziwei, corr, gender]);

  if (!bazi) return <Empty title="尚未建立档案" desc="合盘需要先有你自己的基础档案。" />;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl mx-auto px-8 py-10 space-y-5">
        <PageHeader
          title="谁与我同行"
          subtitle="这里不给「你们契合度 89%」这种数字。两个人合不合得来取决于怎么处理差异，所以输出的是互动结构：哪里节奏不同、冲突可能从哪来、哪些差异其实可以分工。"
          right={!adding && <Button onClick={() => setAdding(true)}>添加一个人</Button>}
        />

        {adding && (
          <AddPerson
            onCancel={() => setAdding(false)}
            onAdd={p => { const id = onAdd(p); setAdding(false); setActiveId(id); }}
          />
        )}

        {persons.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {persons.map(p => (
              <button key={p.person_id}
                onClick={() => { setActiveId(activeId === p.person_id ? null : p.person_id); onFocus?.(`人物：${p.nickname}`); }}
                className={`px-3.5 py-2 rounded-xl border text-left transition-colors ${activeId === p.person_id ? 'border-jade/40 bg-tint-jade' : 'border-b1 hover:border-b2'}`}>
                <div className="text-[13px] text-t1">{p.nickname}</div>
                <div className="text-[10px] text-t4">
                  {RELATION_KINDS.find(k => k.key === p.kind)?.label} · {p.birth_date}{p.birth_place ? ` · ${p.birth_place}` : ''}
                </div>
              </button>
            ))}
          </div>
        )}

        {!persons.length && !adding && (
          <Empty icon="⁂" title="还没有添加任何人" desc="添加一个人的出生信息，就能看到你们之间的互动结构。" action={<Button onClick={() => setAdding(true)}>添加一个人</Button>} />
        )}

        {result && (
          <div className="space-y-4 animate-in">
            {request && <Interpretation it={interp[request.key]} request={request} hosted={hosted} onRequest={onRequest} size="lg" title={`DSH 的解读 · 我和${active.nickname}`} />}

            <Card title="两人画像对照">
              <div className="space-y-3">
                {result.dimPairs.map(d => (
                  <div key={d.key}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-t3">{d.label}</span>
                      <span className="font-mono text-t4">
                        {nickname || '我'} {d.mine} · {active.nickname} {d.theirs}
                        {d.gap >= d.gapThreshold && <span className="text-gold ml-2">差 {d.gap}</span>}
                      </span>
                    </div>
                    <div className="relative h-5">
                      <div className="absolute inset-x-0 top-2 h-[3px] rounded bg-hover" />
                      <div className="absolute top-2 h-[3px] rounded" style={{
                        left: `${Math.min(d.mine, d.theirs)}%`,
                        width: `${Math.abs(d.mine - d.theirs)}%`,
                        background: d.gap >= d.gapThreshold ? '#e8b96a55' : tint(d.color, 27)
                      }} />
                      <div className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 top-[3px]" style={{ left: `${d.mine}%`, background: d.color }} title={`${nickname || '我'} ${d.mine}`} />
                      <div className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 top-[3px] border-2" style={{ left: `${d.theirs}%`, background: 'var(--bg-card)', borderColor: d.color }} title={`${active.nickname} ${d.theirs}`} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-t4">
                实心点为你，空心点为对方。差距超过该维度的判定阈值时高亮——阈值按维度各自的离散度标定，不是统一数字。
              </p>
            </Card>

            <Card title="盘面事实">
              <ul className="text-[12px] text-t3 space-y-1 leading-relaxed">
                <li>日主：{result.ganRelInfo.text}；对方于我为{result.theyToMe}，我于对方为{result.meToThem}。</li>
                <li>日支：{result.zhiRels.length ? result.zhiRels.map(r => `${r.label}（${r.plain}）`).join('；') : '没有合、冲、刑、害关系'}。</li>
                {result.palaceRels.length > 0 && <li>紫微命宫地支：{result.palaceRels.map(r => r.label).join('、')}。</li>}
              </ul>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card title="冲突可能从哪来">
                {result.conflicts.length ? (
                  <ul className="space-y-2.5">
                    {result.conflicts.map((c, i) => (
                      <li key={i} className="text-[12px] leading-relaxed">
                        <span className="text-cinnabar/80">{c.source}</span>
                        <span className="text-t3"> — {c.plain}</span>
                        <div className="text-[10px] text-t4 mt-0.5">依据：{c.basis}</div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[12px] text-t4">没有识别出典型的冲突结构。</p>}
              </Card>
              <Card title="互补之处">
                {result.complements.length ? (
                  <ul className="space-y-2.5">
                    {result.complements.map((c, i) => (
                      <li key={i} className="text-[12px] leading-relaxed">
                        <span className="text-jade/80">{c.source}</span>
                        <span className="text-t3"> — {c.plain}</span>
                        <div className="text-[10px] text-t4 mt-0.5">依据：{c.basis}</div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[12px] text-t4">没有识别出明显的互补结构。</p>}
              </Card>
            </div>

            <Card>
              <p className="text-[12px] text-t3 leading-relaxed">
                冲突与互补经常是同一件事的两面：同一个差距，配合得好是分工，配合不好就是摩擦。这里能给的只是「差在哪」，怎么处理是你们两个人的事。
              </p>
              <Button variant="danger" size="sm" className="mt-3" onClick={() => { onRemove(active.person_id); setActiveId(null); }}>
                删除 {active.nickname} 的记录
              </Button>
            </Card>
          </div>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
