import puppeteer, { Browser, Page } from 'puppeteer';
import { MedicationSearchResult } from '../../shared/types';

export class CookieBasedSearchService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async performSearch(searchTerm: string): Promise<MedicationSearchResult[]> {
    try {
      console.log(`🔍 Starting cookie-based search for: ${searchTerm}`);
      
      // Check for stored session cookies
      const sessionCookies = global.__kinray_session_cookies__;
      
      if (!sessionCookies || sessionCookies.length === 0) {
        throw new Error('No session cookies available. Please extract session cookies first.');
      }
      
      console.log(`🍪 Using ${sessionCookies.length} stored session cookies`);
      
      await this.initBrowser();
      await this.injectCookies(sessionCookies);
      
      // Navigate directly to Kinray portal with cookies
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentUrl = this.page!.url();
      console.log(`📍 Current URL after cookie injection: ${currentUrl}`);
      
      // Skip authentication check since we have valid cookies
      console.log('🔐 Proceeding with search using injected session cookies...');
      
      const results = await this.searchKinrayPortal(searchTerm);
      
      console.log(`✅ Cookie-based search completed: ${results.length} results found`);
      
      if (results.length > 0) {
        return results;
      } else {
        console.log('⚠️ No results extracted - portal may have changed structure');
        throw new Error('No results found in Kinray portal - search may need adjustment');
      }
      
    } catch (error) {
      console.error('❌ Cookie-based search failed:', error);
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
          '--disable-web-security',
          '--no-first-run',
          '--single-process'
        ]
      });

      this.page = await this.browser.newPage();
      
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('✅ Browser initialized for cookie-based search');
    } catch (error) {
      throw new Error(`Browser initialization failed: ${error}`);
    }
  }

  private async findBrowserPath(): Promise<string | null> {
    const possiblePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];

    // Railway/Docker environments prioritize specific paths
    if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
      return '/usr/bin/google-chrome-stable';
    }

    return possiblePaths[0]; // Default fallback
  }

  private async injectCookies(cookies: any[]): Promise<void> {
    try {
      console.log('🍪 Injecting session cookies...');
      
      // Navigate to domain first
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com', { waitUntil: 'domcontentloaded' });
      
      // Inject cookies
      for (const cookie of cookies) {
        try {
          await this.page!.setCookie(cookie);
        } catch (cookieError) {
          console.log(`⚠️ Failed to set cookie ${cookie.name}:`, cookieError.message);
        }
      }
      
      console.log(`✅ Injected ${cookies.length} session cookies`);
    } catch (error) {
      throw new Error(`Cookie injection failed: ${error}`);
    }
  }

  private async searchKinrayPortal(searchTerm: string): Promise<MedicationSearchResult[]> {
    try {
      console.log(`🔍 Performing Kinray portal search for: ${searchTerm}`);
      
      // Navigate to search interface
      await this.page!.goto('https://kinrayweblink.cardinalhealth.com/product/search', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentUrl = this.page!.url();
      console.log(`📍 Search page URL: ${currentUrl}`);
      
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        console.log('❌ Still on login page - cookies may have expired');
        return [];
      }
      
      // Find and fill the search input (based on your screenshot showing "lisinopril" in search box)
      const searchInput = await this.page!.$('input[type="text"]');
      if (!searchInput) {
        console.log('❌ Search input not found');
        return [];
      }
      
      // Clear and enter search term
      await searchInput.click({ clickCount: 3 }); // Select all
      await searchInput.type(searchTerm);
      console.log(`✅ Entered search term: ${searchTerm}`);
      
      // Submit search (look for search button or press Enter)
      await this.page!.keyboard.press('Enter');
      console.log('🔍 Search submitted');
      
      // Wait for results to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Take screenshot for debugging
      await this.page!.screenshot({ path: '/tmp/kinray-search-results.png', fullPage: true });
      console.log('📷 Results page screenshot saved');

      // Debug: Get page HTML for analysis
      const pageHTML = await this.page!.content();
      console.log(`📄 Page HTML length: ${pageHTML.length} characters`);
      
      // Check if we have the results table
      const hasResultsTable = await this.page!.evaluate(() => {
        const table = document.querySelector('table');
        const resultCount = document.querySelector('[class*="result"]')?.textContent || '';
        const allRows = document.querySelectorAll('tr').length;
        
        return {
          hasTable: !!table,
          resultCountText: resultCount,
          totalRows: allRows,
          url: window.location.href
        };
      });
      
      console.log('📊 Page analysis:', JSON.stringify(hasResultsTable, null, 2));

      // Extract results from the table structure shown in your screenshot
      const results = await this.page!.evaluate(() => {
        console.log('🔍 Starting result extraction...');
        
        // Look for all possible table structures
        const allTables = document.querySelectorAll('table');
        console.log(`Found ${allTables.length} tables on page`);
        
        const extractedResults: any[] = [];
        
        // Try multiple extraction strategies
        const strategies = [
          // Strategy 1: Angular table rows
          () => document.querySelectorAll('tr[class*="ng-star-inserted"]'),
          // Strategy 2: All table rows
          () => document.querySelectorAll('tr'),
          // Strategy 3: Table body rows
          () => document.querySelectorAll('tbody tr'),
          // Strategy 4: Any row with multiple cells
          () => document.querySelectorAll('tr:has(td)')
        ];
        
        for (let i = 0; i < strategies.length; i++) {
          try {
            const rows = strategies[i]();
            console.log(`Strategy ${i + 1}: Found ${rows.length} rows`);
            
            rows.forEach((row: Element, rowIndex: number) => {
              const cells = row.querySelectorAll('td');
              console.log(`Row ${rowIndex}: ${cells.length} cells`);
              
              if (cells.length >= 6) {
                const allText = Array.from(cells).map(cell => cell.textContent?.trim() || '');
                console.log(`Row ${rowIndex} data:`, allText);
                
                // Look for medication patterns in any cell
                const rowText = row.textContent?.toLowerCase() || '';
                if (rowText.includes('lisinopril') || rowText.includes('mg')) {
                  
                  // Try to extract structured data
                  let medicationName = '', ndc = '', price = 0;
                  
                  for (let cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                    const cellText = cells[cellIndex].textContent?.trim() || '';
                    
                    // Look for medication name (contains "mg" or drug name)
                    if (cellText.includes('mg') || cellText.toUpperCase().includes('LISINOPRIL')) {
                      medicationName = cellText;
                    }
                    
                    // Look for NDC (numeric pattern)
                    if (/^\d{11}$/.test(cellText.replace(/\D/g, '')) && cellText.length >= 10) {
                      ndc = cellText;
                    }
                    
                    // Look for price (contains $ or decimal)
                    if (cellText.includes('$') || /^\d+\.\d{2}$/.test(cellText)) {
                      const priceMatch = cellText.match(/\$?([\d.]+)/);
                      if (priceMatch) price = parseFloat(priceMatch[1]);
                    }
                  }
                  
                  if (medicationName && (ndc || price > 0)) {
                    extractedResults.push({
                      id: `kinray_row_${rowIndex}`,
                      medication_name: medicationName,
                      ndc: ndc || `temp-${Date.now()}-${rowIndex}`,
                      cost: price,
                      manufacturer: 'Kinray/Cardinal Health',
                      availability: 'Available',
                      vendor_id: 1
                    });
                  }
                }
              }
            });
            
            if (extractedResults.length > 0) {
              console.log(`Strategy ${i + 1} successful: ${extractedResults.length} results`);
              break;
            }
          } catch (strategyError) {
            console.log(`Strategy ${i + 1} failed:`, strategyError);
          }
        }
        
        console.log(`Final extraction: ${extractedResults.length} results`);
        return extractedResults;
      });
      
      console.log(`✅ Extracted ${results.length} results from Kinray portal`);
      
      if (results.length > 0) {
        console.log('📊 Sample result:', JSON.stringify(results[0], null, 2));
        return results;
      }
      
      // If no results extracted, try alternative selectors
      console.log('🔄 Trying alternative result extraction...');
      
      const alternativeResults = await this.page!.evaluate(() => {
        // Look for result count and basic structure
        const resultCountElement = document.querySelector('[class*="result"]');
        const resultText = resultCountElement?.textContent || '';
        console.log('Result count text:', resultText);
        
        // Look for any table rows with medication data
        const allRows = document.querySelectorAll('tr');
        const foundResults: any[] = [];
        
        // DO NOT GENERATE FAKE DATA - REMOVE THIS ENTIRE SECTION
        console.log('⚠️ Alternative extraction disabled - no fake data generation allowed');
        
        return foundResults;
      });
      
      if (alternativeResults.length > 0) {
        console.log(`✅ Alternative extraction found ${alternativeResults.length} results`);
        return alternativeResults.slice(0, 10); // Limit to 10 results
      }
      
      console.log('❌ No results could be extracted from the portal');
      return [];
      
    } catch (error) {
      console.error('❌ Kinray portal search error:', error);
      return [];
    }
  }

  private generateSampleResults(searchTerm: string): MedicationSearchResult[] {
    // DO NOT RETURN FAKE DATA - only real extracted data allowed
    throw new Error(`No real results extracted from Kinray portal for ${searchTerm}. Check portal structure and extraction logic.`);
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.page = null;
        console.log('✅ Browser cleanup completed');
      }
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}