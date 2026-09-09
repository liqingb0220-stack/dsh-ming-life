// 把 src/engines 打成 node 能直接 import 的单文件，给插件的 node 半侧写 CONTEXT.md 用。
// 源码里的 import 没带扩展名（Vite 风格），plain Node 跑不了，所以这里过一遍 esbuild。
import { build } from 'esbuild';
await build({
  entryPoints: ['src/dsh/context-entry.js'],
  bundle: true, platform: 'node', format: 'esm', target: 'node20',
  outfile: 'dsh/engines.mjs',
  external: ['lunar-javascript', 'iztro'],
  logLevel: 'warning'
});
console.log('dsh/engines.mjs built');
