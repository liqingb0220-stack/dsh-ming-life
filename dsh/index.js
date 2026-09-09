/**
 * 玄学人生工作台 —— DSH 插件的 node 半侧。
 *
 * 一个档案 = 一个项目文件夹 = 一个绑定的 DSH 会话：
 *   ~/Documents/DSH 玄学项目/<档案名>/profile.json   工作台与 DSH 共用的唯一事实源
 *   ~/Documents/DSH 玄学项目/<档案名>/CONTEXT.md     写给 DSH 看的：这个人是谁、怎么说话、能改什么
 *
 * 界面（Vite 构建出的 dist/）由本模块在 /api/ming-life/app/ 前缀下提供，
 * 客户端半侧（lib/client.js）把它装进 iframe。
 */
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, extname, join, resolve, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { contextDocument } from './engines.mjs'

export const name = 'ming-life'
export const inject = ['webServer']

const ROOT = dirname(fileURLToPath(import.meta.url))
const DIST = process.env.DSH_MING_LIFE_DIST ? resolve(process.env.DSH_MING_LIFE_DIST) : join(ROOT, '..', 'dist')
export const DATA_ROOT = process.env.DSH_MING_LIFE_ROOT
  ? resolve(process.env.DSH_MING_LIFE_ROOT)
  : join(homedir(), 'Documents', 'DSH 玄学项目')
const APP_PREFIX = '/api/ming-life/app'
const MAX_BODY = 8 * 1024 * 1024
const SCHEMA_VERSION = 1

const now = () => new Date().toISOString()
const text = (v, max = 200) => String(v ?? '').trim().slice(0, max)

export function slugify(value, fallback = '') {
  const cleaned = Array.from(String(value ?? '').normalize('NFC').toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, ''))
    .slice(0, 64).join('').replace(/-+$/g, '')
  return cleaned || fallback
}
const folderFor = slug => {
  const safe = slugify(slug)
  if (!safe) throw new Error('档案标识不合法')
  return join(DATA_ROOT, safe)
}

// ── shape ────────────────────────────────────────────────
/** 一份档案。与 SPA 的 blankProfile 同形，多一层 schemaVersion / sessionId。 */
export function emptyProfile(id, name) {
  const t = now()
  return {
    schemaVersion: SCHEMA_VERSION,
    profile_id: id, name: text(name, 40) || id,
    relation: 'self', source: 'birth',
    birth_date: null, birth_time: null, time_unknown: false, birth_place: '',
    timezone: 'Asia/Shanghai', gender: '男', manual_pillars: null,
    birth_lng: null, revealSeen: false, calibration: {}, interpretations: {},
    events: [], persons: [], timelines: [], namings: [], timings: [],
    settings: { theme: 'light' },
    sessionId: '',
    created_at: t, updated_at: t
  }
}

/** 读取时规范化：字段缺了补上，类型不对的丢掉，绝不信任文件里的派生内容。 */
export function migrate(raw, id) {
  const p = raw && typeof raw === 'object' ? raw : {}
  const base = emptyProfile(id, p.name)
  const out = { ...base, ...p, profile_id: id, schemaVersion: SCHEMA_VERSION }
  out.name = text(p.name, 40) || id
  out.gender = p.gender === '女' ? '女' : '男'
  out.birth_date = typeof p.birth_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.birth_date) ? p.birth_date : null
  out.birth_time = typeof p.birth_time === 'string' && /^\d{2}:\d{2}$/.test(p.birth_time) ? p.birth_time : null
  out.time_unknown = !!p.time_unknown
  out.calibration = p.calibration && typeof p.calibration === 'object' ? p.calibration : {}
  out.interpretations = p.interpretations && typeof p.interpretations === 'object' && !Array.isArray(p.interpretations) ? p.interpretations : {}
  out.birth_lng = Number.isFinite(Number(p.birth_lng)) && Number(p.birth_lng) !== 0 ? Number(p.birth_lng) : null
  for (const k of ['events', 'persons', 'timelines', 'namings', 'timings']) out[k] = Array.isArray(p[k]) ? p[k] : []
  out.settings = { theme: p.settings?.theme === 'dark' ? 'dark' : 'light' }
  out.sessionId = text(p.sessionId, 120)
  return out
}

// ── persistence ──────────────────────────────────────────
async function writeContext(folder, profile) {
  const target = join(folder, 'CONTEXT.md')
  let content
  try { content = contextDocument(profile, { folder }) }
  catch (e) { content = `# 玄学人生工作台 · 上下文\n\n（生成上下文时出错：${e.message}）\n` }
  try { if (await readFile(target, 'utf8') === content) return } catch {}
  await writeFile(target, content, 'utf8')
}

export async function ensureProject(slug, seed = {}) {
  const folder = folderFor(slug)
  const id = slugify(slug)
  await mkdir(join(folder, 'exports'), { recursive: true })
  const path = join(folder, 'profile.json')
  let profile
  try { profile = migrate(JSON.parse(await readFile(path, 'utf8')), id) }
  catch {
    profile = { ...emptyProfile(id, seed.name), ...(seed.profile || {}), profile_id: id }
    profile = migrate(profile, id)
    await writeFile(path, `${JSON.stringify(profile, null, 2)}\n`, 'utf8')
  }
  await writeContext(folder, profile)
  return { folder, path, profile }
}

export async function saveProfile(slug, incoming) {
  const folder = folderFor(slug)
  const id = slugify(slug)
  const path = join(folder, 'profile.json')
  let current = null
  try { current = migrate(JSON.parse(await readFile(path, 'utf8')), id) } catch {}
  // 会话绑定由 action 维护，界面保存时不允许把它冲掉
  const profile = migrate({ ...(incoming || {}), sessionId: current?.sessionId || incoming?.sessionId || '' }, id)
  profile.updated_at = now()
  const temp = `${path}.${process.pid}.tmp`
  await writeFile(temp, `${JSON.stringify(profile, null, 2)}\n`, 'utf8')
  await rename(temp, path)
  await writeContext(folder, profile)
  return { folder, path, profile }
}

function summary(profile) {
  return {
    id: profile.profile_id, name: profile.name, relation: profile.relation,
    birth: profile.birth_date ? `${profile.birth_date}${profile.time_unknown ? ' 时辰不详' : ' ' + (profile.birth_time || '')}` : '未填出生信息',
    sessionId: profile.sessionId || '',
    events: (profile.events || []).length,
    updatedAt: profile.updated_at
  }
}

export async function listProjects() {
  await mkdir(DATA_ROOT, { recursive: true })
  const rows = []
  for (const entry of await readdir(DATA_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const id = slugify(entry.name)
    if (!id) continue
    try {
      const raw = JSON.parse(await readFile(join(DATA_ROOT, entry.name, 'profile.json'), 'utf8'))
      rows.push(summary(migrate(raw, id)))
    } catch {}
  }
  return rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
}

// ── http ─────────────────────────────────────────────────
async function readBody(req) {
  const chunks = []; let size = 0
  for await (const chunk of req) { size += chunk.length; if (size > MAX_BODY) throw new Error('请求内容过大'); chunks.push(chunk) }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}
}
function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(JSON.stringify(body))
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.map': 'application/json' }

/** dist/ 下的静态资源。hash 文件名长缓存，index 不缓存；越界路径一律 403。 */
async function serveApp(pathname, res) {
  let rel = pathname.slice(APP_PREFIX.length).replace(/^\/+/, '')
  if (!rel) rel = 'index.html'
  const target = resolve(DIST, normalize(rel))
  if (target !== DIST && !target.startsWith(`${DIST}/`)) return json(res, 403, { error: 'invalid path' })
  let bytes
  try { bytes = await readFile(target) } catch {
    // SPA 回退：非资源路径都给 index
    if (extname(target)) return json(res, 404, { error: 'not found' })
    bytes = await readFile(join(DIST, 'index.html'))
    rel = 'index.html'
  }
  const ext = extname(rel).toLowerCase()
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  })
  res.end(bytes)
}

const projectParam = url => { const s = slugify(url.searchParams.get('project') || ''); if (!s) throw new Error('缺少 project 参数'); return s }
const revOf = async path => { try { const i = await stat(path); return `${i.mtimeMs}:${i.size}` } catch { return '' } }

export async function handleApi(req, res) {
  const url = new URL(req.url || '/', 'http://127.0.0.1')

  if (url.pathname === APP_PREFIX || url.pathname.startsWith(`${APP_PREFIX}/`)) {
    if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
    return serveApp(url.pathname, res)
  }

  if (url.pathname === '/api/ming-life/projects') {
    if (req.method === 'GET') return json(res, 200, { projects: await listProjects(), root: DATA_ROOT })
    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
    const body = await readBody(req)
    const nm = text(body.name, 40)
    if (!nm) return json(res, 400, { error: '请给档案起个名字' })
    const base = slugify(nm, `profile-${Date.now()}`)
    const existing = await listProjects()
    let slug = base, n = 2
    while (existing.some(r => r.id === slug)) slug = `${base}-${n++}`
    const label = slug === base ? nm : `${nm}（${n - 1}）`
    const { profile } = await ensureProject(slug, { name: label, profile: body.profile || {} })
    return json(res, 201, { project: summary(profile) })
  }

  if (url.pathname === '/api/ming-life/projects/delete') {
    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
    const body = await readBody(req)
    const slug = slugify(body.project || '')
    if (!slug) return json(res, 400, { error: '缺少 project 参数' })
    const folder = folderFor(slug)
    try { await stat(folder) } catch { return json(res, 404, { error: '档案不存在' }) }
    const trash = join(DATA_ROOT, '.trash')
    await mkdir(trash, { recursive: true })
    const target = join(trash, `${slug}-${Date.now()}`)
    await rename(folder, target)
    return json(res, 200, { ok: true, movedTo: target })
  }

  if (url.pathname === '/api/ming-life/bootstrap') {
    if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
    const { folder, path, profile } = await ensureProject(projectParam(url))
    return json(res, 200, { folder, profile, revision: await revOf(path) })
  }

  if (url.pathname === '/api/ming-life/save') {
    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
    const body = await readBody(req)
    const slug = slugify(body.project || '')
    if (!slug) return json(res, 400, { error: '缺少 project 参数' })
    const { path, profile } = await saveProfile(slug, body.profile)
    return json(res, 200, { ok: true, profile, revision: await revOf(path) })
  }

  if (url.pathname === '/api/ming-life/action') {
    if (req.method !== 'POST') return json(res, 405, { error: 'method not allowed' })
    const body = await readBody(req)
    const slug = slugify(body.project || '')
    if (!slug) return json(res, 400, { error: '缺少 project 参数' })
    const { profile } = await ensureProject(slug)
    if (body.type === 'bind-session') {
      const id = text(body.sessionId, 120)
      if (!id) return json(res, 400, { error: '会话 id 不能为空' })
      profile.sessionId = id
    } else if (body.type === 'rename') {
      const nm = text(body.name, 40)
      if (!nm) return json(res, 400, { error: '名字不能为空' })
      profile.name = nm
    } else return json(res, 400, { error: '不支持的操作' })
    // 直接落盘，绕过 saveProfile 对 sessionId 的保护
    const folder = folderFor(slug), path = join(folder, 'profile.json')
    profile.updated_at = now()
    const temp = `${path}.${process.pid}.tmp`
    await writeFile(temp, `${JSON.stringify(profile, null, 2)}\n`, 'utf8')
    await rename(temp, path)
    await writeContext(folder, profile)
    return json(res, 200, { ok: true, profile: summary(profile) })
  }

  /** 长轮询：等 profile.json 变化再返回。iframe 里的定时器会被节流，等文件事件不会。 */
  if (url.pathname === '/api/ming-life/watch') {
    if (req.method !== 'GET') return json(res, 405, { error: 'method not allowed' })
    const slug = slugify(url.searchParams.get('project') || '')
    if (!slug) return json(res, 400, { error: '缺少 project 参数' })
    const folder = folderFor(slug), path = join(folder, 'profile.json')
    const since = String(url.searchParams.get('since') || '')
    const current = await revOf(path)
    if (current !== since) return json(res, 200, { revision: current, changed: true })
    await new Promise(resolveWait => {
      let settled = false, watcher = null
      const finish = () => { if (settled) return; settled = true; clearTimeout(timer); try { watcher?.close() } catch {}; resolveWait() }
      try { watcher = watch(folder, (_e, f) => { if (!f || f === 'profile.json') finish() }) } catch {}
      const timer = setTimeout(finish, 25000)
      req.on('close', finish)
    })
    if (res.writableEnded) return undefined
    const after = await revOf(path)
    return json(res, 200, { revision: after, changed: after !== since })
  }

  return json(res, 404, { error: 'not found' })
}

export function apply(ctx) {
  const wrap = (req, res) => handleApi(req, res).catch(e => json(res, 500, { error: e instanceof Error ? e.message : String(e) }))
  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: APP_PREFIX, handler: wrap }), 'ming-life: app')
  for (const path of ['/api/ming-life/projects', '/api/ming-life/projects/delete', '/api/ming-life/bootstrap',
    '/api/ming-life/save', '/api/ming-life/action', '/api/ming-life/watch']) {
    ctx.effect(() => ctx.webServer.register({ kind: 'exact', path, handler: wrap }), `ming-life: ${path}`)
  }
}
