/**
 * 宿主适配：同一份界面既能独立跑（localStorage），也能装在 DSH 里跑。
 * 装在 DSH 里时，URL 带 ?project=<档案>，状态从 /api/ming-life/bootstrap 来、往 /save 去，
 * 并通过 postMessage 与外层面板对话（绑定状态、把问题填进右侧输入框）。
 */
const API = '/api/ming-life';
const params = new URLSearchParams(window.location.search);

export const project = params.get('project') || '';
export const hosted = !!project;
/** ?shot=1：截图模式，不开长轮询（否则无头浏览器等不到网络空闲） */
export const snapshotMode = params.get('shot') === '1';

let revision = '';
export const currentRevision = () => revision;

async function req(path, options) {
  const r = await fetch(path, options);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
  return body;
}
const q = (path, extra = {}) => `${path}?${new URLSearchParams({ project, ...extra })}`;

export async function bootstrap() {
  const r = await req(q(`${API}/bootstrap`), { cache: 'no-store' });
  revision = r.revision || '';
  return r; // { folder, profile, revision }
}

let saveTimer = null, pending = null, lastSaveAt = 0;
export function save(profile) {
  pending = profile;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 350);
}
export async function flush() {
  if (!pending) return;
  const body = pending; pending = null;
  try {
    const r = await req(`${API}/save`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ project, profile: body }) });
    revision = r.revision || revision;
    lastSaveAt = Date.now();
  } catch (e) { console.warn('[ming-life] save failed', e); }
}
export const recentlySaved = () => Date.now() - lastSaveAt < 1500;

/** 长轮询等 profile.json 变化（DSH 改了文件就会触发）。 */
export function watch(onChange) {
  let stopped = false;
  (async () => {
    while (!stopped) {
      try {
        const r = await req(q(`${API}/watch`, { since: revision || '' }), { cache: 'no-store' });
        if (stopped) return;
        if (r.changed && r.revision !== revision && !recentlySaved() && !pending) {
          revision = r.revision;
          onChange();
        } else if (r.revision) revision = r.revision;
      } catch { await new Promise(d => setTimeout(d, 2000)); }
    }
  })();
  return () => { stopped = true; };
}

const origin = window.location.origin;
export function whoami(onBound) {
  const handler = e => {
    if (e.origin !== origin) return;
    if (e.data?.type === 'dsh-ming-life:bound') onBound(e.data);
    if (e.data?.type === 'dsh-ming-life:ask-result') onBound({ askResult: e.data });
  };
  window.addEventListener('message', handler);
  let asked = 0;
  const timer = setInterval(() => {
    if (asked++ > 8) return clearInterval(timer);
    window.parent.postMessage({ type: 'dsh-ming-life:whoami', project }, origin);
  }, 700);
  return () => { clearInterval(timer); window.removeEventListener('message', handler); };
}

/**
 * 把一段话交给右侧 DSH 对话。
 * auto=true：直接发出去（解读请求走这条）；auto=false：只填进输入框，用户自己按回车。
 */
export function ask({ question = '', excerpt = '', context = {}, auto = false, key = '' } = {}) {
  window.parent.postMessage({ type: 'dsh-ming-life:ask', project, question, excerpt, context, auto, key }, origin);
}
export function notifyProjectsChanged() {
  window.parent.postMessage({ type: 'dsh-ming-life:projects-changed', project }, origin);
}
