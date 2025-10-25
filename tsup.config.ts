import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    background: 'src/background/index.ts',
    'content-script': 'src/content-script/index.ts',
    options: 'src/pages/options/index.tsx',
    popup: 'src/pages/popup/index.tsx',
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
