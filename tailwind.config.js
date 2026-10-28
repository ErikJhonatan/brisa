import { heroui } from '@heroui/react';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './node_modules/@heroui/**/theme/dist/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [heroui({ themes: { dark: { colors: { background: '#1b1f1b', foreground: '#e4e6df', primary: { DEFAULT: '#a9c8b4', foreground: '#19251e' }, secondary: { DEFAULT: '#303b32', foreground: '#d5dfd2' }, focus: '#a9c8b4' } }, light: { colors: { background: '#FAF7F2', foreground: '#292F2B', primary: { DEFAULT: '#355848', foreground: '#FFFFFF' }, secondary: { DEFAULT: '#E4EBE3', foreground: '#355848' }, focus: '#355848' } } } })],
};
