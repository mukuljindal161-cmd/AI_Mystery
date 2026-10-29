export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101512',
        panel: '#19201b',
        paper: '#ede9dd',
        muted: '#b0b5a9',
        gold: '#d9b773',
      },
      fontFamily: { display: ['Georgia', 'serif'], sans: ['Inter', 'Segoe UI', 'sans-serif'] },
    },
  },
  plugins: [],
};
