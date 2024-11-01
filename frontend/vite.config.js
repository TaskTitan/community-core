import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';
import fs from 'fs-extra';

// Custom plugin to copy directories
const copyDirectoryPlugin = (directories) => ({
  name: 'copy-directory',
  writeBundle: async () => {
    for (const [src, dest] of Object.entries(directories)) {
      await fs.copy(src, path.resolve(__dirname, 'dist', dest), { overwrite: true });
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        // Define a function to check if an element is considered a custom element.
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-'),
        },
      },
    }),
    vueJsx(),
    copyDirectoryPlugin({
      'src/assets/icons': 'assets/icons'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
