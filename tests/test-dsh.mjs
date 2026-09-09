import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { Readable } from 'node:stream'

const root = await mkdtemp(join(tmpdir(), 'ming-life-'))
const dist = await mkdtemp(join(tmpdir(), 'ming-life-dist-'))
await mkdir(join(dist, 'assets'), { recursive: true })
await writeFile(join(dist, 'index.html'), '<!doctype html><title>ming</title>', 'utf8')
await writeFile(join(dist, 'assets', 'a.js'), 'console.log(1)', 'utf8')
process.env.DSH_MING_LIFE_ROOT = root
process.env.DSH_MING_LIFE_DIST = dist
const { ensureProject, saveProfile, slugify, handleApi, listProjects, migrate } = await import('../dsh/index.js')

function fakeRes() {
  const r = { status: 0, headers: {}, body: '', writableEnded: false }
  r.writeHead = (s, h) => { r.status = s; r.headers = h || {} }
  r.end = b => { r.body = b ? b.toString() : ''; r.writableEnded = true }
  return r
}
const call = async (method, url, body) => {
  const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : [])
  req.method = method; req.url = url
  const res = fakeRes(); await handleApi(req, res)
  return { status: res.status, headers: res.headers, json: (() => { try { return JSON.parse(res.body) } catch { return null } })(), body: res.body }
}

test('slugify keeps CJK readable and cannot escape the data root', () => {
  assert.equal(slugify('小满'), '小满')
  assert.equal(slugify('../../etc/passwd'), 'etc-passwd')
  assert.equal(slugify('...', 'fb'), 'fb')
})

test('a new profile creates its folder, profile.json and CONTEXT.md', async () => {
  const { folder, profile } = await ensureProject('小满', { name: '小满' })
  assert.equal(folder, join(root, '小满'))
  assert.equal(profile.name, '小满')
  assert.equal(profile.birth_date, null)
  const ctx = await readFile(join(folder, 'CONTEXT.md'), 'utf8')
  assert.match(ctx, /怎么说话/)
  assert.match(ctx, /不替用户做决定/)
  assert.match(ctx, /不制造焦虑/)
})

test('CONTEXT.md carries the chart once birth info exists, and never a doom word', async () => {
  const { profile } = await ensureProject('阿明', { name: '阿明' })
  const { folder } = await saveProfile('阿明', { ...profile, birth_date: '1990-05-20', birth_time: '14:30', gender: '男' })
  const ctx = await readFile(join(folder, 'CONTEXT.md'), 'utf8')
  assert.match(ctx, /庚午 辛巳 乙酉 癸未/)
  assert.match(ctx, /规则引擎/); assert.match(ctx, /十神｜/); assert.match(ctx, /工作台请求解读/)
  assert.match(ctx, /interpretations\["key"\]/)
  assert.match(ctx, /profile\.json/)
  assert.doesNotMatch(ctx.replace(/不说「[^」]*」/g, '').replace(/\| 不要说 \|[\s\S]*?\n\n/, ''), /必然|注定|克夫|克妻|大凶/)
  assert.doesNotMatch(ctx, /\[object Object\]|undefined/)
})

test('save keeps the session binding the UI cannot see', async () => {
  const { profile } = await ensureProject('绑定', { name: '绑定' })
  const bind = await call('POST', '/api/ming-life/action', { project: '绑定', type: 'bind-session', sessionId: 'sess-123' })
  assert.equal(bind.status, 200)
  const saved = await saveProfile('绑定', { ...profile, name: '绑定', sessionId: '' })
  assert.equal(saved.profile.sessionId, 'sess-123', 'UI 保存不能把绑定冲掉')
})

test('bootstrap / save round trip changes the revision', async () => {
  const b1 = await call('GET', '/api/ming-life/bootstrap?project=往返')
  assert.equal(b1.status, 200)
  await new Promise(r => setTimeout(r, 15))
  const s1 = await call('POST', '/api/ming-life/save', { project: '往返', profile: { ...b1.json.profile, name: '往返', birth_date: '2003-02-20', birth_time: '17:00', gender: '女' } })
  assert.equal(s1.status, 200)
  assert.notEqual(s1.json.revision, b1.json.revision)
  const w = await call('GET', `/api/ming-life/watch?project=往返&since=${encodeURIComponent(b1.json.revision)}`)
  assert.equal(w.json.changed, true)
})

test('the app prefix serves dist with immutable assets and rejects traversal', async () => {
  const idx = await call('GET', '/api/ming-life/app/?project=x')
  assert.equal(idx.status, 200); assert.match(idx.headers['Content-Type'], /text\/html/); assert.match(idx.body, /ming/)
  const asset = await call('GET', '/api/ming-life/app/assets/a.js')
  assert.equal(asset.status, 200); assert.match(asset.headers['Cache-Control'], /immutable/)
  const spa = await call('GET', '/api/ming-life/app/some/route')
  assert.equal(spa.status, 200, 'SPA 回退到 index')
  const bad = await call('GET', '/api/ming-life/app/../../etc/passwd')
  assert.ok([403, 404].includes(bad.status))
  const missing = await call('GET', '/api/ming-life/app/assets/nope.js')
  assert.equal(missing.status, 404)
})

test('projects list, create with dedup label, delete to .trash', async () => {
  const c1 = await call('POST', '/api/ming-life/projects', { name: '重名' })
  const c2 = await call('POST', '/api/ming-life/projects', { name: '重名' })
  assert.equal(c1.status, 201); assert.equal(c2.status, 201)
  assert.notEqual(c1.json.project.id, c2.json.project.id)
  assert.match(c2.json.project.name, /重名（2）/)
  const list = await listProjects()
  assert.ok(list.some(p => p.id === c1.json.project.id))
  const del = await call('POST', '/api/ming-life/projects/delete', { project: c2.json.project.id })
  assert.equal(del.status, 200)
  await stat(del.json.movedTo)
  assert.ok(!(await listProjects()).some(p => p.id === c2.json.project.id))
})

test('migrate drops malformed birth fields instead of crashing the chart', () => {
  const p = migrate({ name: 'x', birth_date: '20/05/1990', birth_time: '2pm', events: 'nope' }, 'x')
  assert.equal(p.birth_date, null); assert.equal(p.birth_time, null); assert.deepEqual(p.events, [])
})
