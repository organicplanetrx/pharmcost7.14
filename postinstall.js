#!/usr/bin/env node

// Post-installation script that runs automatically during DigitalOcean deployment
// This ensures browser is installed during the build process

const { execSync } = require('child_process');

console.log('🔧 Running post-installation setup for PharmaCost Pro...');

// Only run browser installation in production environments
if (process.env.NODE_ENV === 'production' || process.env.DIGITAL_OCEAN) {
  console.log('🌐 Production environment detected - installing browser...');
  
  try {
    // Install browser during build process
    console.log('📥 Installing Puppeteer browser...');
    execSync('npx puppeteer browsers install chrome', { 
      stdio: 'inherit',
      timeout: 180000 // 3 minute timeout for deployment
    });
    console.log('✅ Browser installation completed successfully');
  } catch (error) {
    console.log('⚠️ Browser installation failed during build, will attempt runtime installation');
    console.log('Error:', error.message);
  }
} else {
  console.log('🔧 Development environment - skipping browser installation');
}

console.log('✅ Post-installation setup complete');