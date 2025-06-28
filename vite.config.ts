import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Ensure CSS is properly extracted and minified
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks: {
          vendor: ['react', 'react-dom', 'tailwind-merge', 'clsx'],
        },
      }
    }
  },
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
});
