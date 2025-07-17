#!/usr/bin/env node

// Browser installation script for DigitalOcean deployment
// This ensures Puppeteer browser is available in production environment

const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

async function installBrowser() {
  console.log('🚀 Starting browser installation for PharmaCost Pro...');
  
  try {
    // Method 1: Try using Puppeteer CLI browser installer
    console.log('📥 Attempting browser installation via Puppeteer CLI...');
    execSync('npx puppeteer browsers install chrome', { 
      stdio: 'inherit',
      timeout: 120000 // 2 minute timeout
    });
    console.log('✅ Browser installed successfully via CLI');
    
    // Test browser launch
    console.log('🧪 Testing browser launch...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    await browser.close();
    console.log('✅ Browser test successful - ready for production scraping');
    
  } catch (error) {
    console.log('❌ Browser installation failed:', error.message);
    console.log('🔄 Trying alternative installation method...');
    
    try {
      // Method 2: Use browser fetcher
      const fetcher = puppeteer.createBrowserFetcher();
      console.log('📦 Downloading browser using fetcher...');
      await fetcher.download('1127108');
      console.log('✅ Browser downloaded successfully');
      
      // Test browser launch
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      await browser.close();
      console.log('✅ Browser test successful - ready for production');
      
    } catch (fetchError) {
      console.log('❌ All browser installation methods failed');
      console.log('Production environment may require additional configuration');
      process.exit(1);
    }
  }
}

// Run installation
installBrowser().catch(console.error);