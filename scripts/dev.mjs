import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDir = path.join(rootDir, 'web');
const serverEntry = path.join(rootDir, 'server', 'src', 'index.ts');
const nextBin = path.join(rootDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const tsxBin = path.join(rootDir, 'node_modules', 'tsx', 'dist', 'cli.mjs');

if (!existsSync(nextBin) || !existsSync(tsxBin)) {
  console.error('Missing dependencies. Run `npm install` first.');
  process.exit(1);
}

const children = [];

function start(command, args, label, cwd) {
  const child = spawn(process.execPath, [command, ...args], {
    cwd,
    env: { ...process.env },
    stdio: 'inherit'
  });
  child.on('exit', (code, signal) => {
    if (signal || (code && code !== 0)) {
      for (const other of children) {
        if (other.pid && other.pid !== child.pid) {
          other.kill('SIGTERM');
        }
      }
      if (signal) {
        console.log(`${label} exited with signal ${signal}`);
      } else {
        console.log(`${label} exited with code ${code}`);
      }
      process.exit(code ?? 0);
    }
  });
  children.push(child);
  return child;
}

start(nextBin, ['dev', webDir, '-p', '3000'], 'web', webDir);
start(tsxBin, ['watch', serverEntry], 'api', rootDir);

process.on('SIGINT', () => {
  for (const child of children) {
    child.kill('SIGINT');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  for (const child of children) {
    child.kill('SIGTERM');
  }
  process.exit(0);
});
