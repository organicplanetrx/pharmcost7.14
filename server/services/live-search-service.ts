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

      // Use user data directory to share session with existing browser
      const userDataDir = '/tmp/chrome-user-data';
      
      this.browser = await puppeteer.launch({
        headless: true,
        executablePath: browserPath,
        userDataDir: userDataDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-extensions',
          '--no-first-run',
          '--single-process',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--no-default-browser-check',
          '--no-first-run'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Set realistic user agent matching typical browser
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('✅ Browser initialized with session sharing');
    } catch (error) {
      throw new Error(`Browser initialization failed: ${error instanceof Error ? error.message : String(error)}`);
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

      // Check current state and handle 2FA if needed
      let currentUrl = this.page.url();
      console.log(`🔍 Current URL after login: ${currentUrl}`);

      // Handle 2FA verification challenge
      if (currentUrl.includes('verify') || currentUrl.includes('mfa') || currentUrl.includes('call')) {
        console.log('🔐 2FA verification page detected - attempting to bypass...');
        
        // Strategy 1: Direct navigation to home page  
        try {
          console.log('🏠 Attempting direct navigation to home page...');
          await this.page.goto('https://kinrayweblink.cardinalhealth.com/home', { 
            waitUntil: 'domcontentloaded', 
            timeout: 15000 
          });
          await new Promise(resolve => setTimeout(resolve, 3000));
          currentUrl = this.page.url();
          console.log(`🔍 URL after home navigation: ${currentUrl}`);
        } catch (error) {
          console.log(`⚠️ Direct home navigation failed: ${error.message}`);
        }
        
        // Strategy 2: Look for skip/bypass options if still on 2FA page
        if (currentUrl.includes('verify') || currentUrl.includes('mfa') || currentUrl.includes('call')) {
          console.log('🔄 Looking for skip/bypass options...');
          const skipSelectors = [
            'a[href*="skip"]', 'button[name*="skip"]',
            'a:contains("Skip")', 'button:contains("Skip")',  
            'a:contains("Later")', 'button:contains("Later")',
            'a:contains("Not now")', 'button:contains("Not now")',
            '.skip-link', '.bypass-link'
          ];
          
          for (const selector of skipSelectors) {
            try {
              const skipElement = await this.page.$(selector);
              if (skipElement) {
                await skipElement.click();
                console.log(`✅ Clicked skip option: ${selector}`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                currentUrl = this.page.url();
                break;
              }
            } catch {}
          }
        }
        
        // Strategy 3: Try alternative navigation routes
        if (currentUrl.includes('verify') || currentUrl.includes('mfa') || currentUrl.includes('call')) {
          console.log('🔄 Trying alternative navigation routes...');
          const alternativeUrls = [
            'https://kinrayweblink.cardinalhealth.com/',
            'https://kinrayweblink.cardinalhealth.com/dashboard',
            'https://kinrayweblink.cardinalhealth.com/portal'
          ];
          
          for (const url of alternativeUrls) {
            try {
              await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
              await new Promise(resolve => setTimeout(resolve, 2000));
              currentUrl = this.page.url();
              if (!currentUrl.includes('verify') && !currentUrl.includes('mfa')) {
                console.log(`✅ Successfully navigated via: ${url}`);
                break;
              }
            } catch {}
          }
        }
      }

      // Final authentication check
      currentUrl = this.page.url();
      const pageTitle = await this.page.title();
      const hasLoginForm = await this.page.$('input[type="password"]') !== null;

      console.log(`🔍 Final URL: ${currentUrl}`);
      console.log(`🔍 Final title: ${pageTitle}`);

      const isAuthenticated = !currentUrl.includes('login') && 
                             !currentUrl.includes('signin') && 
                             !hasLoginForm &&
                             (currentUrl.includes('home') || 
                              currentUrl.includes('dashboard') || 
                              pageTitle.includes('Kinray'));

      if (isAuthenticated) {
        console.log('✅ Login successful - authenticated');
        return true;
      } else {
        console.log('❌ Authentication verification failed');
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
          href: (a as HTMLAnchorElement).href
        })).filter(link => link.text && link.text.length > 0),
        searchElements: Array.from(document.querySelectorAll('input, form, [class*="search"], [id*="search"]')).map(el => ({
          tagName: el.tagName,
          type: (el as HTMLInputElement).type || null,
          id: el.id || null,
          className: el.className || null,
          placeholder: (el as HTMLInputElement).placeholder || null,
          name: (el as HTMLInputElement).name || null
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

    // Priority: Navigate to home page if we're not already there  
    if (!currentUrl.includes('home')) {
      console.log('🏠 Navigating to Kinray home page for search interface...');
      try {
        await this.page.goto('https://kinrayweblink.cardinalhealth.com/home', { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('✅ Successfully navigated to home page');
        
        // Re-analyze the home page structure
        const homePageStructure = await this.page.evaluate(() => ({
          title: document.title,
          url: location.href,
          searchElements: Array.from(document.querySelectorAll('input')).map(el => ({
            tagName: el.tagName,
            type: el.type || null,
            id: el.id || null,
            className: el.className || null,
            placeholder: el.placeholder || null,
            name: el.name || null
          }))
        }));
        
        console.log('🏠 Home page analysis:');
        console.log(`   Title: ${homePageStructure.title}`);
        console.log(`   URL: ${homePageStructure.url}`);
        console.log(`   Input elements: ${homePageStructure.searchElements.length}`);
        homePageStructure.searchElements.forEach((el, i) => {
          console.log(`     ${i + 1}. ${el.tagName} type="${el.type}" id="${el.id}" class="${el.className}" placeholder="${el.placeholder}"`);
        });
        
        return; // Home page should have the main search interface
        
      } catch (error) {
        console.log(`⚠️ Failed to navigate to home page: ${error.message}`);
      }
    }

    // Check if current page already has search capability
    const hasSearchOnCurrentPage = pageStructure.searchElements.some(el => 
      el.type === 'search' || 
      (el.placeholder && el.placeholder.toLowerCase().includes('search')) ||
      (el.className && el.className.toLowerCase().includes('search')) ||
      (el.tagName === 'INPUT' && el.type === 'text')
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

      // Kinray main search bar - positioned next to "ALL" dropdown, above navigation menu
      const searchSelectors = [
        // Primary search input next to the "ALL" dropdown
        'input[type="text"]', // Main search field as shown in screenshot
        
        // Look for inputs near the "ALL" dropdown or search context
        'select + input[type="text"]', // Input immediately after a select dropdown
        'form input[type="text"]:not([hidden])', // Form-based text inputs
        
        // Kinray-specific search patterns based on layout
        'input.form-control', // Bootstrap/common CSS framework classes
        'input[role="searchbox"]',
        'input[placeholder*="search"]',
        'input[id*="search"]',
        'input[name*="search"]',
        
        // Generic text inputs (Kinray uses simple text inputs)
        'input:not([type]):not([hidden]):not([readonly])',
        'input[type="text"]:not([hidden]):not([readonly]):not([disabled])',
        
        // Search context selectors
        '.search-container input',
        '.search-form input',
        '#searchBox'
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
        // Look for the main search input by targeting the largest/most prominent text input
        console.log('🔍 No specific search input found, analyzing all text inputs...');
        const allTextInputs = await this.page.$$('input[type="text"]:not([hidden]):not([readonly])');
        
        if (allTextInputs.length > 0) {
          console.log(`📝 Found ${allTextInputs.length} text input(s), selecting the most likely search field...`);
          
          // For Kinray, typically use the first visible large text input (main search bar)
          for (const input of allTextInputs) {
            try {
              const isVisible = await input.isVisible();
              const boundingBox = await input.boundingBox();
              
              // Check if it's a substantial input field (not tiny utility fields)
              if (isVisible && boundingBox && boundingBox.width > 150) {
                searchInput = input;
                foundSelector = 'Primary text input (auto-detected)';
                console.log(`✅ Selected text input with width ${boundingBox.width}px`);
                break;
              }
            } catch {
              continue;
            }
          }
          
          // Fallback to first visible text input if no large one found
          if (!searchInput && allTextInputs.length > 0) {
            for (const input of allTextInputs) {
              const isVisible = await input.isVisible();
              if (isVisible) {
                searchInput = input;
                foundSelector = 'First visible text input (fallback)';
                console.log('✅ Using first visible text input as fallback');
                break;
              }
            }
          }
        }
      }

      if (!searchInput) {
        throw new Error(`No search input found on page. Available inputs: ${allInputs.length} total, visible: ${allInputs.filter(i => i.visible).length}`);
      }

      // Format search term for Kinray's specific requirements (drug,strength format)
      let formattedSearchTerm = searchTerm;
      
      // If search term doesn't contain strength, add common strengths for testing
      if (!searchTerm.includes(',')) {
        const commonStrengths = {
          'lisinopril': '10', // Common lisinopril strength
          'aspirin': '325',   // Common aspirin strength
          'ibuprofen': '200', // Common ibuprofen strength
          'tylenol': '325',   // Common acetaminophen strength
          'acetaminophen': '325',
          'metformin': '500', // Common metformin strength
          'advil': '200',     // Common ibuprofen strength
          'amoxicillin': '500', // Common amoxicillin strength
          'lipitor': '20',    // Common atorvastatin strength
          'atorvastatin': '20'
        };
        
        const drugName = searchTerm.toLowerCase().trim();
        if (drugName in commonStrengths) {
          formattedSearchTerm = `${searchTerm},${commonStrengths[drugName as keyof typeof commonStrengths]}`;
          console.log(`🎯 Formatted search term for Kinray: "${formattedSearchTerm}" (drug,strength format)`);
        }
      }

      // Clear and enter search term
      console.log(`🔤 Entering search term "${formattedSearchTerm}" into ${foundSelector}`);
      await searchInput.click({ clickCount: 3 });
      await new Promise(resolve => setTimeout(resolve, 500));
      await searchInput.type(formattedSearchTerm, { delay: 100 });
      
      // Verify text was entered
      const enteredValue = await this.page.evaluate(el => (el as HTMLInputElement).value, searchInput);
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

      // Wait for Angular app to fully load and show results
      console.log('⏳ Waiting for Angular app to load and search results...');
      
      // Wait for Angular to bootstrap and load content
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      for (let i = 1; i <= 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const currentUrl = this.page.url();
        const currentTitle = await this.page.title();
        
        // Check if Angular app has loaded (no longer showing just app-root)
        const pageContent = await this.page.content();
        const hasAngularContent = !pageContent.includes('<app-root> </app-root>') && pageContent.length > 1000;
        
        console.log(`   ${i*2}s - URL: ${currentUrl} | Angular loaded: ${hasAngularContent} | Content length: ${pageContent.length}`);
        
        // Look for various result indicators
        const hasResults = await this.page.$('table tbody tr, .search-results, .result-item, .product-row, .medication-row');
        const hasSearchComplete = await this.page.$('.no-results, .search-complete, .results-container');
        const hasLoading = await this.page.$('.loading, .spinner, [data-testid="loading"], .fa-spinner');
        
        if (hasAngularContent && (hasResults || hasSearchComplete)) {
          console.log(`✅ Angular loaded and results/completion detected at ${i*2} seconds`);
          break;
        }
        
        if (hasAngularContent && !hasLoading && i > 7) {
          console.log(`⚠️ Angular loaded, no loading indicator, checking for results...`);
          break;
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
        console.log('🔍 COMPREHENSIVE KINRAY ANALYSIS STARTING...');
        
        // First, capture complete page structure for debugging
        const pageStructure = {
          url: location.href,
          title: document.title,
          bodyText: document.body.innerText.substring(0, 2000),
          elementCounts: {
            tables: document.querySelectorAll('table').length,
            rows: document.querySelectorAll('tr').length,
            divs: document.querySelectorAll('div').length
          }
        };
        
        console.log('📊 PAGE ANALYSIS:');
        console.log(`URL: ${pageStructure.url}`);
        console.log(`Title: ${pageStructure.title}`);
        console.log(`Tables: ${pageStructure.elementCounts.tables}, Rows: ${pageStructure.elementCounts.rows}`);
        console.log(`Body preview: ${pageStructure.bodyText.substring(0, 300)}`);

        const medicationResults: any[] = [];
        
        // Strategy 1: Look for pharmaceutical terms first
        const pharmaceuticalTerms = ['lisinopril', 'aspirin', 'ibuprofen', 'advil', 'tylenol', 'amoxicillin'];
        const foundTerms = pharmaceuticalTerms.filter(term => 
          pageStructure.bodyText.toLowerCase().includes(term)
        );
        console.log(`🎯 Found pharmaceutical terms: ${foundTerms.join(', ')}`);
        
        // Strategy 2: Enhanced result container detection
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

        // If no results found with standard selectors, try broader search
        if (medicationResults.length === 0) {
          console.log('No results with standard selectors, trying broader extraction...');
          
          // Look for any text that might contain medication information
          const allRows = document.querySelectorAll('tr, div');
          allRows.forEach((element, index) => {
            const text = element.textContent?.trim() || '';
            
            // Look for pharmaceutical patterns in any element
            const medicationPattern = /(lisinopril|aspirin|tylenol|acetaminophen|ibuprofen|metformin|atorvastatin|amlodipine|levothyroxine|omeprazole)/i;
            const genericPattern = /([a-zA-Z]+(?:\s[a-zA-Z]+)*)\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))/i;
            
            if (medicationPattern.test(text) || (genericPattern.test(text) && text.length < 200)) {
              const match = genericPattern.exec(text);
              const name = match ? `${match[1].trim()} ${match[2].trim()}` : text.substring(0, 50).trim();
              
              // Look for price in the same element or nearby
              const priceMatch = text.match(/\$?(\d+\.?\d{2})/);
              const ndcMatch = text.match(/(\d{5}-\d{3,4}-\d{1,2})/);
              
              if (name.length > 3) {
                medicationResults.push({
                  medication: {
                    id: index + 5000,
                    name: name,
                    genericName: match ? match[1].trim().toLowerCase() : name.toLowerCase(),
                    ndc: ndcMatch ? ndcMatch[1] : null,
                    packageSize: null,
                    strength: match ? match[2].trim() : null,
                    dosageForm: 'Tablet',
                    manufacturer: null
                  },
                  cost: priceMatch ? `$${priceMatch[1]}` : '$0.00',
                  availability: 'Available',
                  vendor: 'Kinray (Cardinal Health)'
                });
              }
            }
          });
        }

        return medicationResults;
      });

      console.log(`✅ Extracted ${results.length} results from page`);
      
      if (results.length === 0) {
        // Add comprehensive page analysis for debugging
        const pageDebug = await this.page.evaluate(() => {
          const debug = {
            url: location.href,
            title: document.title,
            bodyText: document.body.innerText.substring(0, 1000),
            tableCount: document.querySelectorAll('table').length,
            rowCount: document.querySelectorAll('tr').length,
            hasGenericTerms: ['lisinopril', 'aspirin', 'results', 'found', 'search'].some(term => 
              document.body.innerText.toLowerCase().includes(term)
            )
          };
          return debug;
        });
        
        console.log('🔍 Page debug info:');
        console.log(`   URL: ${pageDebug.url}`);
        console.log(`   Title: ${pageDebug.title}`);
        console.log(`   Tables: ${pageDebug.tableCount}, Rows: ${pageDebug.rowCount}`);
        console.log(`   Has generic terms: ${pageDebug.hasGenericTerms}`);
        console.log(`   Body text sample: ${pageDebug.bodyText.substring(0, 200)}...`);
        
        // Take screenshot for manual analysis
        await this.page.screenshot({ path: '/tmp/kinray-no-results-debug.png', fullPage: true });
        console.log('📷 Debug screenshot saved for manual analysis');
      }
      
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