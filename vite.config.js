import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',      // Tells Vite your source files are in 'src'
  base: './',       // Ensures paths works correctly on Vercel
  build: {
    outDir: '../dist', // Outputs the built site to a 'dist' folder in the root
    emptyOutDir: true
  }
});