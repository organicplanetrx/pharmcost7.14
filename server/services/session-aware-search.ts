import puppeteer, { Browser, Page } from 'puppeteer';
import { execSync } from 'child_process';
import { MedicationSearchResult } from '../../shared/types';

export class SessionAwareSearchService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async performSearch(searchTerm: string): Promise<MedicationSearchResult[]> {
    try {
      console.log('🔄 Starting session-aware search...');
      
      // First, try to extract cookies from the user's current browser session
      const sessionCookies = await this.extractCurrentSessionCookies();
      
      if (sessionCookies && sessionCookies.length > 0) {
        console.log(`🍪 Found ${sessionCookies.length} session cookies from current browser`);
        
        // Initialize browser with cookies
        await this.initBrowserWithCookies(sessionCookies);
        
        // Test authentication
        const isAuthenticated = await this.testAuthentication();
        
        if (isAuthenticated) {
          console.log('✅ Session authentication successful');
          return await this.performKinraySearch(searchTerm);
        } else {
          console.log('⚠️ Session authentication failed, cookies may be expired');
        }
      }
      
      throw new Error('No valid session found. Please log into Kinray in your browser first, then try searching.');
      
    } catch (error) {
      console.error('❌ Session-aware search failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async extractCurrentSessionCookies(): Promise<any[]> {
    try {
      // For Railway/server environment, we can't directly access user's browser
      // But we can check if cookies were previously extracted and stored
      const storedCookies = global.__kinray_session_cookies__;
      
      if (storedCookies && storedCookies.length > 0) {
        console.log('🔍 Using previously extracted session cookies');
        return storedCookies;
      }
      
      console.log('💡 No session cookies found - user needs to extract them first');
      return [];
      
    } catch (error) {
      console.error('❌ Cookie extraction error:', error);
      return [];
    }
  }

  private async initBrowserWithCookies(cookies: any[]): Promise<void> {
    try {
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
          '--disable-gpu',
          '--disable-web-security'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Navigate to domain first
      await this.page.goto('https://kinrayweblink.cardinalhealth.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Inject all cookies
      for (const cookie of cookies) {
        try {
          await this.page.setCookie({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path || '/',
            expires: cookie.expires,
            httpOnly: cookie.httpOnly || false,
            secure: cookie.secure || false
          });
        } catch (e) {
          console.log(`⚠️ Failed to set cookie: ${cookie.name}`);
        }
      }
      
      console.log('✅ Browser initialized with session cookies');
      
    } catch (error) {
      throw new Error(`Browser initialization failed: ${error}`);
    }
  }

  private async testAuthentication(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Test authentication by visiting authenticated area
      await this.page.goto('https://kinrayweblink.cardinalhealth.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 12000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();

      console.log(`🔍 Auth test - URL: ${currentUrl}`);
      console.log(`🔍 Auth test - Title: ${pageTitle}`);

      // Check if we're authenticated (not redirected to login)
      const isAuthenticated = !currentUrl.includes('login') && 
                             !currentUrl.includes('signin') &&
                             (currentUrl.includes('home') || 
                              currentUrl.includes('dashboard') ||
                              pageTitle.toLowerCase().includes('kinray'));

      return isAuthenticated;
      
    } catch (error) {
      console.error('❌ Authentication test failed:', error);
      return false;
    }
  }

  private async performKinraySearch(searchTerm: string): Promise<MedicationSearchResult[]> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      console.log(`🎯 Performing Kinray search for: ${searchTerm}`);
      
      // Navigate to search area
      await this.page.goto('https://kinrayweblink.cardinalhealth.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Wait for page to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Find search input with multiple strategies
      const searchSelectors = [
        'input[placeholder*="search" i]',
        'input[name*="search" i]',
        'input[id*="search" i]',
        'input.search-input',
        'input[type="text"]',
        'input[aria-label*="search" i]'
      ];

      let searchInput = null;
      for (const selector of searchSelectors) {
        searchInput = await this.page.$(selector);
        if (searchInput) {
          console.log(`✅ Found search input: ${selector}`);
          break;
        }
      }

      if (!searchInput) {
        console.log('❌ No search input found - taking screenshot for debugging');
        await this.page.screenshot({ path: '/tmp/kinray-no-search.png', fullPage: true });
        throw new Error('Search input not found on authenticated page');
      }

      // Clear and enter search term
      await searchInput.click({ clickCount: 3 }); // Select all
      await searchInput.type(searchTerm);
      
      // Submit search
      await searchInput.press('Enter');
      
      console.log('⏳ Waiting for search results...');
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Extract results
      return await this.extractSearchResults();
      
    } catch (error) {
      console.error('❌ Kinray search failed:', error);
      throw error;
    }
  }

  private async extractSearchResults(): Promise<MedicationSearchResult[]> {
    if (!this.page) return [];

    try {
      // Take screenshot for debugging
      await this.page.screenshot({ path: '/tmp/kinray-results.png', fullPage: true });

      const results = await this.page.evaluate(() => {
        const resultElements = document.querySelectorAll([
          '.product-row',
          '.search-result',
          '.item-row', 
          'tr[data-item]',
          'tr.result-row',
          '[class*="result"]',
          '[class*="product"]'
        ].join(', '));

        const extractedResults: any[] = [];

        resultElements.forEach((element, index) => {
          if (index >= 20) return; // Limit results

          const textContent = element.textContent || '';
          
          // Extract basic info
          const nameMatch = textContent.match(/([A-Z][A-Za-z\s]+(?:HCL|hydrochloride|tablets?|caps?)?)/i);
          const ndcMatch = textContent.match(/(\d{5}-\d{4}-\d{2}|\d{11})/);
          const priceMatch = textContent.match(/\$?(\d+\.?\d*)/);

          if (nameMatch || ndcMatch) {
            extractedResults.push({
              id: `kinray_${index}`,
              medication_name: nameMatch ? nameMatch[1].trim() : 'Unknown',
              ndc: ndcMatch ? ndcMatch[1] : '',
              cost: priceMatch ? parseFloat(priceMatch[1]) : 0,
              manufacturer: 'Various',
              availability: 'Available',
              vendor_id: 1
            });
          }
        });

        return extractedResults;
      });

      console.log(`✅ Extracted ${results.length} search results`);
      return results;
      
    } catch (error) {
      console.error('❌ Result extraction failed:', error);
      return [];
    }
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
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

export const sessionAwareSearch = new SessionAwareSearchService();