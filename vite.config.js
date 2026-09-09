import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 独立运行时 base 为 /；作为 DSH 插件构建时，静态资源挂在插件的 HTTP 路由前缀下。
const base = process.env.DSH_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5174 },
  build: { outDir: 'dist', emptyOutDir: true }
});
