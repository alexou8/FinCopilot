/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#E0E5EC',
        primary: '#006666',
        secondary: '#F0F2F5',
        success: '#00A63D',
        warning: '#FE9900',
        danger:  '#FF2157',
        ink:     '#2D3748',
      },
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        neu:    '16px',
        'neu-sm': '10px',
        'neu-lg': '24px',
      },
    },
  },
  plugins: [],
}
