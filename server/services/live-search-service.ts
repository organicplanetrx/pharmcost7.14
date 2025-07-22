/**
 * Live Search Service - Direct Credential-Based Portal Access
 * Performs real-time login and search without relying on session cookies
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { execSync } from 'child_process';
import { MedicationSearchResult } from '../../shared/schema';

export interface SearchCredentials {
  username: string;
  password: string;
}

export class LiveSearchService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async performLiveSearch(
    credentials: SearchCredentials,
    searchTerm: string,
    searchType: string
  ): Promise<MedicationSearchResult[]> {
    try {
      console.log(`🔍 Starting live search for: ${searchTerm} (${searchType})`);
      
      // Initialize browser
      await this.initBrowser();
      if (!this.page) throw new Error('Failed to initialize browser');

      // Perform fresh login
      console.log('🔑 Performing fresh Kinray login...');
      const loginSuccess = await this.performKinrayLogin(credentials);
      if (!loginSuccess) {
        throw new Error('Authentication failed - invalid credentials');
      }

      // Navigate to search interface
      console.log('🔍 Navigating to search interface...');
      await this.navigateToSearchInterface();

      // Perform search
      console.log(`🎯 Executing search for: ${searchTerm}`);
      const results = await this.executeSearch(searchTerm, searchType);

      console.log(`✅ Search completed - found ${results.length} results`);
      return results;

    } catch (error) {
      console.error('❌ Live search failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async initBrowser(): Promise<void> {
    try {
      const browserPath = await this.findBrowserPath();
      if (!browserPath) {
        throw new Error('No browser executable found');
      }

      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: browserPath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-extensions',
          '--no-first-run',
          '--single-process'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set realistic user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('✅ Browser initialized successfully');
    } catch (error) {
      throw new Error(`Browser initialization failed: ${error.message}`);
    }
  }

  private async findBrowserPath(): Promise<string | null> {
    const possiblePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/opt/google/chrome/chrome',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ];

    // Check Railway/Docker environment
    if (process.env.RAILWAY_ENVIRONMENT) {
      possiblePaths.unshift('/usr/bin/google-chrome-stable');
    }

    // Try to find working browser path
    for (const path of possiblePaths) {
      try {
        execSync(`test -x "${path}"`, { stdio: 'ignore' });
        console.log(`Found browser at: ${path}`);
        return path;
      } catch {
        continue;
      }
    }

    return null;
  }

  private async performKinrayLogin(credentials: SearchCredentials): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Navigate to Kinray login page
      console.log('🌐 Navigating to Kinray login page...');
      await this.page.goto('https://kinrayweblink.cardinalhealth.com/login', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });

      // Wait for login form
      await this.page.waitForSelector('input[name="username"], input[id*="username"], input[type="email"]', { timeout: 10000 });
      await this.page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 10000 });

      // Fill credentials
      console.log('🔑 Filling login credentials...');
      
      const usernameField = await this.page.$('input[name="username"], input[id*="username"], input[type="email"]');
      const passwordField = await this.page.$('input[name="password"], input[type="password"]');

      if (!usernameField || !passwordField) {
        throw new Error('Login form fields not found');
      }

      await usernameField.type(credentials.username, { delay: 50 });
      await passwordField.type(credentials.password, { delay: 50 });

      // Submit form
      console.log('📤 Submitting login form...');
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], .login-btn');
      if (submitButton) {
        await submitButton.click();
      } else {
        await passwordField.press('Enter');
      }

      // Wait for navigation and check result
      try {
        await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch {
        // Navigation timeout is okay, check current state
      }

      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if login was successful
      const currentUrl = this.page.url();
      const hasLoginForm = await this.page.$('input[type="password"]') !== null;

      if (!currentUrl.includes('login') && !hasLoginForm) {
        console.log('✅ Login successful - authenticated');
        return true;
      } else {
        console.log('❌ Login failed - still on login page');
        return false;
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  }

  private async navigateToSearchInterface(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    const searchUrls = [
      'https://kinrayweblink.cardinalhealth.com/search',
      'https://kinrayweblink.cardinalhealth.com/product-search',
      'https://kinrayweblink.cardinalhealth.com/portal/search',
      'https://kinrayweblink.cardinalhealth.com/dashboard'
    ];

    for (const url of searchUrls) {
      try {
        console.log(`🔄 Trying search URL: ${url}`);
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        // Check if we find a search input
        const searchInput = await this.page.$('input[type="search"], input[name*="search"], input[placeholder*="search"], input.search-input');
        if (searchInput) {
          console.log(`✅ Found search interface at: ${url}`);
          return;
        }
      } catch {
        continue;
      }
    }

    // If no dedicated search page, try to find search on current page
    const currentUrl = this.page.url();
    console.log(`🔍 Looking for search on current page: ${currentUrl}`);
  }

  private async executeSearch(searchTerm: string, searchType: string): Promise<MedicationSearchResult[]> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Find search input
      const searchSelectors = [
        'input[type="search"]',
        'input[name*="search"]',
        'input[placeholder*="search"]',
        'input[placeholder*="product"]',
        'input[placeholder*="drug"]',
        'input[placeholder*="medication"]',
        '.search-input',
        'input[type="text"]',
        'input.form-control'
      ];

      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          searchInput = await this.page.$(selector);
          if (searchInput) {
            console.log(`✅ Found search input: ${selector}`);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!searchInput) {
        throw new Error('No search input found on page');
      }

      // Enter search term
      await searchInput.click({ clickCount: 3 });
      await searchInput.type(searchTerm, { delay: 100 });
      console.log(`✅ Entered search term: ${searchTerm}`);

      // Submit search
      await searchInput.press('Enter');
      console.log('✅ Search submitted');

      // Wait for results
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Extract results
      const results = await this.extractSearchResults();
      return results;

    } catch (error) {
      throw new Error(`Search execution failed: ${error.message}`);
    }
  }

  private async extractSearchResults(): Promise<MedicationSearchResult[]> {
    if (!this.page) return [];

    try {
      const results = await this.page.evaluate(() => {
        const medicationResults: any[] = [];
        
        // Look for result containers
        const resultSelectors = [
          'table tbody tr',
          '.search-results tr',
          '.product-results .product',
          '.result-item',
          'tr:not(:first-child)',
          '.data-row'
        ];

        for (const selector of resultSelectors) {
          const rows = document.querySelectorAll(selector);
          if (rows.length > 0) {
            console.log(`Found ${rows.length} results with selector: ${selector}`);
            
            rows.forEach((row, index) => {
              try {
                // Extract name
                const nameEl = row.querySelector('td:first-child, .product-name, .name, .drug-name');
                const name = nameEl?.textContent?.trim();

                // Extract NDC
                const ndcEl = row.querySelector('td:nth-child(2), .ndc, .product-code');
                const ndc = ndcEl?.textContent?.trim();

                // Extract price
                const priceEl = row.querySelector('td:nth-child(3), td:nth-child(4), .price, .cost');
                const priceText = priceEl?.textContent?.trim() || '0.00';
                const priceMatch = priceText.match(/[\d,]+\.?\d*/);
                const cost = priceMatch ? `$${priceMatch[0]}` : '$0.00';

                if (name && name.length > 3) {
                  medicationResults.push({
                    medication: {
                      id: index + 1,
                      name: name,
                      genericName: null,
                      ndc: ndc || null,
                      packageSize: null,
                      strength: null,
                      dosageForm: 'Tablet'
                    },
                    cost: cost,
                    availability: 'In Stock',
                    vendor: 'Kinray (Cardinal Health)'
                  });
                }
              } catch (error) {
                console.log(`Error processing row ${index}:`, error);
              }
            });

            if (medicationResults.length > 0) break;
          }
        }

        return medicationResults;
      });

      console.log(`✅ Extracted ${results.length} results from search`);
      return results;

    } catch (error) {
      console.error('❌ Result extraction error:', error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      console.log('🧹 Live search service cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}