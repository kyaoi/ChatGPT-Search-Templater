import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

async function prepareDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const staticFiles = [
    'manifest.json',
    'popup.html',
    'options.html',
    'picker.html',
  ];
  await Promise.all(
    staticFiles.map((item) =>
      cp(path.join(projectRoot, item), path.join(distDir, item)),
    ),
  );

  const assetsSrc = path.join(projectRoot, 'assets');
  try {
    await cp(assetsSrc, path.join(distDir, 'assets'), { recursive: true });
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }
}

prepareDist().catch((error) => {
  console.error('[prebuild] 静的ファイル準備に失敗しました:', error);
  process.exitCode = 1;
});
