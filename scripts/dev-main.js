const { spawn } = require('child_process');
const path = require('path');

const electronBinary = require('electron');
const entry = path.join(__dirname, '..', 'dist', 'main', 'main', 'main.js');

const port = process.env.PORT || '3005';
const env = { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: `http://localhost:${port}` };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, [entry], {
  stdio: 'inherit',
  env
});

child.on('exit', (code) => {
  process.exit(code === undefined ? 1 : code);
});
