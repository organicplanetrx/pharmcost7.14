import puppeteer, { Browser, Page } from 'puppeteer';
import { MedicationSearchResult } from '../../shared/types';

export class VerifiedSearchService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async performVerifiedSearch(searchTerm: string): Promise<MedicationSearchResult[]> {
    try {
      console.log(`🔍 Starting verified search for: ${searchTerm}`);
      
      // Step 1: Get validated session cookies
      const sessionCookies = (global as any).__kinray_session_cookies__;
      
      if (!sessionCookies || sessionCookies.length === 0) {
        throw new Error('No session cookies available. Please extract fresh cookies first.');
      }
      
      console.log(`🍪 Using ${sessionCookies.length} validated session cookies`);
      
      // Step 2: Initialize browser and inject cookies
      await this.initBrowser();
      await this.injectCookies(sessionCookies);
      
      // Step 3: Navigate to Kinray portal and verify login status
      console.log('🌐 Navigating to Kinray portal...');
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 4: Verify we're logged in before searching
      const isLoggedIn = await this.verifyLoginStatus();
      
      if (!isLoggedIn) {
        throw new Error('Not logged into Kinray portal - cookies may have expired');
      }
      
      console.log('✅ Verified logged into Kinray portal - ready to search');
      
      // Step 5: Navigate to search page
      await this.navigateToSearchPage();
      
      // Step 6: Perform medication search
      const results = await this.searchMedication(searchTerm);
      
      console.log(`✅ Search completed: ${results.length} results found`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Verified search failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async initBrowser(): Promise<void> {
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
          '--no-first-run'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

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
        if (fs.existsSync(path)) return path;
      } catch {}
    }
    return null;
  }

  private async injectCookies(cookies: any[]): Promise<void> {
    try {
      // Navigate to domain first to set cookies
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      // Inject each cookie
      for (const cookie of cookies) {
        try {
          await this.page!.setCookie(cookie);
        } catch (cookieError) {
          console.log(`⚠️ Failed to inject cookie: ${cookie.name}`);
        }
      }

      console.log(`✅ Injected ${cookies.length} session cookies`);

    } catch (error) {
      console.error('❌ Cookie injection failed:', error);
      throw error;
    }
  }

  private async verifyLoginStatus(): Promise<boolean> {
    try {
      const currentUrl = this.page!.url();
      
      // Check if we're on login page
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        console.log('❌ Redirected to login page - not authenticated');
        return false;
      }

      // Try to access protected area
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com/product/search', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const finalUrl = this.page!.url();
      const isAuthenticated = !finalUrl.includes('login') && !finalUrl.includes('signin');

      if (isAuthenticated) {
        console.log('✅ Verified authenticated access to Kinray portal');
      } else {
        console.log('❌ Not authenticated - redirected to login');
      }

      return isAuthenticated;

    } catch (error) {
      console.error('❌ Login verification failed:', error);
      return false;
    }
  }

  private async navigateToSearchPage(): Promise<void> {
    try {
      console.log('🔍 Navigating to search page...');
      
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com/product/search', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('✅ Successfully navigated to search page');

    } catch (error) {
      console.error('❌ Navigation to search page failed:', error);
      throw error;
    }
  }

  private async searchMedication(searchTerm: string): Promise<MedicationSearchResult[]> {
    try {
      console.log(`🔍 Searching for medication: ${searchTerm}`);

      // Find search input field
      const searchSelectors = [
        'input[name="search"]',
        'input[placeholder*="search"]',
        'input[type="search"]',
        'input.search-input',
        '#search-input',
        '.search-field input'
      ];

      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          searchInput = await this.page!.$(selector);
          if (searchInput) {
            console.log(`✅ Found search input with selector: ${selector}`);
            break;
          }
        } catch {}
      }

      if (!searchInput) {
        throw new Error('Could not find search input field on Kinray portal');
      }

      // Clear and enter search term
      await searchInput.click({ clickCount: 3 }); // Select all
      await searchInput.type(searchTerm);
      console.log(`✅ Entered search term: ${searchTerm}`);

      // Submit search
      await this.page!.keyboard.press('Enter');
      
      // Wait for results
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Extract results
      const results = await this.extractSearchResults();

      return results;

    } catch (error) {
      console.error('❌ Medication search failed:', error);
      throw error;
    }
  }

  private async extractSearchResults(): Promise<MedicationSearchResult[]> {
    try {
      console.log('📊 Extracting search results...');

      const results: MedicationSearchResult[] = [];

      // Multiple selector strategies for result extraction
      const resultSelectors = [
        '.result-item',
        '.product-item',
        '.search-result',
        'tr[data-product]',
        '.medication-row',
        '[class*="result"]'
      ];

      let resultElements = [];
      for (const selector of resultSelectors) {
        try {
          resultElements = await this.page!.$$(selector);
          if (resultElements.length > 0) {
            console.log(`✅ Found ${resultElements.length} results with selector: ${selector}`);
            break;
          }
        } catch {}
      }

      if (resultElements.length === 0) {
        console.log('⚠️ No result elements found - checking page content');
        const pageContent = await this.page!.content();
        
        // Save screenshot for debugging
        await this.page!.screenshot({ path: 'kinray-search-results.png' });
        console.log('📸 Screenshot saved: kinray-search-results.png');
        
        return [];
      }

      // Extract data from each result
      for (let i = 0; i < Math.min(resultElements.length, 20); i++) {
        try {
          const element = resultElements[i];
          
          const result = await this.page!.evaluate((el) => {
            // Extract medication details
            const name = el.querySelector('[class*="name"], [class*="product"]')?.textContent?.trim() || '';
            const ndc = el.textContent?.match(/\d{5}-\d{4}-\d{2}|\d{11}/)?.[0] || '';
            const price = el.textContent?.match(/\$[\d,]+\.?\d*/)?.[0] || '';
            const manufacturer = el.querySelector('[class*="manufacturer"], [class*="mfr"]')?.textContent?.trim() || '';
            const strength = el.textContent?.match(/\d+\s*(mg|mcg|g|ml)/i)?.[0] || '';
            
            return {
              name,
              ndc,
              price,
              manufacturer,
              strength
            };
          }, element);

          if (result.name && result.name.length > 3) {
            results.push({
              medication: {
                id: i + 1,
                name: result.name,
                genericName: result.name,
                ndc: result.ndc || null,
                packageSize: null,
                strength: result.strength || null,
                dosageForm: null,
                manufacturer: result.manufacturer || null
              },
              cost: result.price || '0.00',
              availability: 'Available',
              vendor: 'Kinray'
            });
          }

        } catch (extractError) {
          console.log(`⚠️ Failed to extract result ${i}:`, extractError);
        }
      }

      console.log(`✅ Successfully extracted ${results.length} medication results`);
      
      return results;

    } catch (error) {
      console.error('❌ Result extraction failed:', error);
      return [];
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