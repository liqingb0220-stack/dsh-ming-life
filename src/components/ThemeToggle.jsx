import React from 'react';

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export default function ThemeToggle({ theme, onChange }) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-b1 p-0.5">
      {[
        { key: 'light', label: '☀', title: '白天模式' },
        { key: 'dark', label: '☾', title: '夜间模式' }
      ].map(t => (
        <button
          key={t.key}
          title={t.title}
          onClick={() => onChange(t.key)}
          className={`w-7 h-6 rounded text-[13px] transition-colors ${
            theme === t.key ? 'bg-hover text-t1' : 'text-t4 hover:text-t2'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
