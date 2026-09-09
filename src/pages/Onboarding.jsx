import React, { useState, useMemo } from 'react';
import { Button, Field, inputCls, Tabs, Card, DateInput, TimeInput as ClockInput } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import { GAN, ZHI, isValidPillar } from '../engines/ganzhi';
import { solarFromPillars, REVERSE_HINT, SHICHEN, shichenOfHour } from '../engines/reverse';
import { resolvePlace, solarCorrection } from '../engines/solar';
import { RELATIONS } from '../store/store';

/** 出生时间：可以填精确时刻（24 小时制），也可以只选时辰 */
function TimeInput({ mode, setMode, time, setTime, shichen, setShichen, unknown, setUnknown }) {
  return (
    <Field label="出生时间" hint="决定时柱与紫微命宫，尽量填">
      <Tabs
        value={mode} onChange={setMode} size="sm"
        tabs={[
          { key: 'exact', label: '知道几点几分' },
          { key: 'shichen', label: '只知道大概时辰' },
          { key: 'unknown', label: '完全不知道' }
        ]}
      />

      {mode === 'exact' && (
        <div className="mt-3">
          <ClockInput value={time} onChange={e => setTime(e.target.value)} step="60" />
          <p className="mt-1.5 text-[11px] text-t4">
            24 小时制。下午 2 点半请填 <span className="font-mono text-t3">14:30</span>，不是 02:30。
            {time && <span className="text-jade">　当前：{time} = {shichenOfHour(Number(time.split(':')[0])).label}</span>}
          </p>
        </div>
      )}

      {mode === 'shichen' && (
        <div className="mt-3">
          <div className="grid grid-cols-4 gap-1.5">
            {SHICHEN.map(s => (
              <button
                key={s.zhi} onClick={() => setShichen(s.zhi)}
                className={`rounded-lg px-2 py-2 text-left border transition-colors ${
                  shichen === s.zhi ? 'border-jade bg-tint-jade' : 'border-b1 hover:border-b2'
                }`}
              >
                <div className="text-[13px] text-t1">{s.label}</div>
                <div className="text-[10px] text-t4 font-mono">{s.range}</div>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-t4">按时辰计算，与填该时辰内任意时刻的结果一致。</p>
        </div>
      )}

      {mode === 'unknown' && (
        <p className="mt-3 text-[12px] text-gold leading-relaxed">
          时柱会按正午占位。八字的年月日三柱、五行与十神照常可用；
          时柱、紫微命宫、以及所有跟「时」有关的判断都不可靠，界面上会一直标注出来。
        </p>
      )}
    </Field>
  );
}

/** 单柱的干支选择。必须定义在组件外，否则每次渲染都会被当成新组件重新挂载，选一个就丢一次焦点。 */
function PillarInput({ k, label, pillars, onChange }) {
  return (
    <Field label={label}>
      <div className="flex gap-1.5">
        <select value={pillars[k][0] || ''} onChange={e => onChange(k, e.target.value + (pillars[k][1] || ''))} className={inputCls}>
          <option value="">天干</option>
          {GAN.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={pillars[k][1] || ''} onChange={e => onChange(k, (pillars[k][0] || '') + e.target.value)} className={inputCls}>
          <option value="">地支</option>
          {ZHI.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>
    </Field>
  );
}

export default function Onboarding({ onCreate, onCancel, existing, isFirst }) {
  const [tab, setTab] = useState(existing?.source === 'pillars' ? 'pillars' : 'birth');
  const [name, setName] = useState(existing?.name || '');
  const [relation, setRelation] = useState(existing?.relation || 'self');
  const [gender, setGender] = useState(existing?.gender || '男');
  const [birthDate, setBirthDate] = useState(existing?.birth_date || '');
  const [birthPlace, setBirthPlace] = useState(existing?.birth_place || '');
  const [birthLng, setBirthLng] = useState(existing?.birth_lng ? String(existing.birth_lng) : '');
  const [timeMode, setTimeMode] = useState(
    existing?.time_unknown ? 'unknown' : existing?.birth_time ? 'exact' : 'exact'
  );
  const [time, setTime] = useState(existing?.birth_time || '');
  const [shichen, setShichen] = useState('');
  const [pillars, setPillars] = useState(existing?.manual_pillars || { year: '', month: '', day: '', hour: '' });
  const [picked, setPicked] = useState(null);
  const [err, setErr] = useState('');

  const pillarsComplete = ['year', 'month', 'day', 'hour'].every(k => isValidPillar(pillars[k]));
  const reverse = useMemo(
    () => (pillarsComplete ? solarFromPillars(pillars) : null),
    [pillarsComplete, pillars.year, pillars.month, pillars.day, pillars.hour]
  );

  const place = useMemo(() => resolvePlace(birthPlace), [birthPlace]);
  const manualLng = Number(birthLng);
  const lngInUse = place ? place.lng : (Number.isFinite(manualLng) && manualLng !== 0 ? manualLng : null);
  const preview = useMemo(() => {
    if (!birthDate || timeMode !== 'exact' || !time || lngInUse === null) return null;
    try { return solarCorrection({ date: birthDate, time, lng: lngInUse, tz: place?.tz ?? 8 }); } catch { return null; }
  }, [birthDate, time, timeMode, lngInUse, place]);

  const resolvedTime = () => {
    if (timeMode === 'unknown') return { birth_time: null, time_unknown: true };
    if (timeMode === 'shichen') {
      const s = SHICHEN.find(x => x.zhi === shichen);
      return { birth_time: s ? s.display : null, time_unknown: false };
    }
    return { birth_time: time, time_unknown: false };
  };

  const submitBirth = () => {
    if (!name.trim()) return setErr('请给这个档案起个名字，方便以后区分。');
    if (!birthDate) return setErr('出生日期是必填项。');
    const y = Number(birthDate.slice(0, 4));
    if (y < 1900 || y > 2100) return setErr('出生年份需在 1900–2100 之间。');
    if (timeMode === 'exact' && !time) return setErr('请填写出生时间，或改选「只知道大概时辰」「完全不知道」。');
    if (timeMode === 'shichen' && !shichen) return setErr('请选一个时辰。');
    setErr('');
    onCreate({
      name: name.trim(), relation, gender, source: 'birth',
      birth_date: birthDate, birth_place: birthPlace, birth_lng: !place && Number.isFinite(manualLng) && manualLng !== 0 ? manualLng : null, manual_pillars: null,
      ...resolvedTime()
    });
  };

  const submitPillars = () => {
    if (!name.trim()) return setErr('请给这个档案起个名字。');
    if (!pillarsComplete) return setErr('四柱需要各填一个完整的干支。');
    if (!reverse.ok) return setErr(REVERSE_HINT[reverse.reason]);
    if (!picked) return setErr('请选择你实际的出生年份。');
    const c = reverse.candidates.find(x => x.date === picked);
    setErr('');
    onCreate({
      name: name.trim(), relation, gender, source: 'pillars',
      birth_date: c.date, birth_time: c.time, time_unknown: false,
      birth_place: '', manual_pillars: { ...pillars }
    });
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-app">
      <div className="max-w-xl mx-auto px-8 py-14">
        <div className="text-center mb-9">
          <div className="text-[38px] text-gold/50 font-display mb-3">☯</div>
          <h1 className="font-display text-[26px] text-t1 tracking-wide">
            {existing ? '修改档案' : isFirst ? '先告诉我，你从哪里出发。' : '新建一个档案'}
          </h1>
          <p className="text-[13px] text-t3 mt-3 leading-relaxed">
            {existing
              ? '改完之后，八字与紫微会重新排盘；已经保存的解读记录不会被覆盖。'
              : '一个人一个档案。你可以给自己、孩子、家人分别建，随时在左上角切换。'}
          </p>
        </div>

        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="这个档案是谁" required>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="姓名或称呼，例如：李明" className={inputCls} maxLength={20} />
            </Field>
            <Field label="与我的关系">
              <select value={relation} onChange={e => setRelation(e.target.value)} className={inputCls}>
                {RELATIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="性别" hint="大运方向与紫微排盘需要">
            <Tabs value={gender} onChange={setGender} size="sm" tabs={[{ key: '男', label: '男' }, { key: '女', label: '女' }]} />
          </Field>

          <div className="pt-2 border-t border-b1">
            <Tabs
              value={tab} onChange={t => { setTab(t); setErr(''); }}
              tabs={[{ key: 'birth', label: '我知道出生日期' }, { key: 'pillars', label: '我只知道八字' }]}
            />
          </div>

          {tab === 'birth' ? (
            <>
              <Field label="出生日期" required hint="公历（阳历）">
                <DateInput value={birthDate} onChange={e => setBirthDate(e.target.value)} min="1900-01-01" max="2100-12-31" />
              </Field>

              <TimeInput
                mode={timeMode} setMode={setTimeMode}
                time={time} setTime={setTime}
                shichen={shichen} setShichen={setShichen}
              />

              <Field label="出生地点" hint="用于真太阳时校正：钟表时间是北京时间，排盘按的是当地太阳的位置">
                <input value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="例如：浙江 杭州（或直接写城市名）" className={inputCls} />
                {place && (
                  <p className="mt-1.5 text-[11px] text-t4">
                    识别为 <span className="text-t2">{place.name}</span>（东经 {place.lng}°）
                    {preview ? <>，真太阳时 <span className="text-t2">{preview.time}</span>（经度差 {preview.lngMin >= 0 ? '+' : ''}{preview.lngMin} 分，均时差 {preview.eot >= 0 ? '+' : ''}{preview.eot} 分{preview.dayShift ? '，跨日' : ''}）</> : '，填了出生时间后这里会显示校正结果'}
                  </p>
                )}
                {birthPlace.trim() && !place && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] text-gold/80">没认出这个地方。可以直接填经度：</span>
                    <input value={birthLng} onChange={e => setBirthLng(e.target.value)} type="number" step="0.1" placeholder="如 116.4" className={`${inputCls} !w-28 !py-1 !text-[12px]`} />
                    {preview && <span className="text-[11px] text-t4">→ 真太阳时 {preview.time}</span>}
                  </div>
                )}
              </Field>

              {err && <p className="text-[12px] text-cinnabar">{err}</p>}
              <Button size="lg" onClick={submitBirth} className="w-full">{existing ? '保存修改' : '建立档案'}</Button>
            </>
          ) : (
            <>
              <p className="text-[12px] text-t3 leading-relaxed">
                填好四柱后，系统会反推出对应的公历出生日期——年月日时干支之间有固定的推导关系，
                一组四柱在 1900–2100 年内通常只对应两三个日期。选中你实际的那一个，档案就和直接填出生日期完全一样，
                紫微、黄历、人生时间轴都能用。
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[['year', '年柱'], ['month', '月柱'], ['day', '日柱'], ['hour', '时柱']].map(([k, label]) => (
                  <PillarInput
                    key={k} k={k} label={label} pillars={pillars}
                    onChange={(key, val) => { setPillars(p => ({ ...p, [key]: val })); setPicked(null); }}
                  />
                ))}
              </div>

              <div className="rounded-lg bg-subtle px-3 py-2.5 text-center font-display text-lg tracking-[0.3em] text-t2">
                {['year', 'month', 'day', 'hour'].map(k => pillars[k] || '□□').join(' ')}
              </div>

              {pillarsComplete && reverse && (
                reverse.ok ? (
                  <div>
                    <div className="text-[12px] text-t2 mb-2">
                      找到 {reverse.candidates.length} 个可能的出生日期，请选择你实际的那一个：
                    </div>
                    <div className="space-y-1.5">
                      {reverse.candidates.map(c => (
                        <button
                          key={c.date} onClick={() => { setPicked(c.date); setErr(''); }}
                          className={`w-full text-left rounded-xl border px-4 py-2.5 transition-colors ${
                            picked === c.date ? 'border-jade bg-tint-jade' : 'border-b1 hover:border-b2'
                          }`}
                        >
                          <div className="text-[14px] text-t1 font-mono">{c.date}</div>
                          <div className="text-[11px] text-t3 mt-0.5">
                            {c.lunarText} · {c.shichen.label} {c.shichen.range}
                            {c.lateZi && <span className="text-gold ml-1">（晚子时）</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-cinnabar leading-relaxed">{REVERSE_HINT[reverse.reason]}</p>
                )
              )}

              {err && <p className="text-[12px] text-cinnabar">{err}</p>}
              <Button size="lg" onClick={submitPillars} className="w-full" disabled={!reverse?.ok || !picked}>
                {existing ? '保存修改' : '建立档案'}
              </Button>
            </>
          )}

          {onCancel && <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">取消</Button>}
        </Card>

        <div className="mt-7"><Disclaimer /></div>
      </div>
    </div>
  );
}
