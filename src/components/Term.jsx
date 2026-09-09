import React, { useState } from 'react';
import { GLOSSARY, findTerms } from '../data/glossary';

/** 单个术语：点一下展开白话解释 */
export function Term({ children, k }) {
  const [open, setOpen] = useState(false);
  const key = k || (typeof children === 'string' ? children : null);
  const desc = key && GLOSSARY[key];
  if (!desc) return <>{children}</>;
  return (
    <span className="relative inline-block">
      <span className="term" onClick={() => setOpen(o => !o)} title="点开看这是什么意思">{children}</span>
      {open && (
        <span
          className="absolute left-0 top-full mt-1 z-30 block w-[248px] rounded-lg border border-b2 bg-card p-3 text-[12px] leading-relaxed text-t2 shadow-card"
          onClick={() => setOpen(false)}
        >
          <span className="block text-t1 mb-1">{key}</span>
          {desc}
        </span>
      )}
    </span>
  );
}

/**
 * 把一段文字里出现的术语自动变成可点开的注释。
 * 这样解释文案里可以放心使用专业词，读者不必先学一套词汇。
 */
export function Annotated({ text, className = '' }) {
  if (!text) return null;
  const terms = findTerms(text);
  if (!terms.length) return <span className={className}>{text}</span>;

  // 按出现位置切片
  const marks = [];
  terms.forEach(t => {
    let i = text.indexOf(t);
    while (i >= 0) { marks.push({ start: i, end: i + t.length, term: t }); i = text.indexOf(t, i + t.length); }
  });
  marks.sort((a, b) => a.start - b.start || b.end - a.end);

  const parts = [];
  let cursor = 0;
  marks.forEach(m => {
    if (m.start < cursor) return; // 重叠的跳过
    if (m.start > cursor) parts.push(text.slice(cursor, m.start));
    parts.push(<Term key={`${m.start}-${m.term}`} k={m.term}>{m.term}</Term>);
    cursor = m.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <span className={className}>{parts}</span>;
}

/** 术语表面板：把这一页用到的词一次列出来 */
export function TermList({ text }) {
  const terms = findTerms(text || '');
  if (!terms.length) return null;
  return (
    <div className="rounded-xl border border-b1 bg-subtle p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-2">这一页用到的词</div>
      <dl className="space-y-2">
        {terms.map(t => (
          <div key={t}>
            <dt className="text-[12px] text-t1">{t}</dt>
            <dd className="text-[12px] text-t3 leading-relaxed">{GLOSSARY[t]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
