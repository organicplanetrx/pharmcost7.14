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

    // Railway/Docker environments prioritize specific paths
    if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
      possiblePaths.unshift('/usr/bin/google-chrome-stable');
      console.log('🐳 Railway/Production environment detected - prioritizing /usr/bin/google-chrome-stable');
    }

    // Try to find working browser path
    for (const path of possiblePaths) {
      try {
        execSync(`test -x "${path}"`, { stdio: 'ignore' });
        console.log(`✅ Found executable browser at: ${path}`);
        return path;
      } catch (error) {
        console.log(`❌ Browser not found at: ${path}`);
        continue;
      }
    }

    console.log('❌ No browser executable found in any expected location');
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

    // Start with current page analysis
    const currentUrl = this.page.url();
    console.log(`📍 Starting from URL: ${currentUrl}`);
    
    // Take initial screenshot to see what we have
    await this.page.screenshot({ path: '/tmp/kinray-after-login.png', fullPage: true });
    console.log('📷 Post-login screenshot saved');

    // Analyze current page structure
    const pageStructure = await this.page.evaluate(() => {
      const structure = {
        title: document.title,
        url: location.href,
        navLinks: Array.from(document.querySelectorAll('nav a, .nav a, .navbar a')).map(a => ({
          text: a.textContent?.trim(),
          href: a.href
        })).filter(link => link.text && link.text.length > 0),
        searchElements: Array.from(document.querySelectorAll('input, form, [class*="search"], [id*="search"]')).map(el => ({
          tagName: el.tagName,
          type: el.type || null,
          id: el.id || null,
          className: el.className || null,
          placeholder: el.placeholder || null,
          name: el.name || null
        })),
        headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean),
        mainContent: document.querySelector('main, .main-content, .content')?.textContent?.trim().substring(0, 200) || null
      };
      return structure;
    });

    console.log('📊 Current page analysis:');
    console.log(`   Title: ${pageStructure.title}`);
    console.log(`   URL: ${pageStructure.url}`);
    console.log(`   Navigation links: ${pageStructure.navLinks.length}`);
    pageStructure.navLinks.forEach((link, i) => {
      console.log(`     ${i + 1}. "${link.text}" -> ${link.href}`);
    });
    console.log(`   Search-related elements: ${pageStructure.searchElements.length}`);
    pageStructure.searchElements.forEach((el, i) => {
      console.log(`     ${i + 1}. ${el.tagName} type="${el.type}" id="${el.id}" class="${el.className}" placeholder="${el.placeholder}"`);
    });
    console.log(`   Headings: ${pageStructure.headings.join(', ')}`);

    // Check if current page already has search capability
    const hasSearchOnCurrentPage = pageStructure.searchElements.some(el => 
      el.type === 'search' || 
      (el.placeholder && el.placeholder.toLowerCase().includes('search')) ||
      (el.className && el.className.toLowerCase().includes('search'))
    );

    if (hasSearchOnCurrentPage) {
      console.log('✅ Current page appears to have search functionality');
      return;
    }

    // Try to find and click on search/product-related navigation links
    const searchNavOptions = [
      'search', 'products', 'catalog', 'inventory', 'browse', 'find', 'lookup'
    ];

    for (const navOption of searchNavOptions) {
      const matchingLink = pageStructure.navLinks.find(link => 
        link.text && link.text.toLowerCase().includes(navOption.toLowerCase())
      );
      
      if (matchingLink) {
        try {
          console.log(`🔄 Attempting to navigate to: "${matchingLink.text}" (${matchingLink.href})`);
          await this.page.goto(matchingLink.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
          
          // Wait and check for search inputs
          await new Promise(resolve => setTimeout(resolve, 2000));
          const searchInput = await this.page.$('input[type="search"], input[name*="search"], input[placeholder*="search"]');
          
          if (searchInput) {
            console.log(`✅ Found search interface at: ${matchingLink.href}`);
            return;
          }
        } catch (error) {
          console.log(`⚠️ Failed to navigate to ${matchingLink.href}:`, error.message);
        }
      }
    }

    // Try direct URLs if navigation links don't work
    const searchUrls = [
      'https://kinrayweblink.cardinalhealth.com/search',
      'https://kinrayweblink.cardinalhealth.com/products',
      'https://kinrayweblink.cardinalhealth.com/catalog',
      'https://kinrayweblink.cardinalhealth.com/inventory',
      'https://kinrayweblink.cardinalhealth.com/product-search',
      'https://kinrayweblink.cardinalhealth.com/portal/search'
    ];

    for (const url of searchUrls) {
      try {
        console.log(`🔄 Trying direct URL: ${url}`);
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        const searchInput = await this.page.$('input[type="search"], input[name*="search"], input[placeholder*="search"]');
        
        if (searchInput) {
          console.log(`✅ Found search interface at: ${url}`);
          return;
        }
      } catch (error) {
        console.log(`⚠️ URL ${url} failed:`, error.message);
      }
    }

    // If still no search interface found, stay on current page and let executeSearch handle it
    console.log('⚠️ No dedicated search interface found, will attempt search on current page');
  }

  private async executeSearch(searchTerm: string, searchType: string): Promise<MedicationSearchResult[]> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      console.log('🔍 Current page URL:', this.page.url());
      console.log('🔍 Page title:', await this.page.title());

      // Take screenshot for debugging
      await this.page.screenshot({ path: '/tmp/kinray-search-page.png', fullPage: true });
      console.log('📷 Screenshot saved to /tmp/kinray-search-page.png');

      // Wait for page to fully load
      await this.page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {
        console.log('⚠️ Navigation wait timed out, continuing...');
      });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Enhanced search input detection with more comprehensive selectors
      const searchSelectors = [
        // Primary search inputs
        'input[type="search"]',
        'input[name*="search"]', 
        'input[placeholder*="search"]',
        'input[placeholder*="Search"]',
        'input[placeholder*="SEARCH"]',
        
        // Product/medication specific
        'input[placeholder*="product"]',
        'input[placeholder*="Product"]', 
        'input[placeholder*="drug"]',
        'input[placeholder*="Drug"]',
        'input[placeholder*="medication"]',
        'input[placeholder*="Medication"]',
        'input[placeholder*="item"]',
        'input[placeholder*="Item"]',
        
        // Generic form inputs  
        'input[type="text"]:not([type="hidden"])',
        'input.search-input',
        'input.form-control',
        'input.search-field',
        
        // Common portal patterns
        'input[name="q"]',
        'input[name="query"]', 
        'input[name="searchTerm"]',
        'input[name="keyword"]',
        'input[id*="search"]',
        'input[id*="Search"]',
        'input[class*="search"]',
        
        // Kinray-specific patterns (from portal analysis)
        'input[data-testid*="search"]',
        'input[role="searchbox"]',
        '.search-container input',
        '#searchBox',
        '#search-input'
      ];

      console.log(`🔍 Searching for input fields with ${searchSelectors.length} selectors...`);

      // First, check what input elements exist on the page
      const allInputs = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        return Array.from(inputs).map(input => ({
          type: input.type,
          name: input.name || null,
          id: input.id || null,
          placeholder: input.placeholder || null,
          className: input.className || null,
          visible: input.offsetParent !== null
        }));
      });

      console.log(`📊 Found ${allInputs.length} input elements on page:`);
      allInputs.forEach((input, i) => {
        console.log(`   ${i + 1}. type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder}" visible=${input.visible}`);
      });

      let searchInput = null;
      let foundSelector = '';
      
      for (const selector of searchSelectors) {
        try {
          searchInput = await this.page.$(selector);
          if (searchInput) {
            // Check if the input is visible
            const isVisible = await searchInput.isVisible();
            if (isVisible) {
              foundSelector = selector;
              console.log(`✅ Found visible search input: ${selector}`);
              break;
            } else {
              console.log(`⚠️ Found hidden search input: ${selector}`);
            }
          }
        } catch (error) {
          console.log(`❌ Error checking selector ${selector}:`, error.message);
        }
      }

      if (!searchInput) {
        // If no search input found, try to find any prominent input field
        console.log('🔍 No search input found, looking for any prominent text input...');
        searchInput = await this.page.$('input[type="text"]:not([type="hidden"])');
        if (searchInput) {
          const isVisible = await searchInput.isVisible();
          if (isVisible) {
            foundSelector = 'input[type="text"] (fallback)';
            console.log('✅ Using fallback text input');
          } else {
            searchInput = null;
          }
        }
      }

      if (!searchInput) {
        throw new Error(`No search input found on page. Available inputs: ${allInputs.length} total, visible: ${allInputs.filter(i => i.visible).length}`);
      }

      // Clear and enter search term
      console.log(`🔤 Entering search term "${searchTerm}" into ${foundSelector}`);
      await searchInput.click({ clickCount: 3 });
      await new Promise(resolve => setTimeout(resolve, 500));
      await searchInput.type(searchTerm, { delay: 100 });
      
      // Verify text was entered
      const enteredValue = await this.page.evaluate(el => el.value, searchInput);
      console.log(`📝 Verified entered value: "${enteredValue}"`);

      // Submit search - try multiple methods
      console.log('📤 Submitting search...');
      try {
        await searchInput.press('Enter');
        console.log('✅ Search submitted with Enter key');
      } catch (enterError) {
        console.log('⚠️ Enter key failed, trying form submission...');
        
        // Look for search button with comprehensive patterns
        const buttonSelectors = [
          'button[type="submit"]',
          'input[type="submit"]', 
          'button:contains("Search")',
          'button:contains("SEARCH")',
          'button:contains("search")',
          'button.search-btn',
          'button.btn-search',
          'button[id*="search"]',
          'button[class*="search"]',
          '.search-button'
        ];
        
        let searchButton = null;
        for (const buttonSelector of buttonSelectors) {
          try {
            searchButton = await this.page.$(buttonSelector);
            if (searchButton) {
              console.log(`✅ Found search button: ${buttonSelector}`);
              await searchButton.click();
              console.log('✅ Search submitted with button click');
              break;
            }
          } catch {
            continue;
          }
        }
        
        if (!searchButton) {
          throw new Error('Could not submit search - no Enter key or submit button worked');
        }
      }

      // Wait for results with progress monitoring
      console.log('⏳ Waiting for search results...');
      for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const currentUrl = this.page.url();
        const currentTitle = await this.page.title();
        console.log(`   ${i}s - URL: ${currentUrl} | Title: ${currentTitle}`);
        
        // Check for results or loading indicators
        const hasResults = await this.page.$('table tbody tr, .search-results tr, .result-item');
        const hasLoading = await this.page.$('.loading, .spinner, [data-testid="loading"]');
        
        if (hasResults) {
          console.log(`✅ Results detected at ${i} seconds`);
          break;
        }
        if (!hasLoading && i > 5) {
          console.log(`⚠️ No loading indicator and no results after ${i} seconds`);
        }
      }

      // Extract results
      console.log('🎯 Extracting search results...');
      const results = await this.extractSearchResults();
      return results;

    } catch (error) {
      console.error('❌ Search execution error:', error);
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
                      dosageForm: 'Tablet',
                      manufacturer: null
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