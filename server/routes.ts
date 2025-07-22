import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapingService } from "./services/scraper";
import { csvExportService } from "./services/csv-export";
import { LiveSearchService } from "./services/live-search-service";
import { insertCredentialSchema, insertSearchSchema, MedicationSearchResult } from "@shared/schema";
import { z } from "zod";

// Generate authentic Kinray pricing data using REAL NDCs from portal screenshots
function generateDemoResults(searchTerm: string, searchType: string, vendorName: string): MedicationSearchResult[] {
  // Demo data generation DISABLED - only authentic portal data allowed
  console.log(`❌ Demo data generation disabled for ${searchTerm}. Only live Kinray portal scraping allowed.`);
  return [];
  
  // Real NDCs and pricing from authentic Kinray portal screenshots
  if (searchTerm.toLowerCase() === "atorvastatin") {
    return [
      {
        medication: {
          id: 0,
          name: "ATORVASTATIN TB 10MG 100",
          genericName: "atorvastatin",
          ndc: "68180001001", // Real NDC from your screenshot
          packageSize: "100 EA",
          strength: "10mg",
          dosageForm: "Tablet",
          manufacturer: "Aurobindo Pharma",
        },
        cost: "55.25",
        availability: "available",
        vendor: "Kinray Portal",
      },
      {
        medication: {
          id: 0,
          name: "ATORVASTATIN TB 20MG 100",
          genericName: "atorvastatin",
          ndc: "68180001002", // Real NDC from your screenshot  
          packageSize: "100 EA",
          strength: "20mg",
          dosageForm: "Tablet",
          manufacturer: "Aurobindo Pharma",
        },
        cost: "57.80",
        availability: "available",
        vendor: "Kinray Portal",
      },
      {
        medication: {
          id: 0,
          name: "ATORVASTATIN TB 5MG 500",
          genericName: "atorvastatin",
          ndc: "68180001003", // Real NDC from your screenshot
          packageSize: "500 EA",
          strength: "5mg",
          dosageForm: "Tablet",
          manufacturer: "Aurobindo Pharma",
        },
        cost: "512.40",
        availability: "available",
        vendor: "Kinray Portal",
      },
    ];
  }

  // For other medications including lisinopril, return results with proper format
  // but indicate these need real portal scraping
  const medicationResults = [
    {
      medication: {
        id: 0,
        name: `${searchTerm.toUpperCase()} TB 10MG 100`,
        genericName: searchTerm.toLowerCase(),
        ndc: "PENDING_REAL_SCRAPE",
        packageSize: "100 EA",
        strength: "10mg",
        dosageForm: "Tablet",
      },
      cost: "PENDING",
      availability: "requires_portal_access",
      vendor: "Kinray Portal - Authentication Required",
    },
  ];

  return medicationResults;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Vendors endpoints
  app.get("/api/vendors", async (req, res) => {
    try {
      const vendors = await storage.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // Credentials endpoints
  app.get("/api/credentials", async (req, res) => {
    try {
      const credentials = await storage.getCredentials();
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  app.post("/api/credentials", async (req, res) => {
    try {
      const credential = insertCredentialSchema.parse(req.body);
      const newCredential = await storage.createCredential(credential);
      res.json(newCredential);
    } catch (error) {
      res.status(500).json({ message: "Failed to save credentials" });
    }
  });

  // Cookie injection endpoint
  app.post('/api/inject-cookies', async (req, res) => {
    try {
      const { cookies } = req.body;
      
      if (!cookies || !Array.isArray(cookies)) {
        return res.status(400).json({ error: 'Invalid cookie data' });
      }
      
      console.log(`🍪 Received ${cookies.length} cookies for injection`);
      
      // Store cookies globally for use in searches
      (global as any).__kinray_session_cookies__ = cookies;
      
      res.json({ success: true, message: 'Session cookies stored successfully' });
    } catch (error) {
      console.error('Cookie injection error:', error);
      res.status(500).json({ error: 'Failed to inject cookies' });
    }
  });

  app.post("/api/credentials/test-connection", async (req, res) => {
    try {
      const { vendorId, username, password } = req.body;
      
      if (!vendorId || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: vendorId, username, password" 
        });
      }

      const vendor = await storage.getVendor(vendorId);
      if (!vendor) {
        return res.status(404).json({ 
          success: false, 
          message: "Vendor not found" 
        });
      }

      const credential = { id: 0, vendorId, username, password, lastValidated: null, isActive: true };
      
      console.log(`Testing connection to ${vendor.name} at ${vendor.portalUrl}`);
      
      let responseData;
      try {
        const loginSuccess = await scrapingService.login(vendor, credential);
        
        if (loginSuccess) {
          responseData = { 
            success: true, 
            message: `Successfully connected to ${vendor.name} portal and logged in` 
          };
        } else {
          responseData = { 
            success: false, 
            message: `Failed to login to ${vendor.name} portal - please check credentials` 
          };
        }
      } catch (error: any) {
        console.error(`Connection test failed for ${vendor.name}:`, error);
        responseData = { 
          success: false, 
          message: `Connection failed: ${error.message}` 
        };
      } finally {
        try {
          await scrapingService.cleanup();
        } catch (cleanupError) {
          console.error('Connection test cleanup error:', cleanupError);
        }
      }
      
      // Send response only after cleanup is complete
      res.json(responseData);
    } catch (error) {
      console.error("Connection test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error during connection test" 
      });
    }
  });

  // Search endpoints
  app.post("/api/search", async (req, res) => {
    try {
      const searchFormData = z.object({
        vendorId: z.number(),
        searchTerm: z.string().min(1),
        searchType: z.enum(['name', 'ndc', 'generic']),
      }).parse(req.body);
      
      const searchData = {
        ...searchFormData,
        status: "pending",
        resultCount: 0,
      };
      
      // Create search record
      const search = await storage.createSearch({
        ...searchData,
        status: "pending",
        resultCount: 0,
      });

      // Start search in background immediately - use setTimeout for better stability
      setTimeout(() => {
        performLiveSearch(search.id, searchData).catch(error => {
          console.error(`Background search ${search.id} failed:`, error);
          storage.updateSearch(search.id, { 
            status: 'failed', 
            completedAt: new Date() 
          }).catch(() => {});
        });
      }, 10);

      res.json({ searchId: search.id });
    } catch (error: any) {
      res.status(500).json({ 
        message: "Failed to start search",
        error: error.message
      });
    }
  });

  app.get("/api/search/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🔍 API: Fetching search ${id}`);
      const searchWithResults = await storage.getSearchWithResults(id);
      
      if (!searchWithResults) {
        console.log(`❌ API: Search ${id} not found`);
        return res.status(404).json({ message: "Search not found" });
      }

      console.log(`✅ API: Returning search ${id} with ${searchWithResults.results.length} results`);
      res.json(searchWithResults);
    } catch (error) {
      console.error(`❌ API: Failed to fetch search ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch search" });
    }
  });

  app.get("/api/search/:id/results", async (req, res) => {
    try {
      const searchId = parseInt(req.params.id);
      const results = await storage.getSearchResults(searchId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch search results" });
    }
  });

  app.get("/api/searches", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const searches = await storage.getSearches(limit);
      res.json(searches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch searches" });
    }
  });

  app.get("/api/search/:id/export", async (req, res) => {
    try {
      const searchId = parseInt(req.params.id);
      const searchWithResults = await storage.getSearchWithResults(searchId);
      
      if (!searchWithResults) {
        return res.status(404).json({ message: "Search not found" });
      }

      const csvData = csvExportService.exportSearchResults(searchWithResults.results);
      const filename = csvExportService.generateFileName(searchWithResults.searchTerm);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export search results" });
    }
  });

  // Activity log endpoints
  app.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getActivityLogs(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // Railway health check endpoint - CRITICAL for load balancer
  app.get("/health", (req, res) => {
    const response = { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'PharmaCost Pro',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 'undefined',
      railway_env: process.env.RAILWAY_ENVIRONMENT || 'undefined',
      host: req.get('host'),
      url: req.url
    };
    
    console.log(`Health check hit from ${req.ip} - responding with port ${response.port}`);
    res.status(200).json(response);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Medications endpoints
  app.get("/api/medications", async (req, res) => {
    try {
      const medications = await storage.getMedications();
      res.json(medications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });

  // Cookie injection endpoint
  app.post('/api/inject-cookies', async (req, res) => {
    try {
      const { cookies } = req.body;
      
      if (!cookies || !Array.isArray(cookies)) {
        return res.status(400).json({ error: 'Invalid cookies format' });
      }

      // Store cookies globally for scraper access
      (global as any).__kinray_session_cookies__ = cookies;
      
      console.log(`🍪 Session cookies stored globally: ${cookies.length} cookies`);
      cookies.forEach(cookie => {
        console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
      });

      res.json({ 
        success: true, 
        message: `Successfully stored ${cookies.length} session cookies`,
        cookieCount: cookies.length
      });
    } catch (error) {
      console.error('Cookie injection error:', error);
      res.status(500).json({ error: 'Failed to inject cookies' });
    }
  });

  // Cookie status endpoint
  app.get('/api/cookie-status', async (req, res) => {
    const globalCookies = (global as any).__kinray_session_cookies__;
    const hasSessionCookies = globalCookies && 
                              Array.isArray(globalCookies) && 
                              globalCookies.length > 0;
    
    res.json({
      hasSessionCookies,
      cookieCount: hasSessionCookies ? globalCookies.length : 0,
      timestamp: new Date().toISOString()
    });
  });

  // Automatic cookie extraction endpoint
  app.post('/api/extract-cookies', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required for automatic cookie extraction' });
      }

      console.log('🍪 Starting automatic cookie extraction...');
      
      // Try simple extractor first (more reliable)
      try {
        const { simpleCookieExtractor } = await import('./services/simple-cookie-extractor.js');
        const extractedCookies = await simpleCookieExtractor.extractSessionCookies(username, password);
        
        if (extractedCookies.length > 0) {
          // Success with simple extractor
          (global as any).__kinray_session_cookies__ = extractedCookies;
          
          console.log(`✅ Simple extractor: ${extractedCookies.length} cookies`);
          
          return res.json({
            success: true,
            message: `Successfully extracted and injected ${extractedCookies.length} session cookies`,
            cookieCount: extractedCookies.length,
            cookies: extractedCookies.map(c => ({ name: c.name, domain: c.domain }))
          });
        }
      } catch (simpleError) {
        console.log('⚠️ Simple extractor failed, trying advanced...');
      }
      
      // Fallback to advanced extractor
      const { cookieExtractor } = await import('./services/cookie-extractor.js');
      const extractedCookies = await cookieExtractor.extractSessionCookies(username, password);
      
      if (extractedCookies.length > 0) {
        // Automatically inject the extracted cookies
        (global as any).__kinray_session_cookies__ = extractedCookies;
        
        console.log(`✅ Automatically extracted and injected ${extractedCookies.length} session cookies`);
        
        res.json({
          success: true,
          message: `Successfully extracted and injected ${extractedCookies.length} session cookies`,
          cookieCount: extractedCookies.length,
          cookies: extractedCookies.map(c => ({ name: c.name, domain: c.domain }))
        });
      } else {
        res.status(400).json({ 
          error: 'No relevant cookies extracted from authentication session',
          message: 'Login may have failed or 2FA required'
        });
      }
    } catch (error) {
      console.error('❌ Automatic cookie extraction failed:', error);
      res.status(500).json({ 
        error: 'Cookie extraction failed', 
        message: error.message,
        suggestion: 'Try manual cookie injection or check credentials'
      });
    }
  });

  // Live search function using direct credential-based authentication
  async function performLiveSearch(searchId: number, searchData: any): Promise<void> {
    console.log(`🔥 performLiveSearch STARTED for search ${searchId} - "${searchData.searchTerm}"`);
    
    try {
      console.log(`🔍 Starting live credential-based search ${searchId} for "${searchData.searchTerm}"`);

      // Update search status
      await storage.updateSearch(searchId, { status: "in_progress" });
      console.log(`📊 Updated search ${searchId} status to in_progress`);

      // Get credentials (prioritize environment variables)
      let credentials = null;
      if (process.env.KINRAY_USERNAME && process.env.KINRAY_PASSWORD) {
        credentials = {
          username: process.env.KINRAY_USERNAME,
          password: process.env.KINRAY_PASSWORD
        };
        console.log(`✅ Using environment credentials for Kinray portal - user: ${credentials.username}`);
      } else {
        const storedCredential = await storage.getCredentialByVendorId(searchData.vendorId);
        if (storedCredential) {
          credentials = {
            username: storedCredential.username,
            password: storedCredential.password
          };
          console.log(`✅ Using stored credentials for Kinray portal - user: ${credentials.username}`);
        }
      }

      if (!credentials) {
        throw new Error('No valid credentials found for Kinray portal');
      }

      // Perform live search with direct credentials
      console.log(`🚀 Creating LiveSearchService instance...`);
      const liveSearchService = new LiveSearchService();
      console.log(`🎯 Executing live search with fresh authentication...`);
      
      const results = await liveSearchService.performLiveSearch(
        credentials,
        searchData.searchTerm,
        searchData.searchType
      );

      console.log(`✅ Live search completed - found ${results.length} results`);

      // Save results to storage
      for (const result of results) {
        let medication = await storage.getMedicationByNdc(result.medication.ndc || '');
        
        if (!medication) {
          medication = await storage.createMedication(result.medication);
        }

        await storage.createSearchResult({
          searchId,
          medicationId: medication.id,
          vendorId: searchData.vendorId,
          cost: result.cost,
          availability: result.availability,
        });
      }

      // Update search completion
      await storage.updateSearch(searchId, {
        status: "completed",
        resultCount: results.length,
        completedAt: new Date(),
      });

      console.log(`✅ Search ${searchId} completed with ${results.length} results`);

      // Log success
      await storage.createActivityLog({
        action: "search",
        status: "success",
        description: `Live search completed for "${searchData.searchTerm}" - ${results.length} results found`,
        vendorId: searchData.vendorId,
        searchId,
      });

    } catch (error: any) {
      console.error(`❌ Live search ${searchId} failed:`, error);
      console.error(`❌ Error stack:`, error.stack);
      
      await storage.updateSearch(searchId, { 
        status: "failed", 
        completedAt: new Date() 
      });

      await storage.createActivityLog({
        action: "search",
        status: "failure",
        description: `Live search failed for "${searchData.searchTerm}": ${error.message}`,
        vendorId: searchData.vendorId,
        searchId,
      });
    }
    
    console.log(`🏁 performLiveSearch FINISHED for search ${searchId}`);
  }

  // Async function to perform the actual search
  async function performSearch(searchId: number, searchData: any) {
    try {
      console.log(`🔍 Starting search ${searchId} for "${searchData.searchTerm}"`);
      console.log(`📊 Search data:`, JSON.stringify(searchData, null, 2));
      
      // Update search status
      await storage.updateSearch(searchId, { status: "in_progress" });
      console.log(`✅ Updated search ${searchId} status to in_progress`);

      // Get vendor and credentials
      console.log(`📊 Getting vendor for ID: ${searchData.vendorId}`);
      const vendor = await storage.getVendor(searchData.vendorId);
      
      if (!vendor) {
        console.log(`❌ Vendor not found for ID: ${searchData.vendorId}`);
        throw new Error("Vendor not found");
      }
      
      console.log(`✅ Found vendor: ${vendor.name}`);

      let credential = null;
      
      // Use real Kinray credentials from environment variables if available
      if (vendor.name.includes('Kinray') && process.env.KINRAY_USERNAME && process.env.KINRAY_PASSWORD) {
        credential = {
          id: 1,
          vendorId: searchData.vendorId,
          username: process.env.KINRAY_USERNAME,
          password: process.env.KINRAY_PASSWORD,
          lastValidated: null,
          isActive: true
        };
      } else {
        credential = await storage.getCredentialByVendorId(searchData.vendorId);
      }

      if (!credential) {
        console.log(`❌ No credentials found for vendor ${vendor.name}`);
        throw new Error("No credentials found for vendor");
      }
      
      console.log(`✅ Using credentials for ${vendor.name} - username: ${credential.username}`);

      let results: MedicationSearchResult[] = [];

      try {
        // Check browser automation availability first
        console.log(`🔍 Checking browser automation availability...`);
        const browserAvailable = await scrapingService.checkBrowserAvailability();
        console.log(`📊 Browser automation available: ${browserAvailable}`);
        
        if (!browserAvailable) {
          throw new Error('Browser automation not available in Railway deployment environment. This requires a platform with Chrome/Puppeteer support.');
        }
        
        // Attempt real scraping with detailed logging
        console.log(`🚀 Attempting login to ${vendor.name}...`);
        const loginSuccess = await scrapingService.login(vendor, credential);
        
        if (!loginSuccess) {
          throw new Error(`Authentication failed for ${vendor.name}. Please check your credentials and try again.`);
        } else {
          console.log(`✅ Login successful to ${vendor.name} - proceeding with search...`);
          
          // Perform actual search with timeout
          const searchTimeout = new Promise<MedicationSearchResult[]>((_, reject) => {
            setTimeout(() => reject(new Error('Search timeout after 20 seconds')), 20000);
          });
          
          try {
            console.log(`🔍 Calling searchMedication for "${searchData.searchTerm}" (${searchData.searchType})`);
            results = await Promise.race([
              scrapingService.searchMedication(searchData.searchTerm, searchData.searchType),
              searchTimeout
            ]);
            
            console.log(`📊 Search completed - received ${results?.length || 0} results`);
            if (results && results.length > 0) {
              console.log(`🎯 Successfully extracted ${results.length} live results from ${vendor.name}`);
              console.log(`📋 Sample result:`, JSON.stringify(results[0], null, 2));
            } else {
              console.log(`⚠️ Search completed but no results found in ${vendor.name} portal`);
              console.log(`📊 Debug: results object type:`, typeof results, 'value:', results);
              results = [];
            }
          } catch (timeoutError) {
            console.log(`⏰ Search timed out after 20 seconds`);
            throw new Error(`Search timeout - ${vendor.name} portal did not respond within expected time`);
          }
        }
      } catch (scrapingError: any) {
        console.log(`❌ Scraping error: ${scrapingError.message}`);
        throw scrapingError;
      }

      console.log(`🔍 Generated ${results.length} results for search ${searchId}`);

      // Save results to storage
      for (const result of results) {
        // Create medication if it doesn't exist
        let medication = await storage.getMedicationByNdc(result.medication.ndc || '');
        
        if (!medication) {
          medication = await storage.createMedication(result.medication);
        }

        // Create search result
        await storage.createSearchResult({
          searchId,
          medicationId: medication.id,
          vendorId: searchData.vendorId,
          cost: result.cost,
          availability: result.availability,
        });
      }

      // Update search completion
      await storage.updateSearch(searchId, {
        status: "completed",
        resultCount: results.length,
        completedAt: new Date(),
      });

      console.log(`✅ Search ${searchId} completed with ${results.length} results`);

      // Log success
      await storage.createActivityLog({
        action: "search",
        status: "success",
        description: `Search completed for "${searchData.searchTerm}" - ${results.length} results found`,
        vendorId: searchData.vendorId,
        searchId,
      });

    } catch (error: any) {
      console.error("Search failed:", error);
      console.error("Error stack:", error.stack);
      
      // Update search status
      await storage.updateSearch(searchId, { status: "failed" });
      console.log(`✅ Updated search ${searchId} status to failed`);

      // Log failure
      await storage.createActivityLog({
        action: "search",
        status: "failure",
        description: `Search failed for "${searchData.searchTerm}": ${error.message || error}`,
        vendorId: searchData.vendorId,
        searchId,
      });
    } finally {
      await scrapingService.cleanup();
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}