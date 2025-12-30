#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const toolboxRootPath = path.resolve(repoRoot, '../wallet-toolbox');
const toolboxClientPath = path.resolve(repoRoot, '../wallet-toolbox/client');
const nodeModulesPath = path.resolve(repoRoot, 'node_modules');
const linkParentDir = path.resolve(nodeModulesPath, '@bsv');
const moduleCacheDir = path.resolve(nodeModulesPath, '.vite');
const linkPath = path.resolve(linkParentDir, 'wallet-toolbox-client');
const toolboxClientOutPath = path.resolve(toolboxClientPath, 'out');

const log = (msg) => console.log(`[toolbox-dev] ${msg}`);
const fail = (msg) => {
  console.error(`[toolbox-dev] ${msg}`);
  process.exit(1);
};

if (!fs.existsSync(toolboxClientPath)) {
  fail(
    `Expected wallet-toolbox client at ${toolboxClientPath}. ` +
    'Make sure the wallet-toolbox repo is checked out next to user-wallet-desktop.'
  );
}

if (!fs.existsSync(nodeModulesPath)) {
  fail('node_modules not found. Run `npm install` before starting toolbox-dev.');
}

fs.mkdirSync(linkParentDir, { recursive: true });

if (fs.existsSync(linkPath)) {
  const stats = fs.lstatSync(linkPath);
  if (stats.isSymbolicLink()) {
    fs.unlinkSync(linkPath);
  } else {
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  log(`Removed existing ${linkPath}`);
}

fs.symlinkSync(toolboxClientPath, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
log(`Linked ${linkPath} -> ${toolboxClientPath}`);

try {
  fs.rmdirSync(moduleCacheDir, { recursive: true });
  log(`Removed module cache ${moduleCacheDir}`);
} catch (_) { }

try {
  fs.rmdirSync(toolboxClientOutPath, { recursive: true });
  log(`Removed old build ${toolboxClientOutPath}`);
} catch (_) { }

try {
  execSync('npm run build', { cwd: toolboxRootPath });
  log(`New Toolbox build prepared and ready.`);
} catch (_) { }
