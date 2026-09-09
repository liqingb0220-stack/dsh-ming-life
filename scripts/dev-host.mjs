// 不进 DSH 也能试宿主模式：把 node 半侧挂在一个裸 http server 上。
//   DSH_MING_LIFE_ROOT=/tmp/x node scripts/dev-host.mjs 5199
import { createServer } from 'node:http'
const { handleApi } = await import('../dsh/index.js')
const port = Number(process.argv[2] || 5199)
createServer((req, res) => handleApi(req, res).catch(e => { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: e.message })) }))
  .listen(port, '127.0.0.1', () => console.log(`ming-life dev host on http://127.0.0.1:${port}/api/ming-life/app/?project=demo`))
