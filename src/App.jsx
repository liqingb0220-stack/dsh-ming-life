import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { applyTheme } from './components/ThemeToggle';
import Sidebar, { NAV } from './components/Sidebar';
import ContextPanel from './components/ContextPanel';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import WhoAmI from './pages/WhoAmI';
import Reveal from './pages/Reveal';
import Timeline from './pages/Timeline';
import Ask from './pages/Ask';
import { BaziTool, ZiweiTool, LiuyaoTool, MeihuaTool } from './pages/Tools';
import { HuangliTool, YijingTool } from './pages/Tools2';
import WhenToGo from './pages/WhenToGo';
import WhereToGo from './pages/WhereToGo';
import WhoWithMe from './pages/WhoWithMe';
import Alternate from './pages/Alternate';
import Naming from './pages/Naming';
import * as S from './store/store';
import * as DSH from './dsh/bridge';
import { castForQuestion } from './engines/cast';

const PAGE_LABEL = {};
NAV.forEach(n => {
  if (n.type === 'item') PAGE_LABEL[n.key] = n.label;
  else n.children.forEach(c => { PAGE_LABEL[c.key] = c.label; });
});
PAGE_LABEL.profile = '修改出生信息';

export default function App() {
  // 装在 DSH 里时，状态来自档案文件夹，不碰 localStorage
  const [state, setState] = useState(() => (DSH.hosted ? null : S.load()));
  const [hostedReady, setHostedReady] = useState(!DSH.hosted);
  const [bound, setBound] = useState(null);
  // 支持 #who、#ask 这类锚点直达某一页（截图、分享链接用）
  const [page, setPage] = useState(() => { const h = (window.location.hash || '').slice(1); return /^[a-z-]+$/.test(h) && h !== 'profile' ? h : 'home'; });
  const [hist, setHist] = useState([]);                 // 返回栈：从哪来的
  const [activeEventId, setActiveEventId] = useState(null);
  const [focus, setFocus] = useState(null);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [profileForm, setProfileForm] = useState(null); // null | 'new' | 'edit'

  const commit = useCallback(next => {
    if (DSH.hosted) { setState(next); const p = S.hostedFromState(next); if (p) DSH.save(p); }
    else setState(S.save(next));
  }, []);

  // 宿主模式：拉档案、监听 DSH 对文件的改动（解读写回就靠它）、向面板报到
  useEffect(() => {
    if (!DSH.hosted) return undefined;
    let stopWatch = () => {}, stopWho = () => {};
    const load = () => DSH.bootstrap().then(r => { setState(S.stateFromHosted(r.profile)); setHostedReady(true); })
      .catch(e => { console.error(e); setHostedReady(true); setState(S.stateFromHosted({ name: DSH.project })); });
    load().then(() => { if (!DSH.snapshotMode) stopWatch = DSH.watch(load); });
    if (!DSH.snapshotMode) stopWho = DSH.whoami(d => { if (d.askResult) setFocus(f => f); else setBound(d); });
    return () => { stopWatch(); stopWho(); };
  }, []);

  const theme = state?.settings?.theme || 'dark';
  useEffect(() => { applyTheme(theme); }, [theme]);

  const profile = S.activeProfile(state || S.EMPTY);
  const { bazi, ziwei, corr } = useMemo(() => S.deriveCharts(profile), [profile]);
  const events = profile?.events || [];
  const activeEvent = useMemo(() => events.find(e => e.event_id === activeEventId) || null, [events, activeEventId]);
  const interp = profile?.interpretations || {};

  useEffect(() => { setFocus(null); }, [page]);

  // 建档后第一次进来，直接到命盘开卷
  useEffect(() => { if (profile && profile.birth_date && !profile.revealSeen && page === 'home' && !window.location.hash) setPage('reveal'); }, [profile?.profile_id, profile?.birth_date]); // eslint-disable-line react-hooks/exhaustive-deps

  // 所有 hook 都在上面；宿主模式拉档案期间先渲染空白，避免 hook 数量在两次渲染间变化
  if (!state || !hostedReady) return <div className="h-screen w-screen bg-app" />;

  const navigate = key => {
    if (key === 'profile') { setProfileForm('edit'); return; }
    if (key !== page) setHist(h => [...h.slice(-19), page]);
    if (key !== 'ask') setActiveEventId(null);
    setPage(key);
  };
  const goBack = () => {
    if (activeEventId && page === 'ask') { setActiveEventId(null); return; }
    setHist(h => { const prev = h[h.length - 1]; if (prev) { setPage(prev); if (prev !== 'ask') setActiveEventId(null); } return h.slice(0, -1); });
  };
  const gender = profile?.gender || '男';

  // ---- 首次使用 / 新建档案 / 修改档案 ----
  if (!profile || profileForm || (DSH.hosted && !profile.birth_date)) {
    const isEdit = profileForm === 'edit' && profile;
    return (
      <div className="h-screen w-screen bg-app">
        <Onboarding
          isFirst={!profile}
          existing={isEdit ? profile : null}
          onCancel={profile ? () => setProfileForm(null) : null}
          onCreate={form => {
            if (isEdit || (DSH.hosted && profile)) { commit(S.updateProfile(state, profile.profile_id, form)); if (!isEdit) { setHist([]); setPage('reveal'); } }
            else { commit(S.createProfile(state, form).state); setHist([]); setPage('reveal'); }
            setProfileForm(null);
          }}
        />
      </div>
    );
  }

  const ctx = { profile, bazi, ziwei, corr, gender };

  // ---- 解读请求：记 pending → 交给 DSH → DSH 写回 profile.json → watch 刷新 ----
  const requestInterp = (req, force = false) => {
    const cur = profile.interpretations?.[req.key];
    if (!force && cur?.status === 'pending' && cur.request?.hash === req.hash) return;
    commit(S.requestInterpretation(state, profile.profile_id, req.key, req.hash, req.meta || {}));
    DSH.ask({ question: req.prompt, auto: true, key: req.key, context: { pageLabel: PAGE_LABEL[page] || page } });
  };

  const askQuestion = q => {
    const cast = castForQuestion(q);
    const { state: next, event } = S.createQuestion(state, { question: q, cast });
    commit(next);
    setActiveEventId(event.event_id);
  };

  // ---- 单机模式右侧面板的上下文 ----
  const context = {
    pageLabel: PAGE_LABEL[page] || page,
    profileLabel: `${profile.name} · ${profile.birth_date}${profile.time_unknown ? '（时辰不详）' : ' ' + profile.birth_time} · ${profile.gender}`,
    eventLabel: activeEvent ? (activeEvent.question || activeEvent.title) : null,
    optionLabel: null,
    systemLabel: page.startsWith('tool-') ? PAGE_LABEL[page] : null,
    chartLabel: bazi ? `八字 ${bazi.pillars.map(p => p.gan + p.zhi).join(' ')}${ziwei ? ` · 紫微 ${ziwei.fiveElementsClass}` : ''}` : null,
    focusLabel: focus,
    suggestions: ['这一条是根据什么说的？', '换一个体系看会不会不一样？'],
    raw: { profile_id: profile.profile_id, page, event_id: activeEvent?.event_id || null, focus }
  };

  const shared = { profile, bazi, ziwei, corr, gender, interp, hosted: DSH.hosted, onRequest: requestInterp };

  const renderPage = () => {
    switch (page) {
      case 'reveal':
        return <Reveal {...shared} onNavigate={navigate} onSeen={() => { if (!profile.revealSeen) commit(S.markRevealSeen(state, profile.profile_id)); }} />;
      case 'who':
        return <WhoAmI {...shared} />;
      case 'where-to':
        return <Timeline {...shared} onFocus={setFocus} />;
      case 'ask':
        return (
          <Ask {...shared} events={events} activeEvent={activeEvent}
            onAsk={askQuestion}
            onOpen={e => setActiveEventId(e ? e.event_id : null)}
            onRemove={id => { commit(S.removeEvent(state, id)); setActiveEventId(null); }}
            onOutcome={(id, text) => commit(S.setOutcome(state, id, { final_choice: '', actual_result: text, reflection: '' }))} />
        );
      case 'who-with':
        return (
          <WhoWithMe {...shared}
            persons={profile.persons} nickname={profile.name} onFocus={setFocus}
            onAdd={p2 => { const { state: next, person } = S.addPerson(state, p2); commit(next); return person.person_id; }}
            onRemove={id => commit(S.removePerson(state, id))}
          />
        );
      case 'alternate':
        return <Alternate {...shared} timelines={profile.timelines} onAdd={t => { const { state: next, timeline } = S.addTimeline(state, t); commit(next); return timeline; }} onRemove={id => commit(S.removeTimeline(state, id))} />;
      case 'tool-when': return <WhenToGo bazi={bazi} onFocus={setFocus} />;
      case 'tool-where': return <WhereToGo {...shared} />;
      case 'tool-naming': return <Naming {...shared} namings={profile.namings} onAdd={r => { const { state: next, run } = S.addNaming(state, r); commit(next); return run; }} onRemove={id => commit(S.removeNaming(state, id))} />;
      case 'tool-huangli': return <HuangliTool bazi={bazi} />;
      case 'tool-yijing': return <YijingTool />;
      case 'tool-bazi': return <BaziTool bazi={bazi} corr={corr} />;
      case 'tool-ziwei': return <ZiweiTool ziwei={ziwei} />;
      case 'tool-liuyao': return <LiuyaoTool />;
      case 'tool-meihua': return <MeihuaTool />;
      case 'home':
      default:
        return <Home onNavigate={navigate} bazi={bazi} ziwei={ziwei} gender={gender} events={events} onOpenEvent={e => { navigate('ask'); setActiveEventId(e.event_id); }} />;
    }
  };

  const canBack = hist.length > 0 || (page === 'ask' && activeEventId);
  const backLabel = page === 'ask' && activeEventId ? '所有问题' : (PAGE_LABEL[hist[hist.length - 1]] || '');

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        page={page}
        onNavigate={navigate}
        profiles={state.profiles}
        activeId={state.activeProfileId}
        theme={theme}
        onTheme={t => commit(S.setTheme(state, t))}
        onSwitchProfile={id => { commit(S.switchProfile(state, id)); setActiveEventId(null); setHist([]); }}
        onCreateProfile={DSH.hosted ? null : () => setProfileForm('new')}
        hosted={DSH.hosted}
        onEditProfile={() => setProfileForm('edit')}
        onRemoveProfile={id => commit(S.removeProfile(state, id))}
      />
      <main className="flex-1 min-w-0 h-full bg-app relative">
        {canBack && (
          <button onClick={goBack} className="absolute top-3 left-4 z-20 px-2.5 py-1 rounded-lg text-[11px] border border-b1 bg-card text-t3 hover:text-t1 hover:border-b2 shadow-card">
            ‹ 返回{backLabel ? ` ${backLabel}` : ''}
          </button>
        )}
        {DSH.hosted && !DSH.snapshotMode && (
          <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
            <span className="text-[10px] text-t4">{bound?.ok ? '● 已绑定对话' : '○ 未绑定'}</span>
            <button
              onClick={() => DSH.ask({ context: { pageLabel: PAGE_LABEL[page] || page, focusLabel: focus }, question: focus ? `「${focus}」这一条是根据什么说的？请引用盘面依据讲清楚推理链，语气留余地。` : '' })}
              className="px-2.5 py-1 rounded-lg text-[11px] border border-b1 bg-card text-t2 hover:text-t1 hover:border-b2 shadow-card"
              title="把当前看的内容和问题填进右侧对话框">
              问 DSH
            </button>
          </div>
        )}
        {renderPage()}
      </main>
      {!DSH.hosted && <ContextPanel context={context} collapsed={panelCollapsed} onToggle={() => setPanelCollapsed(c => !c)} />}
    </div>
  );
}
