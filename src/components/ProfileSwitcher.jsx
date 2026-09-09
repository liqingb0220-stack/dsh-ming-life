import React, { useState } from 'react';
import { RELATIONS } from '../store/store';

export default function ProfileSwitcher({ profiles, activeId, onSwitch, onCreate, onEdit, onRemove, hosted = false }) {
  const [open, setOpen] = useState(false);
  const active = profiles.find(p => p.profile_id === activeId) || profiles[0];
  if (!active) return null;

  const relLabel = k => RELATIONS.find(r => r.key === k)?.label || '';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left rounded-xl border border-b1 bg-subtle hover:bg-hover transition-colors px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-tint-gold text-gold flex items-center justify-center text-[13px] shrink-0">
            {active.name?.[0] || '我'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] text-t1 truncate">{active.name || '未命名'}</span>
            <span className="block text-[10px] text-t4 truncate">
              {relLabel(active.relation)} · {active.birth_date}
              {active.time_unknown ? ' 时辰不详' : active.birth_time ? ` ${active.birth_time}` : ''}
            </span>
          </span>
          <span className={`text-t4 text-[10px] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-b2 bg-card shadow-card overflow-hidden">
            <div className="max-h-60 overflow-y-auto scrollbar-thin">
              {profiles.map(p => (
                <div key={p.profile_id} className="flex items-center group">
                  <button
                    onClick={() => { onSwitch(p.profile_id); setOpen(false); }}
                    className={`flex-1 text-left px-3 py-2 hover:bg-hover transition-colors ${p.profile_id === activeId ? 'bg-tint-gold' : ''}`}
                  >
                    <div className="text-[13px] text-t1">{p.name || '未命名'}</div>
                    <div className="text-[10px] text-t4">{relLabel(p.relation)} · {p.birth_date}</div>
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => { if (confirm(`删除档案「${p.name}」及其全部记录？`)) onRemove(p.profile_id); }}
                      className="px-2 text-t5 hover:text-cinnabar opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除这个档案"
                    >×</button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-b1">
              {hosted ? (
                <div className="px-3 py-2 text-[11px] text-t4 leading-relaxed">切换或新建档案，请用 DSH 左上方面板里的档案下拉。</div>
              ) : (
                <button onClick={() => { onCreate(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-jade hover:bg-hover transition-colors">
                  ＋ 新建一个档案
                </button>
              )}
              <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-t3 hover:bg-hover transition-colors">
                修改「{active.name}」的信息
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
