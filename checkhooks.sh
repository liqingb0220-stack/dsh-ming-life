#!/bin/bash
# 静态检查：JSX 里用到但没导入的 React hook（esbuild 不会报这类错，只有运行时才炸）
python3 - <<'PY'
import re, glob, sys
hooks = ['useState','useMemo','useEffect','useCallback','useRef','useReducer','useLayoutEffect']
bad = []
for f in glob.glob('src/**/*.jsx', recursive=True):
    s = open(f).read()
    m = re.search(r"import React(?:,\s*\{([^}]*)\})?\s*from 'react';", s)
    imported = set(x.strip() for x in (m.group(1) or '').split(',') if x.strip()) if m else set()
    body = re.sub(r"^import .*$", "", s, flags=re.M)
    for h in hooks:
        if re.search(r'\b' + h + r'\s*\(', body) and h not in imported:
            bad.append(f'{f}: 用了 {h} 但没导入')
if bad:
    print('\n'.join(bad)); sys.exit(1)
print('hook 导入检查通过')
PY
