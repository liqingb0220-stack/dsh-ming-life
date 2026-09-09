import React, { useMemo, useState } from 'react';
import { PageHeader, Card, Button, Field, inputCls, Tabs, Empty } from '../components/ui';
import Disclaimer from '../components/Disclaimer';
import Interpretation from '../components/Interpretation';
import { surnameFacts, nameMaterial, nameRules, parseNamesFromText, checkName } from '../engines/naming';
import { NAME_SCENES } from '../data/nameChars';
import { buildRequest, hashOf } from '../dsh/facts';
import { WX_COLOR } from '../data/colors';

/** 起名：工作台给事实、规则和用字材料，DSH 起名；起完工作台逐个核对读音、五行、笔画。 */
export default function Naming({ bazi, profile, ziwei, corr, gender, interp = {}, hosted, onRequest, namings = [], onAdd, onRemove }) {
  const runs = namings.filter(n => n.surname);
  const latest = runs[0] || null;
  const [surname, setSurname] = useState(latest?.surname || '');
  const [scene, setScene] = useState(latest?.scene || 'baby');
  const [brief, setBrief] = useState(latest?.brief || '');
  const [length, setLength] = useState(latest?.length || 2);
  const [run, setRun] = useState(latest);

  const request = useMemo(() => {
    if (!run || !bazi) return null;
    const sceneLabel = NAME_SCENES.find(s => s.key === run.scene)?.label || run.scene;
    return buildRequest('naming', {
      profile, bazi, ziwei, corr, gender,
      naming: { ...run, sceneLabel, surnameText: surnameFacts(run.surname).text, rules: nameRules(bazi, run.surname), material: nameMaterial(bazi, run.brief) }
    });
  }, [run, profile, bazi, ziwei, corr, gender]);

  const it = request ? interp[request.key] : null;
  const checks = useMemo(() => (run && it?.text ? parseNamesFromText(it.text, run.surname).map(f => checkName(run.surname, f, bazi)) : []), [run, it?.text, bazi]);
  const rules = useMemo(() => (bazi && surname.trim() ? nameRules(bazi, surname.trim()) : []), [bazi, surname]);

  const go = () => { if (!surname.trim()) return; const r = { surname: surname.trim(), scene, brief: brief.trim(), length }; setRun(onAdd ? onAdd(r) : r); };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-5">
        <PageHeader title="起名" subtitle="名字由 DSH 来起。工作台只负责把事实（姓氏读音五行、命局喜用）、传统起名规则和一批用字材料交给它，起完再逐个核对读音、五行、笔画。" />

        <Card>
          <div className="grid grid-cols-[1fr_2fr] gap-4">
            <Field label="姓氏" required><input value={surname} onChange={e => setSurname(e.target.value)} maxLength={2} placeholder="例如：林" className={inputCls} /></Field>
            <Field label="用途"><Tabs value={scene} onChange={setScene} size="sm" tabs={NAME_SCENES.map(s => ({ key: s.key, label: s.label }))} /></Field>
          </div>
          <div className="mt-3">
            <Field label="参考信息" hint="可不填：期望的气质、想用或想避开的字、纪念什么……">
              <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={2} placeholder="例如：希望气质清朗一些；想用到「川」字；避免与家中长辈重字" className={`${inputCls} resize-none`} />
            </Field>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
            <Tabs value={String(length)} onChange={v => setLength(Number(v))} size="sm" tabs={[{ key: '1', label: '单字名' }, { key: '2', label: '双字名' }]} />
            <Button disabled={!surname.trim()} onClick={go}>请 DSH 起名</Button>
          </div>
          {rules.length > 0 && (
            <ul className="mt-3 pt-3 border-t border-b1 space-y-1">
              {rules.map((r, i) => <li key={i} className="text-[11px] text-t4 leading-relaxed flex gap-2"><span className="text-t5">·</span><span>{r}</span></li>)}
            </ul>
          )}
        </Card>

        {!run && <Empty icon="名" title="填个姓氏就能开始" desc="用途、参考信息、命局喜用和用字材料会一起交给 DSH。" />}

        {request && <Interpretation key={request.key} it={it} request={request} hosted={hosted} onRequest={onRequest} size="lg" title={`${run.surname}姓 · ${NAME_SCENES.find(s => s.key === run.scene)?.label || ''} · 由 DSH 起`} />}

        {checks.length > 0 && (
          <Card title="工作台核对" right={<span className="text-[11px] text-t4">按字库核对 DSH 起的名字；字库里没有的字以 DSH 的说明为准</span>}>
            <div className="space-y-3">
              {checks.map(c => (
                <div key={c.full} className="flex items-start gap-4">
                  <div className="font-display text-[24px] tracking-wider shrink-0 w-28">
                    <span className="text-t1">{run.surname}</span>
                    {c.chars.map(x => <span key={x.c} style={{ color: x.known ? WX_COLOR[x.wuxing] : 'var(--t3)' }}>{x.c}</span>)}
                  </div>
                  <div className="text-[12px] text-t3 leading-relaxed min-w-0">
                    {c.chars.map(x => x.known ? `${x.c} ${x.pinyin} 属${x.wuxing} ${x.strokes} 画` : `${x.c}（字库无此字）`).join('　')}
                    {c.pattern && <span className="ml-2">· 平仄「{c.pattern}」</span>}
                    {c.strokes !== null && <span className="ml-2">· 共 {c.strokes} 画</span>}
                    {bazi && c.unknown.length === 0 && <span className="ml-2" style={{ color: c.favorHits ? 'var(--jade)' : 'var(--t4)' }}>· {c.favorHits ? `${c.favorHits} 个字合喜用` : '未用到喜用五行'}</span>}
                    {c.soundIssues.map((s, i) => <div key={i} className="text-cinnabar/70">− {s}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {runs.length > 1 && (
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-t4 px-1">起过的名</div>
            {runs.map(r => {
              const k = `naming:${hashOf(r.surname + r.scene + (r.brief || '') + r.length)}`;
              const st = interp[k];
              return (
                <div key={r.naming_id} className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${run?.naming_id === r.naming_id ? 'border-jade/40 bg-tint-jade' : 'border-b1 bg-card'}`}>
                  <button onClick={() => { setRun(r); setSurname(r.surname); setScene(r.scene); setBrief(r.brief || ''); setLength(r.length); }} className="text-left min-w-0 flex-1">
                    <div className="text-[13px] text-t1">{r.surname}姓 · {NAME_SCENES.find(s => s.key === r.scene)?.label || r.scene} · {r.length} 字{r.brief ? ` · ${r.brief.slice(0, 20)}` : ''}</div>
                    <div className="text-[11px] text-t4 mt-0.5">{new Date(r.created_at).toLocaleDateString('zh-CN')} · {st?.text ? '已起好' : st?.status === 'pending' ? 'DSH 起名中' : '未请求'}</div>
                  </button>
                  {onRemove && <button onClick={() => { onRemove(r.naming_id); if (run?.naming_id === r.naming_id) setRun(null); }} className="text-t5 hover:text-cinnabar/70 shrink-0">×</button>}
                </div>
              );
            })}
          </div>
        )}
        <Disclaimer />
      </div>
    </div>
  );
}
