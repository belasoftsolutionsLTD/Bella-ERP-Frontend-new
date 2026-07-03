import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Bela ERP Dark Theme ────────────────────────────────────────────
        'bg-base':     '#0f172a',
        'bg-surface':  '#1e293b',
        'bg-elevated': '#263344',
        'bg-sunken':   '#0a1120',

        'border-default': '#334155',
        'border-subtle':  '#1e293b',
        'border-strong':  '#475569',

        'text-primary':   '#f1f5f9',
        'text-secondary': '#cbd5e1',
        'text-muted':     '#94a3b8',
        'text-disabled':  '#475569',

        brand: {
          DEFAULT: '#6366f1',
          hover:   '#5558e8',
          light:   '#818cf8',
          subtle:  '#1e1b4b',
        },

        module: {
          hr:      '#6366f1',
          recruit: '#f97316',
          leave:   '#22c55e',
          time:    '#06b6d4',
          perf:    '#8b5cf6',
          payroll: '#10b981',
          expense: '#f59e0b',
          tasks:   '#6366f1',
          comm:    '#ec4899',
          awards:  '#f59e0b',
          reports: '#3b82f6',
          it:      '#64748b',
          finance: '#10b981',
        },

        // ── Shadcn/Radix variables (kept for compatibility) ─────────────────
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: '#ffffff',
        },
        background: 'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
      },

      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      borderRadius: {
        card:   '12px',
        input:  '8px',
        button: '8px',
        badge:  '9999px',
        lg:     'var(--radius)',
        md:     'calc(var(--radius) - 2px)',
        sm:     'calc(var(--radius) - 4px)',
      },

      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
        'card-hover':'0 4px 16px rgba(0,0,0,0.4)',
        brand:      '0 4px 16px rgba(99,102,241,0.3)',
        dropdown:   '0 8px 32px rgba(0,0,0,0.5)',
        drawer:     '-4px 0 32px rgba(0,0,0,0.5)',
      },

      animation: {
        'fade-in':    'fadeIn 150ms ease-out',
        'slide-up':   'slideUp 200ms ease-out',
        'slide-right':'slideRight 250ms ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },

      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:    { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideRight: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        pulseSoft:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
