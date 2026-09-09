# 引擎测试

不依赖测试框架，用 esbuild 打包后由 node 直接跑（与 Vite 的模块解析规则一致）。

```bash
./runtest.sh tests/test-all.mjs      # MVP 主链回归，31 项断言
./runtest.sh tests/test-p1.mjs       # P1 回归，49 项断言
./runtest.sh tests/test-bazi.mjs     # 八字排盘
./runtest.sh tests/test-ziwei.mjs    # 紫微排盘
./runtest.sh tests/test-liuyao.mjs   # 六爻：八宫表 / 纳甲 / 世应 / 六亲
./runtest.sh tests/test-meihua.mjs   # 梅花：起卦公式 / 体用
./runtest.sh tests/test-timeline.mjs # 大运流年六维
./runtest.sh tests/test-decision.mjs # 多体系共识 / 分歧 / 变量
./runtest.sh tests/test-branches.mjs # 地支六合六冲三合相刑 / 十二长生 / 空亡
./runtest.sh tests/test-almanac.mjs  # 黄历条目与择日打分
./runtest.sh tests/test-location.mjs # 方位推算与地点比较
./runtest.sh tests/test-relation.mjs # 合盘互动结构
./runtest.sh tests/test-simulation.mjs # 平行时间线推演
./runtest.sh tests/test-naming.mjs   # 起名：音律 / 生成 / 锁字
./runtest.sh tests/test-pro.mjs      # 专业盘与人生地图
```
