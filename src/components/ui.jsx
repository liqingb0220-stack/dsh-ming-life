import React from 'react';

/** 把任意颜色（含 CSS 变量）按百分比调成淡底色，替代原来的 tint(hex, 11) 写法。 */
export const tint = (c, pct = 10) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="font-display text-[26px] text-t1 tracking-wide">{title}</h2>
        {subtitle && <p className="text-[13px] text-t4 mt-1.5 leading-relaxed max-w-2xl">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ title, children, className = '', right }) {
  return (
    <section className={`rounded-2xl border border-b1 bg-card p-5 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-[11px] uppercase tracking-[0.2em] text-t4">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '' }) {
  const base = 'rounded-lg font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-tint-jade text-jade border border-jade/30 hover:bg-jade/25',
    ghost: 'text-t3 border border-b1 hover:text-t1 hover:bg-hover',
    danger: 'text-cinnabar/80 border border-cinnabar/25 hover:bg-tint-cinnabar'
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, hint, children, required }) {
  return (
    <label className="block">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-[12px] text-t3">{label}</span>
        {required && <span className="text-cinnabar/60 text-[11px]">必填</span>}
        {hint && <span className="text-[11px] text-t4">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

/** 原生日期/时间框：点任何位置都弹选择器，不用去找右边的小图标 */
const openPicker = e => { try { e.currentTarget.showPicker?.(); } catch { /* 非用户手势时浏览器会拒绝，忽略 */ } };
export function DateInput({ className = '', ...props }) {
  return <input type="date" onClick={openPicker} onFocus={openPicker} className={`${inputCls} cursor-pointer ${className}`} {...props} />;
}
export function TimeInput({ className = '', ...props }) {
  return <input type="time" onClick={openPicker} onFocus={openPicker} className={`${inputCls} cursor-pointer ${className}`} {...props} />;
}

export const inputCls = 'w-full rounded-lg bg-subtle border border-b1 px-3 py-2 text-sm text-t1 outline-none focus:border-jade/40 focus:bg-hover transition-colors placeholder:text-t5';

export function Tabs({ tabs, value, onChange, size = 'md' }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => !t.disabled && onChange(t.key)}
          disabled={t.disabled}
          className={`rounded-lg transition-all duration-200 border
            ${size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]'}
            ${value === t.key
              ? 'bg-hover text-t1 border-b2'
              : t.disabled
                ? 'text-t5 border-transparent cursor-not-allowed'
                : 'text-t3 border-transparent hover:text-t1 hover:bg-subtle'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon = '◌', title, desc, action }) {
  return (
    <div className="h-full min-h-[320px] flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="text-4xl mb-4 text-t5">{icon}</div>
        <p className="text-t2 text-sm">{title}</p>
        {desc && <p className="text-t4 text-[13px] mt-2 leading-relaxed">{desc}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function ComingSoon({ title, desc, phase = 'P1' }) {
  return (
    <Empty
      icon="⧗"
      title={`${title} · ${phase}`}
      desc={desc}
    />
  );
}

/** 通用横向条 */
export function Bar({ value, color, height = 6 }) {
  return (
    <div className="w-full rounded-full bg-hover overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: `linear-gradient(90deg, ${color}55, ${color})` }} />
    </div>
  );
}
