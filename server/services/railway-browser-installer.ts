import { execSync } from 'child_process';

export class RailwayBrowserInstaller {
  static async ensureBrowserAvailable(): Promise<string | null> {
    try {
      console.log('🔄 Checking Railway browser availability...');
      
      // Check if Chrome is already installed
      const chromePaths = [
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome'
      ];
      
      const fs = await import('fs');
      
      for (const path of chromePaths) {
        if (fs.existsSync(path)) {
          console.log(`✅ Found Railway Chrome at: ${path}`);
          return path;
        }
      }
      
      // Check if we can install Chrome
      console.log('⚠️ Chrome not found - attempting installation...');
      
      try {
        // Update package lists
        execSync('apt-get update', { stdio: 'pipe' });
        console.log('✅ Package lists updated');
        
        // Install Chrome
        execSync('apt-get install -y wget gnupg', { stdio: 'pipe' });
        execSync('wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -', { stdio: 'pipe' });
        execSync('sh -c \'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list\'', { stdio: 'pipe' });
        execSync('apt-get update', { stdio: 'pipe' });
        execSync('apt-get install -y google-chrome-stable', { stdio: 'pipe' });
        
        console.log('✅ Chrome installation completed');
        
        // Verify installation
        if (fs.existsSync('/usr/bin/google-chrome-stable')) {
          return '/usr/bin/google-chrome-stable';
        }
        
      } catch (installError) {
        console.log('❌ Chrome installation failed - Railway may not allow package installation');
      }
      
      // Try Puppeteer bundled browser as fallback
      try {
        const puppeteer = await import('puppeteer');
        const bundledPath = puppeteer.executablePath();
        
        if (bundledPath && fs.existsSync(bundledPath)) {
          console.log(`✅ Using Puppeteer bundled browser at: ${bundledPath}`);
          return bundledPath;
        }
      } catch (bundledError) {
        console.log('❌ Puppeteer bundled browser not available');
      }
      
      console.log('❌ No browser available on Railway - browser automation not supported');
      return null;
      
    } catch (error) {
      console.error('❌ Browser availability check failed:', error);
      return null;
    }
  }
}