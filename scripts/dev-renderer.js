const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || '3005';
const viteBin = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const cmd = `"${viteBin}" --port ${port} --strictPort`;

const child = spawn(cmd, {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true
});

child.on('exit', (code) => {
  process.exit(code === undefined ? 1 : code);
});
