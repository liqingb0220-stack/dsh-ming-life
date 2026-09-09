import React from 'react';

/** 够用的 Markdown：标题、列表、段落、粗体。DSH 写回的解读用它渲染。 */
function inline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i} className="text-t1 font-medium">{p.slice(2, -2)}</strong> : <React.Fragment key={i}>{p}</React.Fragment>));
}

export default function Md({ text, size = 'md' }) {
  if (!text) return null;
  const base = size === 'lg' ? 'text-[15px] leading-[1.9]' : 'text-[13.5px] leading-[1.85]';
  const blocks = String(text).replace(/\r/g, '').split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        const lines = b.split('\n').filter(l => l.trim() !== '');
        if (!lines.length) return null;
        const out = [];
        let list = null, listType = null;
        const flush = () => { if (list) { out.push(listType === 'ol' ? <ol key={out.length} className={`${base} text-t2 list-decimal pl-5 space-y-1`}>{list}</ol> : <ul key={out.length} className={`${base} text-t2 space-y-1`}>{list}</ul>); list = null; listType = null; } };
        lines.forEach((l, j) => {
          const h = l.match(/^(#{1,4})\s+(.*)/);
          if (h) { flush(); out.push(<h3 key={j} className={`font-display text-t1 ${h[1].length <= 2 ? 'text-[16px] mt-1' : 'text-[14px]'}`}>{inline(h[2])}</h3>); return; }
          const ul = l.match(/^\s*[-*•]\s+(.*)/);
          if (ul) { if (listType !== 'ul') { flush(); list = []; listType = 'ul'; } list.push(<li key={j} className="flex gap-2"><span className="text-t4 select-none">·</span><span>{inline(ul[1])}</span></li>); return; }
          const ol = l.match(/^\s*\d+[.、)]\s+(.*)/);
          if (ol) { if (listType !== 'ol') { flush(); list = []; listType = 'ol'; } list.push(<li key={j}>{inline(ol[1])}</li>); return; }
          flush();
          out.push(<p key={j} className={`${base} text-t2`}>{inline(l.replace(/^>\s?/, ''))}</p>);
        });
        flush();
        return <div key={i} className="space-y-1.5">{out}</div>;
      })}
    </div>
  );
}
