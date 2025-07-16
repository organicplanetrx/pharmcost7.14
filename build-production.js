#!/usr/bin/env node

// Production build script that works without Replit plugins
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Starting production build...');

try {
  // Build frontend with production config (no Replit plugins)
  console.log('📦 Building frontend...');
  execSync('vite build --config vite.config.production.ts', {
    cwd: __dirname,
    stdio: 'inherit'
  });

  // Build server
  console.log('⚙️ Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', {
    cwd: __dirname,
    stdio: 'inherit'
  });

  console.log('✅ Production build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}