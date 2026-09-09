import React, { useState } from 'react';

/**
 * 右侧 DSH Conversation 绑定位（PRD §22）。
 * MVP 阶段不接会话服务，但完整维护「当前上下文」——
 * 用户说「这里」时，DSH 能准确知道指的是哪个页面 / 事件 / 选项 / 术法 / 盘面。
 */
export default function ContextPanel({ context, collapsed, onToggle }) {
  const [showRaw, setShowRaw] = useState(false);

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 h-full border-l border-b1 bg-app flex flex-col items-center py-4">
        <button onClick={onToggle} className="text-t4 hover:text-t2 text-lg" title="展开 DSH 对话">‹</button>
        <div className="mt-4 text-[10px] text-t4" style={{ writingMode: 'vertical-rl' }}>DSH 对话</div>
      </div>
    );
  }

  const rows = [
    ['页面', context.pageLabel],
    ['档案', context.profileLabel],
    ['事件', context.eventLabel],
    ['选项', context.optionLabel],
    ['术法', context.systemLabel],
    ['盘面', context.chartLabel],
    ['焦点', context.focusLabel]
  ].filter(r => r[1]);

  return (
    <aside className="w-[300px] shrink-0 h-full flex flex-col border-l border-b1 bg-app">
      <div className="px-4 py-3.5 border-b border-b1 flex items-center justify-between">
        <div>
          <div className="text-sm text-t1">DSH 对话</div>
          <div className="text-[10px] text-t4 mt-0.5">已绑定当前工作台上下文</div>
        </div>
        <button onClick={onToggle} className="text-t4 hover:text-t2">›</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-3">
        <div className="rounded-xl border border-b1 bg-subtle p-3.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-2.5">当前上下文</div>
          <div className="space-y-1.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex gap-2 text-[12px]">
                <span className="text-t4 w-8 shrink-0">{k}</span>
                <span className="text-t2 min-w-0 break-words">{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowRaw(s => !s)} className="mt-3 text-[11px] text-jade/70 hover:text-jade">
            {showRaw ? '收起' : '查看会将传给 DSH 的结构'}
          </button>
          {showRaw && (
            <pre className="mt-2 text-[10px] leading-relaxed text-t3 bg-inset rounded-lg p-2.5 overflow-x-auto scrollbar-thin font-mono">
{JSON.stringify(context.raw, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-xl border border-b1 bg-subtle p-3.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-t4 mb-2">可以这样问</div>
          <ul className="space-y-1.5">
            {(context.suggestions || []).map((s, i) => (
              <li key={i} className="text-[12px] text-t3 leading-relaxed">「{s}」</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-3 border-t border-b1">
        <div className="rounded-xl border border-b1 bg-subtle px-3 py-2.5 text-[12px] text-t4">
          会话服务未接入（MVP）
        </div>
        <p className="mt-2 text-[10px] text-t5 leading-relaxed">
          接入 DSH 后，此处即为绑定的 Conversation；上方上下文会随选中对象实时更新。
        </p>
      </div>
    </aside>
  );
}
