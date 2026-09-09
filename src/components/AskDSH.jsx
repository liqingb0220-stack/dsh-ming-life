import React, { useState } from 'react';
import { Button, inputCls } from './ui';
import * as DSH from '../dsh/bridge';

/** 工具阁里的「请 DSH 解读」：直接发到右侧对话，答案在对话里。 */
export default function AskDSH({ prompt, label = '请 DSH 解读', size = 'sm', variant = 'primary', className = '' }) {
  const [sent, setSent] = useState(false);
  const [show, setShow] = useState(false);
  if (DSH.hosted) {
    return (
      <div className={`flex items-center gap-3 flex-wrap ${className}`}>
        <Button size={size} variant={variant} onClick={() => { DSH.ask({ question: prompt, auto: true }); setSent(true); setTimeout(() => setSent(false), 6000); }}>{label}</Button>
        {sent && <span className="text-[11px] text-jade">已发给 DSH，看右侧对话</span>}
      </div>
    );
  }
  return (
    <div className={className}>
      <Button size={size} variant="ghost" onClick={() => setShow(s => !s)}>{show ? '收起' : `${label}（复制）`}</Button>
      {show && <textarea readOnly value={prompt} rows={8} className={`${inputCls} mt-2 text-[12px] font-mono leading-relaxed resize-y`} onFocus={e => e.target.select()} />}
    </div>
  );
}
