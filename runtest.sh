#!/bin/bash
# 用 esbuild 打包测试入口再跑，绕开 node ESM 的扩展名限制（与 Vite 的解析规则一致）
set -e
./node_modules/.bin/esbuild "$1" --bundle --platform=node --format=esm --outfile=/tmp/ml-test.mjs --log-level=error
node /tmp/ml-test.mjs
