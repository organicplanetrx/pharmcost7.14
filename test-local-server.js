// Test the server locally to identify the crash cause
import { spawn } from 'child_process';

console.log('🔍 Testing local server startup to identify Railway crash...');

const server = spawn('node', ['dist/index.js'], {
  env: { ...process.env, NODE_ENV: 'production', PORT: '3001' }
});

server.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Stop after 10 seconds
setTimeout(() => {
  server.kill();
  console.log('Test completed');
}, 10000);