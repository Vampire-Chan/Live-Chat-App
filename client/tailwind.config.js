  /** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        border: '#334155',
        primary: '#3b82f6',
        text: '#f8fafc',
        muted: '#94a3b8',
        tag: {
          update: '#3b82f6',   // Blue
          question: '#eab308', // Yellow
          decision: '#22c55e', // Green
          idea: '#a855f7'      // Purple
        }
      }
    },
  },
  plugins: [],
}
