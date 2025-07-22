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

export class CookieExtractor {
  private browser: any = null;
  private page: any = null;

  async extractSessionCookies(username: string, password: string): Promise<ExtractedCookie[]> {
    console.log('🍪 Starting automatic cookie extraction from Kinray portal...');
    
    try {
      // Launch browser for cookie extraction with Railway optimization
      console.log('🌐 Launching browser for cookie extraction...');
      
      const browserArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      ];

      // Try different browser launch strategies
      let launchConfig = { headless: true, args: browserArgs };
      
      // Railway environment detection
      if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_DEPLOYMENT_ID) {
        console.log('🚂 Railway detected - using optimized browser config');
        launchConfig.executablePath = '/usr/bin/google-chrome-stable';
      }
      
      this.browser = await puppeteer.launch(launchConfig);


      this.page = await this.browser.newPage();
      
      // Set viewport and user agent
      await this.page.setViewport({ width: 1920, height: 1080 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      console.log('🌐 Navigating to Kinray login page...');
      await this.page.goto('https://kinrayweblink.cardinalhealth.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Take screenshot for debugging
      await this.page.screenshot({ path: 'cookie-extraction-start.png', fullPage: true });
      console.log('📸 Initial page screenshot saved');

      // Perform login to generate session cookies
      console.log('🔑 Performing automated login...');
      
      // Wait for login form
      await this.page.waitForSelector('input[name="username"], input[type="email"], #username', { timeout: 10000 });
      
      // Fill username
      const usernameField = await this.page.$('input[name="username"], input[type="email"], #username');
      if (usernameField) {
        await usernameField.type(username);
        console.log('✅ Username entered');
      }

      // Fill password
      const passwordField = await this.page.$('input[name="password"], input[type="password"], #password');
      if (passwordField) {
        await passwordField.type(password);
        console.log('✅ Password entered');
      }

      // Submit login form
      const submitButton = await this.page.$('input[type="submit"], button[type="submit"], button:contains("Sign In"), button:contains("Login")');
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Login form submitted');
      }

      // Wait for navigation and potential redirects
      console.log('⏳ Waiting for authentication to complete...');
      await this.page.waitForTimeout(5000);

      // Handle potential 2FA or additional authentication steps
      const currentUrl = this.page.url();
      console.log(`📍 Current URL after login: ${currentUrl}`);

      if (currentUrl.includes('verify') || currentUrl.includes('2fa')) {
        console.log('🔐 2FA detected - waiting for manual completion...');
        console.log('💡 Please complete 2FA in your browser, then the system will extract the authenticated cookies');
        
        // Wait for user to complete 2FA (up to 2 minutes)
        for (let i = 0; i < 24; i++) {
          await this.page.waitForTimeout(5000);
          const newUrl = this.page.url();
          
          if (!newUrl.includes('verify') && !newUrl.includes('2fa') && !newUrl.includes('login')) {
            console.log('✅ 2FA completed - authenticated session detected');
            break;
          }
          
          if (i === 23) {
            console.log('⏰ 2FA timeout - extracting available cookies anyway');
          }
        }
      }

      // Extract all cookies from the authenticated session
      console.log('🍪 Extracting session cookies...');
      const cookies = await this.page.cookies();
      
      // Filter for relevant Kinray/Cardinal Health cookies
      const relevantCookies = cookies.filter(cookie => 
        cookie.domain.includes('cardinalhealth.com') || 
        cookie.domain.includes('kinray') ||
        cookie.name.includes('session') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('okta') ||
        cookie.name.includes('_abck') ||
        cookie.name.includes('rxVisitor')
      );

      console.log(`✅ Extracted ${relevantCookies.length} relevant cookies from authenticated session`);
      
      // Take final screenshot
      await this.page.screenshot({ path: 'cookie-extraction-complete.png', fullPage: true });
      console.log('📸 Final authenticated page screenshot saved');

      return relevantCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure
      }));

    } catch (error) {
      console.error('❌ Cookie extraction failed:', error.message);
      throw new Error(`Cookie extraction failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log('🔒 Browser closed after cookie extraction');
      }
    }
  }

  async extractCookiesFromRunningSession(): Promise<ExtractedCookie[]> {
    console.log('🍪 Attempting to extract cookies from any running browser sessions...');
    
    try {
      // This method attempts to connect to existing browser instances
      // Note: This is more complex and requires additional setup
      console.log('⚠️ This feature requires browser debugging port to be enabled');
      console.log('💡 For now, use the automatic login method or manual cookie injection');
      
      return [];
    } catch (error) {
      console.error('❌ Running session extraction failed:', error.message);
      throw error;
    }
  }
}

export const cookieExtractor = new CookieExtractor();