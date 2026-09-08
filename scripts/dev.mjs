import { spawn, spawnSync } from 'node:child_process';
const prepared = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/prepare-static.mjs'], { stdio: 'inherit' });
if (prepared.status !== 0) process.exit(prepared.status || 1);
// Vite serves the interface; a small local Worker supplies the same API as production.
const children = [
  spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--config', 'wrangler.jsonc', '--port', '8787', '--assets', 'public'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js'], { stdio: 'inherit' }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach(child => child.kill('SIGTERM'));
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
children.forEach(child => { child.on('error', error => { console.error(error); stop(1); }); child.on('exit', code => stop(code || 0)); });
