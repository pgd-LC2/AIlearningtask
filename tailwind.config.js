/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          300: '#d4d4d4',
          600: '#525252',
          900: '#171717',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          light: '#dbeafe',
        },
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
      },
      spacing: {
        '1.5': '6px',
      },
      borderRadius: {
        'capsule': '999px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
