import puppeteer from 'puppeteer';

export interface ExtractedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
}

export class SimpleCookieExtractor {
  private browser: any = null;
  private page: any = null;

  async extractSessionCookies(username: string, password: string): Promise<ExtractedCookie[]> {
    console.log('🍪 Starting simple automatic cookie extraction...');
    
    try {
      // Railway-optimized browser launch
      const launchConfig: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security'
        ]
      };
      
      if (process.env.RAILWAY_ENVIRONMENT) {
        console.log('🚂 Railway detected - using Chrome');
        launchConfig.executablePath = '/usr/bin/google-chrome-stable';
      }
      
      this.browser = await puppeteer.launch(launchConfig);
      this.page = await this.browser.newPage();
      
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      console.log('🌐 Navigating to Kinray login...');
      await this.page.goto('https://kinrayweblink.cardinalhealth.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Simple form filling - wait for any input field
      console.log('🔍 Waiting for form fields...');
      await this.page.waitForSelector('input', { timeout: 10000 });
      
      // Find username field (try common patterns)
      const usernameSelectors = [
        'input[name="username"]',
        'input[type="email"]', 
        '#username',
        'input[placeholder*="username" i]',
        'input[placeholder*="email" i]'
      ];
      
      let usernameField = null;
      for (const selector of usernameSelectors) {
        try {
          usernameField = await this.page.$(selector);
          if (usernameField) {
            console.log(`✅ Found username field: ${selector}`);
            await usernameField.type(username);
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Find password field
      const passwordField = await this.page.$('input[type="password"]');
      if (passwordField) {
        console.log('✅ Found password field');
        await passwordField.type(password);
      }
      
      // Enhanced form submission with authentication completion monitoring
      console.log('🚀 Submitting form...');
      await passwordField?.press('Enter');
      
      // Enhanced authentication monitoring with proper waiting
      console.log('⏳ Monitoring authentication completion...');
      let authenticatedUrl = '';
      let finalCookies = [];
      
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const currentUrl = this.page.url();
        const pageTitle = await this.page.title();
        
        console.log(`   ${(i+1)*2}s - URL: ${currentUrl} | Title: ${pageTitle}`);
        
        // Check for 2FA/verification pages
        if (currentUrl.includes('verify') || currentUrl.includes('mfa') || currentUrl.includes('2fa')) {
          console.log('🔐 2FA verification detected - waiting for completion...');
          continue;
        }
        
        // Check for authentication success indicators
        const isAuthenticated = !currentUrl.includes('login') && 
                               !currentUrl.includes('signin') && 
                               (currentUrl.includes('home') || 
                                currentUrl.includes('dashboard') || 
                                currentUrl.includes('portal') ||
                                (pageTitle.toLowerCase().includes('kinray') && !pageTitle.toLowerCase().includes('login')));
        
        if (isAuthenticated) {
          console.log(`✅ Authentication completed at ${(i+1)*2}s - URL: ${currentUrl}`);
          authenticatedUrl = currentUrl;
          break;
        }
        
        // If still on login page after 30+ seconds, credentials might be wrong
        if (i > 15 && currentUrl.includes('login')) {
          console.log('⚠️ Still on login page after 30+ seconds - credentials may be incorrect');
          break;
        }
      }
      
      // Extract cookies after authentication attempt completion
      const cookies = await this.page.cookies();
      const relevantCookies = cookies.filter((cookie: any) => 
        cookie.domain.includes('cardinalhealth.com') || 
        cookie.name.includes('session') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('okta') ||
        cookie.name.includes('_abck') ||
        cookie.name.includes('JSESSIONID') ||
        cookie.name.includes('AWSALB') ||
        cookie.name.includes('AWSELB')
      );
      
      console.log(`✅ Extracted ${relevantCookies.length} cookies from ${authenticatedUrl || 'login page'}`);
      
      // Log cookie names for debugging
      console.log('📋 Cookie names:', relevantCookies.map(c => c.name).join(', '));
      
      return relevantCookies.map((cookie: any) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure
      }));

    } catch (error: any) {
      console.error('❌ Simple extraction failed:', error.message);
      throw new Error(`Simple extraction failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

export const simpleCookieExtractor = new SimpleCookieExtractor();