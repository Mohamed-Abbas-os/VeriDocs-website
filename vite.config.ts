import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages base path.
 *
 * - Production builds default to "/veridocs/" (https://USERNAME.github.io/veridocs/).
 * - Change the repository name by setting VITE_BASE_PATH, e.g.
 *     VITE_BASE_PATH=/my-repo/ npm run build
 *   or use "./" for fully relative asset paths that work under any sub-path.
 * - The GitHub Actions workflow sets it automatically from the repository name.
 * - The dev server always runs at "/" so `npm run dev` just works.
 */
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const base = command === 'build' ? env.VITE_BASE_PATH || '/veridocs/' : '/';

  return {
    base,
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
    },
  };
});
