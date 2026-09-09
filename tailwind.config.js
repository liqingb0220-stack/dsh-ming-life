/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Noto Serif SC"', 'Songti SC', 'Georgia', 'serif'],
        body: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        // 语义色，值来自 index.css 的主题变量
        app: 'var(--bg-app)',
        panel: 'var(--bg-panel)',
        card: 'var(--bg-card)',
        subtle: 'var(--bg-subtle)',
        hover: 'var(--bg-hover)',
        inset: 'var(--bg-inset)',
        t1: 'var(--t1)',
        t2: 'var(--t2)',
        t3: 'var(--t3)',
        t4: 'var(--t4)',
        t5: 'var(--t5)',
        b1: 'var(--b1)',
        b2: 'var(--b2)',
        jade: 'var(--jade)',
        gold: 'var(--gold)',
        violet: 'var(--violet)',
        azure: 'var(--azure)',
        cinnabar: 'var(--cinnabar)'
      },
      backgroundColor: {
        'tint-jade': 'var(--tint-jade)',
        'tint-gold': 'var(--tint-gold)',
        'tint-violet': 'var(--tint-violet)',
        'tint-azure': 'var(--tint-azure)',
        'tint-cinnabar': 'var(--tint-cinnabar)'
      },
      boxShadow: { card: 'var(--shadow-card)' }
    }
  },
  plugins: []
};
