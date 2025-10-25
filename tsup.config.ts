import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    background: 'src/background.ts',
    'content-script': 'src/content-script.ts',
    options: 'src/options.tsx',
    popup: 'src/popup.tsx',
  },
  format: ['esm'],
  target: 'es2021',
  splitting: false,
  sourcemap: false,
  minify: true,
  bundle: true,
  clean: false,
  skipNodeModulesBundle: false,
  noExternal: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
  platform: 'browser',
  outDir: 'dist',
});
