import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('🚀 RazorAgent — Starting Backend and Frontend Services');
console.log('================================================================\n');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 1. Start Backend Server
const backend = spawn('node', ['--watch', 'src/server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[BACKEND]\x1b[0m ${data.toString()}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[BACKEND ERROR]\x1b[0m ${data.toString()}`);
});

// 2. Start Frontend Dev Server
const frontend = spawn(npmCmd, ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'pipe',
  shell: true
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[FRONTEND]\x1b[0m ${data.toString()}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[FRONTEND INFO]\x1b[0m ${data.toString()}`);
});

// Graceful cleanup on shutdown
function cleanup() {
  console.log('\n[RazorAgent] Shutting down services...');
  try {
    backend.kill();
    frontend.kill();
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
