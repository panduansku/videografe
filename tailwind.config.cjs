/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#15171b', // kanvas utama (charcoal, bukan hitam pekat)
        panel: '#1b1e23',
        panel2: '#22262c',
        line: '#2c3138',
        text: '#e7e9ec',
        mute: '#8a919c',
        accent: '#f2b04b', // amber lembut
        accent2: '#5fcfe0', // cyan lembut
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
