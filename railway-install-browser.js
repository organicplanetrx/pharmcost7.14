#!/usr/bin/env node

/**
 * Railway Browser Installation Script
 * Ensures Puppeteer browser is available for Railway deployments
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚂 Railway Browser Installation Starting...');

try {
  // Check if we're in Railway environment
  if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    console.log('🚂 Railway environment detected - installing Chrome browser...');
    
    // Install Chrome browser for Puppeteer
    console.log('📦 Installing Puppeteer Chrome browser...');
    execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
    
    console.log('✅ Railway browser installation completed');
  } else {
    console.log('💻 Development environment - skipping browser installation');
  }
} catch (error) {
  console.log('⚠️ Browser installation failed (may still work with system browser):', error.message);
  // Don't fail the build - browser might still work with system paths
}