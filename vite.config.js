import { defineConfig } from 'vite';

// Relative asset paths so the build works when served from a subfolder
// (GitHub Pages serves this repo at /bathroom-remodel/).
export default defineConfig({
  base: './',
});
