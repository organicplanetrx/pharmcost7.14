import puppeteer, { Browser, Page } from 'puppeteer';

export class FreshCookieExtractor {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async extractFreshSessionCookies(username: string, password: string): Promise<any[]> {
    try {
      console.log('🔄 Starting fresh cookie extraction with new browser session...');
      
      await this.initBrowser();
      
      // Step 1: Navigate to Kinray login page
      console.log('🌐 Navigating to Kinray login page...');
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Step 2: Perform login with provided credentials
      console.log('🔐 Performing fresh login...');
      const loginSuccess = await this.performLogin(username, password);
      
      if (!loginSuccess) {
        throw new Error('Login failed - please check your Kinray credentials');
      }

      // Step 3: Extract fresh session cookies
      console.log('🍪 Extracting fresh session cookies...');
      const cookies = await this.page!.cookies();
      const sessionCookies = cookies.filter(cookie => 
        cookie.domain.includes('kinrayweblink') || 
        cookie.domain.includes('cardinalhealth.com')
      );

      console.log(`✅ Extracted ${sessionCookies.length} fresh session cookies`);
      
      // Step 4: Verify cookies work by testing access to protected area
      const isValid = await this.validateCookies(sessionCookies);
      
      if (!isValid) {
        throw new Error('Extracted cookies are not valid for accessing Kinray portal');
      }

      return sessionCookies;

    } catch (error) {
      console.error('❌ Fresh cookie extraction failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async initBrowser(): Promise<void> {
    try {
      const browserPath = await this.findBrowserPath();
      if (!browserPath) {
        throw new Error('Browser not found for cookie extraction');
      }

      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: browserPath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set realistic user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    } catch (error) {
      console.error('❌ Browser initialization failed:', error);
      throw error;
    }
  }

  private async findBrowserPath(): Promise<string | null> {
    const paths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    
    for (const path of paths) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(path)) {
          return path;
        }
      } catch {}
    }
    return null;
  }

  private async performLogin(username: string, password: string): Promise<boolean> {
    try {
      // Wait for login form
      await this.page!.waitForSelector('input[type="email"], input[name="username"], input[id*="user"]', { timeout: 10000 });
      
      // Find and fill username field
      const usernameField = await this.page!.$('input[type="email"], input[name="username"], input[id*="user"]');
      if (usernameField) {
        await usernameField.type(username);
        console.log('✅ Username entered');
      }

      // Find and fill password field
      const passwordField = await this.page!.$('input[type="password"]');
      if (passwordField) {
        await passwordField.type(password);
        console.log('✅ Password entered');
      }

      // Find and click login button
      const loginButton = await this.page!.$('button[type="submit"], input[type="submit"], button:contains("Sign In"), button:contains("Login")');
      if (loginButton) {
        await loginButton.click();
        console.log('✅ Login button clicked');
      }

      // Wait for navigation or success indicator
      await new Promise(resolve => setTimeout(resolve, 5000));

      const currentUrl = this.page!.url();
      const isLoggedIn = !currentUrl.includes('login') && !currentUrl.includes('signin');
      
      if (isLoggedIn) {
        console.log('✅ Login successful - redirected to dashboard');
        return true;
      } else {
        console.log('❌ Login failed - still on login page');
        return false;
      }

    } catch (error) {
      console.error('❌ Login process failed:', error);
      return false;
    }
  }

  private async validateCookies(cookies: any[]): Promise<boolean> {
    try {
      // Create new page to test cookies
      const testPage = await this.browser!.newPage();
      
      // Set cookies
      for (const cookie of cookies) {
        try {
          await testPage.setCookie(cookie);
        } catch (cookieError) {
          console.log(`⚠️ Failed to set cookie: ${cookie.name}`);
        }
      }
      
      // Test access to protected area
      await testPage.goto('https://kinrayweblink.cardinalhealth.com/product/search', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const url = testPage.url();
      const isValid = !url.includes('login') && !url.includes('signin');
      
      await testPage.close();
      
      if (isValid) {
        console.log('✅ Cookies validated - provide access to protected areas');
      } else {
        console.log('❌ Cookies invalid - redirected to login');
      }
      
      return isValid;

    } catch (error) {
      console.error('❌ Cookie validation failed:', error);
      return false;
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}