import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Control-room surfaces
        control: {
          DEFAULT: '#0F172A',
          raised: '#1E293B',
          overlay: '#24334B',
          inset: '#0B1120',
        },
        panel: '#1E293B',
        signal: {
          green: '#22C55E',
        },
        // Operational status palette
        status: {
          available: '#22C55E',
          occupied: '#EF4444',
          reserved: '#F59E0B',
          charging: '#3B82F6',
          offline: '#64748B',
        },
      },
      fontFamily: {
        display: ['var(--font-chakra-petch)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgb(148 163 184 / 0.08), 0 8px 24px -12px rgb(2 6 23 / 0.8)',
        'glow-green': '0 0 12px rgb(34 197 94 / 0.35)',
        'glow-blue': '0 0 12px rgb(59 130 246 / 0.40)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        flash: {
          '0%': { backgroundColor: 'rgb(148 163 184 / 0.35)' },
          '100%': { backgroundColor: 'transparent' },
        },
        sweep: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'pulse-dot-fast': 'pulse-dot 0.9s ease-in-out infinite',
        flash: 'flash 1.2s ease-out',
        sweep: 'sweep 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
