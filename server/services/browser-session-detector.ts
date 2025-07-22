import puppeteer, { Browser, Page } from 'puppeteer';
import { execSync } from 'child_process';

export class BrowserSessionDetector {
  private browser: Browser | null = null;
  private page: Page | null = null;

  // Check if user is already logged into Kinray and extract session automatically
  async detectAndExtractSession(): Promise<any[]> {
    try {
      console.log('🔍 Detecting existing Kinray browser session...');
      
      await this.initBrowser();
      
      // Navigate to Kinray portal
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentUrl = this.page!.url();
      const pageTitle = await this.page!.title();
      
      console.log(`🔍 Session check - URL: ${currentUrl}`);
      console.log(`🔍 Session check - Title: ${pageTitle}`);
      
      // Check if we're authenticated (not redirected to login)
      const isAuthenticated = !currentUrl.includes('login') && 
                             !currentUrl.includes('signin') &&
                             (currentUrl.includes('home') || 
                              currentUrl.includes('dashboard') ||
                              pageTitle.toLowerCase().includes('kinray'));
      
      if (isAuthenticated) {
        console.log('✅ Found authenticated Kinray session');
        
        // Extract all cookies from this session
        const cookies = await this.page!.cookies();
        const kinrayCookies = cookies.filter((cookie: any) =>
          cookie.domain.includes('cardinalhealth.com') ||
          cookie.name.includes('session') ||
          cookie.name.includes('auth') ||
          cookie.name.includes('JSESSIONID') ||
          cookie.name.includes('_abck')
        );
        
        console.log(`🍪 Extracted ${kinrayCookies.length} session cookies from authenticated browser`);
        
        return kinrayCookies.map((cookie: any) => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires,
          httpOnly: cookie.httpOnly,
          secure: cookie.secure
        }));
      } else {
        console.log('⚠️ No authenticated Kinray session found');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Session detection failed:', error);
      return [];
    } finally {
      await this.cleanup();
    }
  }

  private async initBrowser(): Promise<void> {
    const browserPath = await this.findBrowserPath();
    if (!browserPath) {
      throw new Error('Browser not found');
    }

    this.browser = await puppeteer.launch({
      headless: true,
      executablePath: browserPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  private async findBrowserPath(): Promise<string | null> {
    const possiblePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];

    for (const path of possiblePaths) {
      try {
        execSync(`test -x "${path}"`, { stdio: 'ignore' });
        return path;
      } catch {
        continue;
      }
    }
    return null;
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

export const browserSessionDetector = new BrowserSessionDetector();