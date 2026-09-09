import React from 'react';
import ProfileSwitcher from './ProfileSwitcher';
import ThemeToggle from './ThemeToggle';

// 一级信息架构（PRD §3），与首页保持一致。
export const NAV = [
  { type: 'item', key: 'home', label: '首页', icon: '◈' },
  {
    type: 'group', key: 'know', label: '认识我', icon: '☯',
    children: [
      { key: 'reveal', label: '命盘开卷' },
      { key: 'who', label: '我是谁' },
      { key: 'where-to', label: '我将去向何方' }
    ]
  },
  {
    type: 'group', key: 'events', label: '我遇到的事', icon: '⌘',
    children: [
      { key: 'ask', label: '我有事想问' },
      { key: 'who-with', label: '谁与我同行' },
      { key: 'alternate', label: '我的另一条时间线' }
    ]
  },
  {
    type: 'group', key: 'tools', label: '工具阁', icon: '⚏',
    children: [
      { key: 'tool-bazi', label: '八字' },
      { key: 'tool-ziwei', label: '紫微斗数' },
      { key: 'tool-liuyao', label: '六爻' },
      { key: 'tool-meihua', label: '梅花易数' },
      { key: 'tool-yijing', label: '易经' },
      { key: 'tool-huangli', label: '黄历' },
      { key: 'tool-when', label: '择日' },
      { key: 'tool-where', label: '地点' },
      { key: 'tool-naming', label: '起名' }
    ]
  }
];

export default function Sidebar({ page, onNavigate, profiles, activeId, onSwitchProfile, onCreateProfile, onEditProfile, onRemoveProfile, theme, onTheme, hosted = false }) {
  const Item = ({ node, nested }) => {
    const active = page === node.key;
    return (
      <button
        onClick={() => onNavigate(node.key)}
        className={`w-full text-left rounded-lg transition-all duration-200 flex items-center gap-2
          ${nested ? 'px-3 py-1.5 text-[13px] ml-3' : 'px-3 py-2 text-sm'}
          ${active ? 'bg-hover text-t1' : 'text-t3 hover:text-t1 hover:bg-subtle'}`}
      >
        {node.icon && <span className="text-t4 w-4 shrink-0">{node.icon}</span>}
        <span className="truncate">{node.label}</span>
        {node.ready === false && <span className="ml-auto text-[9px] text-t5 border border-b1 rounded px-1 shrink-0">P1</span>}
      </button>
    );
  };

  return (
    <aside className="w-[240px] shrink-0 h-full flex flex-col bg-panel border-r border-b1">
      <div className="px-4 pt-4 pb-3 border-b border-b1 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[15px] tracking-wide">
            <span className="text-gold">玄</span>
            <span className="text-t1">学人生工作台</span>
          </h1>
          <ThemeToggle theme={theme} onChange={onTheme} />
        </div>
        <ProfileSwitcher
          profiles={profiles} activeId={activeId}
          onSwitch={onSwitchProfile} onCreate={onCreateProfile}
          onEdit={onEditProfile} onRemove={onRemoveProfile} hosted={hosted}
        />
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-2.5 py-3 space-y-0.5">
        {NAV.map(node =>
          node.type === 'item' ? (
            <Item key={node.key} node={node} />
          ) : (
            <div key={node.key} className="pt-2">
              <div className="px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-t4 flex items-center gap-2">
                <span>{node.icon}</span>{node.label}
              </div>
              {node.children.map(c => <Item key={c.key} node={c} nested />)}
            </div>
          )
        )}
      </nav>

      <div className="px-4 py-2.5 border-t border-b1">
        <p className="text-[10px] text-t5 leading-relaxed">
          {hosted ? '数据存在这个档案的文件夹里，DSH 也读得到' : '全部数据只存在这台设备的浏览器里'}
        </p>
      </div>
    </aside>
  );
}
