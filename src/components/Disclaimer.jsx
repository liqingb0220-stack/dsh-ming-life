import React from 'react';

export const DISCLAIMER_TEXT = '所有命理与占卜内容仅作为传统文化与娱乐体验，不构成科学判断，也不构成医疗、法律、投资、教育或其他现实决策建议。';

export default function Disclaimer({ compact = false }) {
  if (compact) {
    return <p className="text-[10px] leading-relaxed text-t5 text-center px-4">{DISCLAIMER_TEXT}</p>;
  }
  return (
    <div className="rounded-xl border border-b1 bg-subtle px-4 py-3">
      <p className="text-[11px] leading-relaxed text-t4">{DISCLAIMER_TEXT}</p>
    </div>
  );
}

export function FictionBadge() {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-tint-violet text-violet border border-violet/25">
      娱乐模拟
    </span>
  );
}
