import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Dark theme palette (matches original CSS)
        'dark-900': '#0f172a',
        'dark-800': '#1e293b',
        'dark-700': '#334155',
        'dark-600': '#475569',
        'dark-500': '#64748b',
        'dark-400': '#94a3b8',
        'dark-300': '#cbd5e1',
        'dark-200': '#e2e8f0',
        'dark-100': '#f1f5f9',
        'dark-50': '#f8fafc',
        // Accent colors
        'accent-blue': '#38bdf8',
        'primary': '#3b82f6',
        'primary-hover': '#2563eb',
        'success': '#22c55e',
        'danger': '#ef4444',
        'danger-hover': '#dc2626',
      },
    },
  },
  plugins: [],
}

export default config
