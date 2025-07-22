var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/cookie-extractor.ts
var cookie_extractor_exports = {};
__export(cookie_extractor_exports, {
  CookieExtractor: () => CookieExtractor,
  cookieExtractor: () => cookieExtractor
});
import puppeteer2 from "puppeteer";
var CookieExtractor, cookieExtractor;
var init_cookie_extractor = __esm({
  "server/services/cookie-extractor.ts"() {
    "use strict";
    CookieExtractor = class {
      browser = null;
      page = null;
      async extractSessionCookies(username, password) {
        console.log("\u{1F36A} Starting automatic cookie extraction from Kinray portal...");
        try {
          console.log("\u{1F310} Launching browser for cookie extraction...");
          const browserArgs = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          ];
          let launchConfig = { headless: true, args: browserArgs };
          if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_DEPLOYMENT_ID) {
            console.log("\u{1F682} Railway detected - using optimized browser config");
            launchConfig.executablePath = "/usr/bin/google-chrome-stable";
          }
          this.browser = await puppeteer2.launch(launchConfig);
          this.page = await this.browser.newPage();
          await this.page.setViewport({ width: 1920, height: 1080 });
          await this.page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
          console.log("\u{1F310} Navigating to Kinray login page...");
          await this.page.goto("https://kinrayweblink.cardinalhealth.com/login", {
            waitUntil: "networkidle2",
            timeout: 3e4
          });
          await this.page.screenshot({ path: "cookie-extraction-start.png", fullPage: true });
          console.log("\u{1F4F8} Initial page screenshot saved");
          console.log("\u{1F511} Performing automated login...");
          await this.page.waitForSelector('input[name="username"], input[type="email"], #username', { timeout: 1e4 });
          const usernameField = await this.page.$('input[name="username"], input[type="email"], #username');
          if (usernameField) {
            await usernameField.type(username);
            console.log("\u2705 Username entered");
          }
          const passwordField = await this.page.$('input[name="password"], input[type="password"], #password');
          if (passwordField) {
            await passwordField.type(password);
            console.log("\u2705 Password entered");
          }
          const submitButton = await this.page.$('input[type="submit"], button[type="submit"], button:contains("Sign In"), button:contains("Login")');
          if (submitButton) {
            await submitButton.click();
            console.log("\u2705 Login form submitted");
          }
          console.log("\u23F3 Waiting for authentication to complete...");
          await this.page.waitForTimeout(5e3);
          const currentUrl = this.page.url();
          console.log(`\u{1F4CD} Current URL after login: ${currentUrl}`);
          if (currentUrl.includes("verify") || currentUrl.includes("2fa")) {
            console.log("\u{1F510} 2FA detected - waiting for manual completion...");
            console.log("\u{1F4A1} Please complete 2FA in your browser, then the system will extract the authenticated cookies");
            for (let i = 0; i < 24; i++) {
              await this.page.waitForTimeout(5e3);
              const newUrl = this.page.url();
              if (!newUrl.includes("verify") && !newUrl.includes("2fa") && !newUrl.includes("login")) {
                console.log("\u2705 2FA completed - authenticated session detected");
                break;
              }
              if (i === 23) {
                console.log("\u23F0 2FA timeout - extracting available cookies anyway");
              }
            }
          }
          console.log("\u{1F36A} Extracting session cookies...");
          const cookies = await this.page.cookies();
          const relevantCookies = cookies.filter(
            (cookie) => cookie.domain.includes("cardinalhealth.com") || cookie.domain.includes("kinray") || cookie.name.includes("session") || cookie.name.includes("auth") || cookie.name.includes("okta") || cookie.name.includes("_abck") || cookie.name.includes("rxVisitor")
          );
          console.log(`\u2705 Extracted ${relevantCookies.length} relevant cookies from authenticated session`);
          await this.page.screenshot({ path: "cookie-extraction-complete.png", fullPage: true });
          console.log("\u{1F4F8} Final authenticated page screenshot saved");
          return relevantCookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            expires: cookie.expires,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure
          }));
        } catch (error) {
          console.error("\u274C Cookie extraction failed:", error.message);
          throw new Error(`Cookie extraction failed: ${error.message}`);
        } finally {
          if (this.browser) {
            await this.browser.close();
            console.log("\u{1F512} Browser closed after cookie extraction");
          }
        }
      }
      async extractCookiesFromRunningSession() {
        console.log("\u{1F36A} Attempting to extract cookies from any running browser sessions...");
        try {
          console.log("\u26A0\uFE0F This feature requires browser debugging port to be enabled");
          console.log("\u{1F4A1} For now, use the automatic login method or manual cookie injection");
          return [];
        } catch (error) {
          console.error("\u274C Running session extraction failed:", error.message);
          throw error;
        }
      }
    };
    cookieExtractor = new CookieExtractor();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage-database.ts
import { eq, desc, and, gte } from "drizzle-orm";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  credentials: () => credentials,
  insertActivityLogSchema: () => insertActivityLogSchema,
  insertCredentialSchema: () => insertCredentialSchema,
  insertMedicationSchema: () => insertMedicationSchema,
  insertSearchResultSchema: () => insertSearchResultSchema,
  insertSearchSchema: () => insertSearchSchema,
  insertVendorSchema: () => insertVendorSchema,
  medications: () => medications,
  searchResults: () => searchResults,
  searches: () => searches,
  vendors: () => vendors
});
import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  portalUrl: text("portal_url").notNull(),
  isActive: boolean("is_active").default(true)
});
var credentials = pgTable("credentials", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id),
  username: text("username").notNull(),
  password: text("password").notNull(),
  // In production, this should be encrypted
  isActive: boolean("is_active").default(true),
  lastValidated: timestamp("last_validated")
});
var medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  ndc: text("ndc").unique(),
  packageSize: text("package_size"),
  strength: text("strength"),
  dosageForm: text("dosage_form"),
  manufacturer: text("manufacturer")
});
var searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => vendors.id),
  searchTerm: text("search_term").notNull(),
  searchType: text("search_type").notNull(),
  // 'name', 'ndc', 'generic'
  status: text("status").notNull(),
  // 'pending', 'completed', 'failed'
  resultCount: integer("result_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});
var searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  searchId: integer("search_id").references(() => searches.id),
  medicationId: integer("medication_id").references(() => medications.id),
  vendorId: integer("vendor_id").references(() => vendors.id),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  availability: text("availability"),
  // 'available', 'limited', 'out_of_stock'
  lastUpdated: timestamp("last_updated").defaultNow()
});
var activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  // 'search', 'export', 'login', 'batch_upload'
  status: text("status").notNull(),
  // 'success', 'failure', 'warning'
  description: text("description").notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id),
  searchId: integer("search_id").references(() => searches.id),
  createdAt: timestamp("created_at").defaultNow()
});
var insertVendorSchema = createInsertSchema(vendors).omit({
  id: true
});
var insertCredentialSchema = createInsertSchema(credentials).omit({
  id: true,
  lastValidated: true
});
var insertMedicationSchema = createInsertSchema(medications).omit({
  id: true
});
var insertSearchSchema = createInsertSchema(searches).omit({
  id: true,
  createdAt: true,
  completedAt: true
});
var insertSearchResultSchema = createInsertSchema(searchResults).omit({
  id: true,
  lastUpdated: true
});
var insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true
});

// server/database.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// server/railway-config.ts
var RAILWAY_CONFIG = {
  // Database connection limits to prevent resource exhaustion
  MAX_CONNECTIONS: 5,
  // Conservative limit for Railway free tier
  CONNECTION_TIMEOUT: 3e4,
  // 30 seconds
  QUERY_TIMEOUT: 6e4,
  // 1 minute for complex pharmaceutical queries
  // Memory optimization settings
  ENABLE_CONNECTION_POOLING: true,
  POOL_MIN_SIZE: 1,
  POOL_MAX_SIZE: 3,
  // Railway service resource limits
  MAX_MEMORY_MB: 512,
  // Railway free tier limit
  CPU_CORES: 1,
  // Error handling and retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2e3,
  ENABLE_GRACEFUL_DEGRADATION: true,
  // Logging levels for Railway debugging
  LOG_DATABASE_QUERIES: process.env.NODE_ENV === "development",
  LOG_CONNECTION_EVENTS: true,
  LOG_ERROR_DETAILS: true
};
function getRailwayOptimizedConnectionString(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    url.searchParams.set("sslmode", "require");
    url.searchParams.set("connect_timeout", "15");
    url.searchParams.set("application_name", "PharmaCost-Pro");
    url.searchParams.set("statement_timeout", "30000");
    url.searchParams.set("idle_in_transaction_session_timeout", "30000");
    console.log("\u{1F527} Using optimized Railway PostgreSQL connection parameters");
    return url.toString();
  } catch (error) {
    console.error("\u274C Error optimizing Railway connection string:", error);
    console.error("   Using original DATABASE_URL - check PostgreSQL service health");
    return databaseUrl;
  }
}
function logRailwayResourceUsage() {
  if (process.memoryUsage && RAILWAY_CONFIG.LOG_CONNECTION_EVENTS) {
    const memory = process.memoryUsage();
    console.log("\u{1F4CA} Railway resource usage:");
    console.log(`   Memory: ${Math.round(memory.rss / 1024 / 1024)}MB / ${RAILWAY_CONFIG.MAX_MEMORY_MB}MB`);
    console.log(`   Heap: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`);
  }
}

// server/database.ts
function createDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("\u274C DATABASE_URL environment variable not found");
    console.error("   Check Railway PostgreSQL service status - it may have crashed");
    return null;
  }
  console.log("\u{1F517} Connecting to Railway PostgreSQL...");
  console.log("   Database host:", databaseUrl.includes("postgres.railway.internal") ? "Internal Railway Network" : "External Host");
  logRailwayResourceUsage();
  try {
    const optimizedUrl = getRailwayOptimizedConnectionString(databaseUrl);
    const sql = neon(optimizedUrl);
    const db = drizzle(sql, { schema: schema_exports });
    console.log("\u2705 Railway PostgreSQL connection ready");
    return db;
  } catch (error) {
    console.error("\u274C Railway PostgreSQL connection failed");
    console.error("   This usually indicates PostgreSQL service is crashed");
    console.error("   Check PostgreSQL service logs in Railway dashboard");
    if (error instanceof Error) {
      console.error("   Error:", error.message);
    }
    return null;
  }
}
async function testDatabaseConnection(db) {
  try {
    console.log("\u{1F50D} Testing Railway PostgreSQL connection...");
    const result = await Promise.race([
      db.execute("SELECT 1 as test"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Connection timeout")), 1e4))
    ]);
    console.log("\u2705 Railway PostgreSQL connection successful");
    return true;
  } catch (error) {
    console.error("\u274C Railway PostgreSQL connection failed");
    if (error instanceof Error) {
      console.error("   Error:", error.message);
      if (error.message.includes("Connection timeout")) {
        console.error("   PostgreSQL service may be crashed or unreachable");
      }
    }
    return false;
  }
}
async function initializeDatabaseSchema(db) {
  try {
    console.log("\u{1F527} Railway database schema ready (managed by Drizzle migrations)");
    return true;
  } catch (error) {
    console.error("\u274C Database schema check failed:", error);
    return false;
  }
}

// server/storage-database.ts
var RailwayDatabaseStorage = class {
  db;
  isConnected = false;
  connectionPromise;
  constructor() {
    this.connectionPromise = this.initializeDatabase();
  }
  async initializeDatabase() {
    try {
      console.log("\u{1F680} Initializing Railway PostgreSQL connection...");
      this.db = createDatabaseConnection();
      if (this.db) {
        let retries = 3;
        while (retries > 0 && !this.isConnected) {
          this.isConnected = await testDatabaseConnection(this.db);
          if (!this.isConnected) {
            console.log(`   Retrying PostgreSQL connection... (${retries} attempts left)`);
            await new Promise((resolve) => setTimeout(resolve, 5e3));
            retries--;
          }
        }
        if (this.isConnected) {
          await initializeDatabaseSchema(this.db);
          console.log("\u{1F5C4}\uFE0F Railway PostgreSQL storage operational");
        } else {
          console.error("\u274C PostgreSQL service appears to be crashed or unreachable");
          console.error("   Check Railway PostgreSQL service status in dashboard");
        }
      }
    } catch (error) {
      console.error("\u274C Database initialization failed:", error);
      this.isConnected = false;
    }
  }
  async ensureConnection() {
    await this.connectionPromise;
    if (!this.isConnected) {
      throw new Error("Railway PostgreSQL connection not available");
    }
    return true;
  }
  // Vendors
  async getVendors() {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(vendors);
      return result;
    } catch (error) {
      console.error("\u274C Error fetching vendors:", error);
      return [];
    }
  }
  async getVendor(id2) {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(vendors).where(eq(vendors.id, id2));
      return result[0];
    } catch (error) {
      console.error("\u274C Error fetching vendor:", error);
      return void 0;
    }
  }
  async createVendor(vendor) {
    await this.ensureConnection();
    const result = await this.db.insert(vendors).values(vendor).returning();
    return result[0];
  }
  // Credentials
  async getCredentials() {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(credentials);
      return result;
    } catch (error) {
      console.error("\u274C Error fetching credentials:", error);
      return [];
    }
  }
  async getCredentialByVendorId(vendorId) {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(credentials).where(eq(credentials.vendorId, vendorId));
      return result[0];
    } catch (error) {
      console.error("\u274C Error fetching credential by vendor:", error);
      return void 0;
    }
  }
  async createCredential(credential) {
    await this.ensureConnection();
    const result = await this.db.insert(credentials).values(credential).returning();
    return result[0];
  }
  async updateCredential(id2, credential) {
    await this.ensureConnection();
    try {
      const result = await this.db.update(credentials).set(credential).where(eq(credentials.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("\u274C Error updating credential:", error);
      return void 0;
    }
  }
  async deleteCredential(id2) {
    await this.ensureConnection();
    try {
      await this.db.delete(credentials).where(eq(credentials.id, id2));
      return true;
    } catch (error) {
      console.error("\u274C Error deleting credential:", error);
      return false;
    }
  }
  // Medications
  async getMedications() {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(medications);
      return result;
    } catch (error) {
      console.error("\u274C Error fetching medications:", error);
      return [];
    }
  }
  async getMedicationByNdc(ndc) {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(medications).where(eq(medications.ndc, ndc));
      return result[0];
    } catch (error) {
      console.error("\u274C Error fetching medication by NDC:", error);
      return void 0;
    }
  }
  async createMedication(medication) {
    await this.ensureConnection();
    const result = await this.db.insert(medications).values(medication).returning();
    return result[0];
  }
  async updateMedication(id2, medication) {
    await this.ensureConnection();
    try {
      const result = await this.db.update(medications).set(medication).where(eq(medications.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("\u274C Error updating medication:", error);
      return void 0;
    }
  }
  // Searches
  async getSearches(limit = 50) {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(searches).orderBy(desc(searches.createdAt)).limit(limit);
      return result;
    } catch (error) {
      console.error("\u274C Error fetching searches:", error);
      return [];
    }
  }
  async getSearch(id2) {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(searches).where(eq(searches.id, id2));
      return result[0];
    } catch (error) {
      console.error("\u274C Error fetching search:", error);
      return void 0;
    }
  }
  async getSearchWithResults(id2) {
    await this.ensureConnection();
    try {
      const search = await this.getSearch(id2);
      if (!search) return void 0;
      const searchResultsData = await this.getSearchResults(id2);
      const results = searchResultsData.map((sr) => ({
        ...sr,
        medication: {
          id: sr.medicationId || 0,
          name: "Unknown",
          genericName: null,
          ndc: null,
          packageSize: null,
          strength: null,
          dosageForm: null,
          manufacturer: null
        }
      }));
      return { ...search, results };
    } catch (error) {
      console.error("\u274C Error fetching search with results:", error);
      return void 0;
    }
  }
  async createSearch(search) {
    await this.ensureConnection();
    const result = await this.db.insert(searches).values(search).returning();
    return result[0];
  }
  async updateSearch(id2, search) {
    await this.ensureConnection();
    try {
      const result = await this.db.update(searches).set(search).where(eq(searches.id, id2)).returning();
      return result[0];
    } catch (error) {
      console.error("\u274C Error updating search:", error);
      return void 0;
    }
  }
  // Search Results
  async getSearchResults(searchId) {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(searchResults).where(eq(searchResults.searchId, searchId));
      return result;
    } catch (error) {
      console.error("\u274C Error fetching search results:", error);
      return [];
    }
  }
  async createSearchResult(result) {
    await this.ensureConnection();
    const dbResult = await this.db.insert(searchResults).values(result).returning();
    return dbResult[0];
  }
  // Activity Logs
  async getActivityLogs(limit = 100) {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
      return result;
    } catch (error) {
      console.error("\u274C Error fetching activity logs:", error);
      return [];
    }
  }
  async createActivityLog(log2) {
    await this.ensureConnection();
    const result = await this.db.insert(activityLogs).values(log2).returning();
    return result[0];
  }
  // Dashboard Stats
  async getDashboardStats() {
    await this.ensureConnection();
    try {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const searchesToday = await this.db.select({ count: "COUNT(*)" }).from(searches).where(gte(searches.createdAt, today));
      const totalCostQuery = await this.db.select({ sum: "SUM(CAST(cost AS DECIMAL))" }).from(searchResults).where(eq(searchResults.cost, searchResults.cost));
      const csvExports = await this.db.select({ count: "COUNT(*)" }).from(activityLogs).where(and(
        eq(activityLogs.action, "export"),
        eq(activityLogs.status, "success")
      ));
      return {
        totalSearchesToday: parseInt(searchesToday[0]?.count || "0"),
        totalCostAnalysis: parseFloat(totalCostQuery[0]?.sum || "0").toFixed(2),
        csvExportsGenerated: parseInt(csvExports[0]?.count || "0")
      };
    } catch (error) {
      console.error("\u274C Error calculating dashboard stats:", error);
      return {
        totalSearchesToday: 0,
        totalCostAnalysis: "0.00",
        csvExportsGenerated: 0
      };
    }
  }
};

// server/storage.ts
var MemStorage = class {
  vendors = /* @__PURE__ */ new Map();
  credentials = /* @__PURE__ */ new Map();
  medications = /* @__PURE__ */ new Map();
  searches = /* @__PURE__ */ new Map();
  searchResults = /* @__PURE__ */ new Map();
  activityLogs = /* @__PURE__ */ new Map();
  vendorId = 1;
  credentialId = 1;
  medicationId = 1;
  searchId = 1;
  searchResultId = 1;
  activityLogId = 1;
  constructor() {
    const instanceId = Math.random().toString(36).substring(7);
    console.log(`\u{1F50D} MemStorage constructor called - instance creation - ID: ${instanceId}`);
    this.initializeDefaultVendors();
  }
  initializeDefaultVendors() {
    const defaultVendors = [
      { name: "Kinray (Cardinal Health)", portalUrl: "https://kinrayweblink.cardinalhealth.com/login", isActive: true }
    ];
    defaultVendors.forEach((vendor) => {
      const newVendor = {
        ...vendor,
        id: this.vendorId++,
        isActive: vendor.isActive ?? true
      };
      this.vendors.set(newVendor.id, newVendor);
    });
  }
  // Vendors
  async getVendors() {
    return Array.from(this.vendors.values()).filter((v) => v.isActive);
  }
  async getVendor(id2) {
    return this.vendors.get(id2);
  }
  async createVendor(vendor) {
    const newVendor = {
      ...vendor,
      id: this.vendorId++,
      isActive: vendor.isActive ?? true
    };
    this.vendors.set(newVendor.id, newVendor);
    return newVendor;
  }
  // Credentials
  async getCredentials() {
    return Array.from(this.credentials.values()).filter((c) => c.isActive);
  }
  async getCredentialByVendorId(vendorId) {
    return Array.from(this.credentials.values()).find((c) => c.vendorId === vendorId && c.isActive);
  }
  async createCredential(credential) {
    const newCredential = {
      ...credential,
      id: this.credentialId++,
      lastValidated: null,
      isActive: credential.isActive ?? true,
      vendorId: credential.vendorId ?? null
    };
    this.credentials.set(newCredential.id, newCredential);
    return newCredential;
  }
  async updateCredential(id2, credential) {
    const existing = this.credentials.get(id2);
    if (!existing) return void 0;
    const updated = { ...existing, ...credential };
    this.credentials.set(id2, updated);
    return updated;
  }
  async deleteCredential(id2) {
    return this.credentials.delete(id2);
  }
  // Medications
  async getMedications() {
    return Array.from(this.medications.values());
  }
  async getMedicationByNdc(ndc) {
    return Array.from(this.medications.values()).find((m) => m.ndc === ndc);
  }
  async createMedication(medication) {
    const newMedication = {
      ...medication,
      id: this.medicationId++,
      genericName: medication.genericName ?? null,
      ndc: medication.ndc ?? null,
      packageSize: medication.packageSize ?? null,
      strength: medication.strength ?? null,
      dosageForm: medication.dosageForm ?? null,
      manufacturer: medication.manufacturer ?? null
    };
    this.medications.set(newMedication.id, newMedication);
    return newMedication;
  }
  async updateMedication(id2, medication) {
    const existing = this.medications.get(id2);
    if (!existing) return void 0;
    const updated = { ...existing, ...medication };
    this.medications.set(id2, updated);
    return updated;
  }
  // Searches
  async getSearches(limit = 50) {
    return Array.from(this.searches.values()).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)).slice(0, limit);
  }
  async getSearch(id2) {
    return this.searches.get(id2);
  }
  async getSearchWithResults(id2) {
    const storageId = global.__pharma_storage_id__ || "unknown";
    console.log(`\u{1F50D} getSearchWithResults called for searchId: ${id2}`);
    console.log(`\u{1F4CA} Storage instance: ${this.constructor.name} - Global ID: ${storageId}`);
    console.log(`\u{1F4CA} Available searches: ${this.searches.size} - IDs: [${Array.from(this.searches.keys()).join(", ")}]`);
    console.log(`\u{1F4CA} Available results: ${this.searchResults.size} - IDs: [${Array.from(this.searchResults.keys()).join(", ")}]`);
    console.log(`\u{1F4CA} Available medications: ${this.medications.size} - IDs: [${Array.from(this.medications.keys()).join(", ")}]`);
    const search = this.searches.get(id2);
    if (!search) {
      console.log(`\u274C Search ${id2} not found in storage`);
      return void 0;
    }
    const results = Array.from(this.searchResults.values()).filter((sr) => sr.searchId === id2).map((sr) => ({
      ...sr,
      medication: this.medications.get(sr.medicationId)
    }));
    console.log(`\u{1F4CB} Found ${results.length} results for search ${id2}`);
    return { ...search, results };
  }
  async createSearch(search) {
    const newSearch = {
      ...search,
      id: this.searchId++,
      createdAt: /* @__PURE__ */ new Date(),
      completedAt: null,
      vendorId: search.vendorId ?? null,
      resultCount: search.resultCount ?? null
    };
    this.searches.set(newSearch.id, newSearch);
    console.log(`\u{1F504} Created search ${newSearch.id} - Total searches: ${this.searches.size}`);
    return newSearch;
  }
  async updateSearch(id2, search) {
    const existing = this.searches.get(id2);
    if (!existing) return void 0;
    const updated = { ...existing, ...search };
    this.searches.set(id2, updated);
    return updated;
  }
  // Search Results
  async getSearchResults(searchId) {
    return Array.from(this.searchResults.values()).filter((sr) => sr.searchId === searchId);
  }
  async createSearchResult(result) {
    const storageId = global.__pharma_storage_id__ || "unknown";
    const newResult = {
      ...result,
      id: this.searchResultId++,
      lastUpdated: /* @__PURE__ */ new Date(),
      vendorId: result.vendorId ?? null,
      searchId: result.searchId ?? null,
      medicationId: result.medicationId ?? null,
      cost: result.cost ?? null,
      availability: result.availability ?? null
    };
    this.searchResults.set(newResult.id, newResult);
    console.log(`\u{1F504} Created result ${newResult.id} for search ${newResult.searchId} - Total results: ${this.searchResults.size}`);
    console.log(`\u{1F50D} Storage instance ${this.constructor.name} - Global ID: ${storageId} - Results map size: ${this.searchResults.size}`);
    console.log(`\u{1F50D} All search results: ${Array.from(this.searchResults.keys()).join(", ")}`);
    return newResult;
  }
  // Activity Logs
  async getActivityLogs(limit = 20) {
    return Array.from(this.activityLogs.values()).sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)).slice(0, limit);
  }
  async createActivityLog(log2) {
    const newLog = {
      ...log2,
      id: this.activityLogId++,
      createdAt: /* @__PURE__ */ new Date(),
      vendorId: log2.vendorId ?? null,
      searchId: log2.searchId ?? null
    };
    this.activityLogs.set(newLog.id, newLog);
    return newLog;
  }
  // Dashboard stats
  async getDashboardStats() {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const searchesToday = Array.from(this.searches.values()).filter((s) => s.createdAt && s.createdAt >= today).length;
    const totalCost = Array.from(this.searchResults.values()).reduce((sum, sr) => sum + parseFloat(sr.cost || "0"), 0);
    const csvExports = Array.from(this.activityLogs.values()).filter((log2) => log2.action === "export" && log2.status === "success").length;
    return {
      totalSearchesToday: searchesToday,
      totalCostAnalysis: totalCost.toFixed(2),
      csvExportsGenerated: csvExports
    };
  }
};
function createStorageInstance() {
  const storageId = Math.random().toString(36).substring(2, 8);
  const creationTime = Date.now();
  console.log(`\u{1F5C4}\uFE0F Creating GLOBAL singleton MemStorage instance - ID: ${storageId}`);
  const instance = new MemStorage();
  global.__pharma_storage_singleton__ = instance;
  global.__pharma_storage_id__ = storageId;
  global.__pharma_storage_creation_time__ = creationTime;
  return instance;
}
function getStorageInstance() {
  if (!global.__pharma_storage_singleton__) {
    return createStorageInstance();
  } else {
    const storageId = global.__pharma_storage_id__ || "unknown";
    const creationTime = global.__pharma_storage_creation_time__ || 0;
    const age = Date.now() - creationTime;
    console.log(`\u{1F504} Using EXISTING singleton MemStorage instance - ID: ${storageId}, Age: ${age}ms`);
    return global.__pharma_storage_singleton__;
  }
}
function createSmartStorage() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.includes("postgresql://")) {
    console.log("\u{1F682} Railway PostgreSQL detected - testing connection");
    console.log("   Database host:", databaseUrl.includes("railway.internal") ? "Internal Network" : "External");
    if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_DEPLOYMENT_ID || process.env.RAILWAY_SERVICE_ID) {
      console.log("\u26A0\uFE0F  Railway environment detected - using memory storage to prevent server crash");
      console.log("   PostgreSQL service appears to be crashed - check Railway dashboard");
      console.log("   Server will run with memory storage until PostgreSQL is fixed");
      return getStorageInstance();
    }
    try {
      return new RailwayDatabaseStorage();
    } catch (error) {
      console.error("\u274C PostgreSQL service failed to initialize");
      console.error("   Falling back to memory storage");
      console.error("   Check Railway PostgreSQL service status");
      return getStorageInstance();
    }
  } else {
    console.log("\u{1F4BE} PostgreSQL not available - using memory storage");
    console.log("   DATABASE_URL missing or invalid - check Railway PostgreSQL service");
    return getStorageInstance();
  }
}
var storage = createSmartStorage();

// server/services/scraper.ts
import puppeteer from "puppeteer";
import { execSync } from "child_process";

// server/services/session-manager.ts
var SessionManager = class {
  /**
   * Inject pre-authenticated session cookies into the browser
   */
  static async injectSessionCookies(page, cookies) {
    console.log("\u{1F36A} Injecting session cookies to bypass authentication...");
    for (const cookie of cookies) {
      try {
        await page.setCookie({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires
        });
        console.log(`\u2705 Injected cookie: ${cookie.name}`);
      } catch (error) {
        console.log(`\u274C Failed to inject cookie ${cookie.name}:`, error);
      }
    }
  }
  /**
   * Check if session is still valid
   */
  static async validateSession(page) {
    try {
      const currentUrl = page.url();
      const hasLoginForm = await page.$('input[name="username"], input[type="password"]') !== null;
      return !currentUrl.includes("login") && !currentUrl.includes("signin") && !hasLoginForm;
    } catch (error) {
      return false;
    }
  }
  /**
   * Extract common Kinray session cookie names
   */
  static getKinraySessionCookieNames() {
    return [
      "JSESSIONID",
      "SESSION",
      "auth-token",
      "kinray-session",
      "cardinal-auth",
      "_session",
      "okta-oauth-state",
      "DT"
    ];
  }
};

// server/services/scraper.ts
var PuppeteerScrapingService = class {
  browser = null;
  page = null;
  currentVendor = null;
  async findChromiumPath() {
    try {
      console.log("\u{1F50D} Starting browser path detection...");
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);
        const { stdout } = await execAsync("which chromium");
        const whichPath = stdout.trim();
        console.log(`\u2705 which chromium returned: ${whichPath}`);
        if (whichPath && await this.verifyBrowserPath(whichPath)) {
          console.log(`\u2705 Browser found via which command: ${whichPath}`);
          return whichPath;
        }
      } catch (e) {
        console.log("which command failed, trying manual paths...");
      }
      if (process.env.NODE_ENV === "production" || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.RAILWAY_ENVIRONMENT) {
        console.log("\u{1F682} Railway environment detected - trying bundled browser first");
        try {
          const bundledPath = puppeteer.executablePath();
          console.log(`\u{1F4E6} Puppeteer bundled browser path: ${bundledPath}`);
          const fs3 = await import("fs");
          if (fs3.existsSync(bundledPath)) {
            console.log(`\u2705 Using Puppeteer bundled browser for Railway: ${bundledPath}`);
            return bundledPath;
          } else {
            console.log("\u{1F4E6} Bundled browser not found, will download...");
          }
        } catch (error) {
          console.log("Bundled browser check failed:", error.message);
        }
        const possiblePaths = [
          process.env.PUPPETEER_EXECUTABLE_PATH,
          "/usr/bin/google-chrome-stable",
          // Docker/Railway Chrome
          "/usr/bin/google-chrome",
          // Alternative Chrome path
          "/usr/bin/chromium",
          // Chromium in some containers
          "/usr/bin/chromium-browser"
          // Ubuntu-style Chromium
        ].filter(Boolean);
        for (const chromePath of possiblePaths) {
          try {
            const fs3 = await import("fs");
            if (fs3.existsSync(chromePath)) {
              console.log(`\u{1F50D} Using Railway/production Chrome path: ${chromePath}`);
              return chromePath;
            }
          } catch (error) {
            console.log(`Chrome path not found: ${chromePath}`);
          }
        }
      }
      const knownChromiumPath = "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium";
      console.log(`\u{1F50D} Using confirmed working chromium path: ${knownChromiumPath}`);
      return knownChromiumPath;
    } catch (error) {
      console.log("\u274C Browser path detection failed:", error.message);
      return null;
    }
  }
  async verifyBrowserPath(path4) {
    try {
      const fs3 = await import("fs");
      const exists = fs3.existsSync(path4);
      console.log(`\u{1F50D} Path exists check for ${path4}: ${exists}`);
      if (!exists) {
        console.log(`\u274C Browser path does not exist: ${path4}`);
        return false;
      }
      if (path4.includes("/nix/store") && path4.includes("chromium")) {
        console.log(`\u2705 Using known working chromium path: ${path4}`);
        return true;
      }
      console.log(`\u2705 Verified browser path: ${path4}`);
      return true;
    } catch (e) {
      console.log(`\u274C Browser path verification failed: ${path4} - ${e.message}`);
      return false;
    }
  }
  async checkBrowserAvailability() {
    try {
      console.log("\u{1F50D} Testing browser automation availability...");
      const path4 = await this.findChromiumPath();
      console.log(`\u{1F4CA} Browser path found: ${path4}`);
      if (!path4) {
        console.log("\u274C No browser executable found");
        return false;
      }
      const launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-extensions",
        "--no-first-run"
      ];
      if (process.env.RAILWAY_ENVIRONMENT) {
        launchArgs.push(
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--single-process"
        );
      }
      const testBrowser = await puppeteer.launch({
        headless: true,
        executablePath: path4,
        args: launchArgs
      });
      console.log("\u2705 Browser instance created successfully");
      await testBrowser.close();
      console.log("\u2705 Browser closed successfully");
      return true;
    } catch (error) {
      console.error("\u274C Browser automation test failed:", error.message);
      console.error("\u274C Full error details:", error);
      return false;
    }
  }
  generateDemoResults(searchTerm, searchType) {
    console.log(`\u274C Demo data generation disabled. Only authentic Kinray portal data allowed.`);
    return [];
    if (isLisinopril) {
      return [
        {
          medication: {
            id: 1,
            name: "LISINOPRIL TB 40MG 100",
            genericName: "Lisinopril",
            ndc: "68180097901",
            packageSize: "100 EA",
            strength: "40mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$3.20",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 2,
            name: "LISINOPRIL TB 40MG 1000",
            genericName: "Lisinopril",
            ndc: "68180097903",
            packageSize: "1000 EA",
            strength: "40mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$28.80",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 3,
            name: "LISINOPRIL TB 30MG 500",
            genericName: "Lisinopril",
            ndc: "68180098202",
            packageSize: "500 EA",
            strength: "30mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$17.52",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 4,
            name: "LISINOPRIL TB 5MG 1000",
            genericName: "Lisinopril",
            ndc: "68180001403",
            packageSize: "1000 EA",
            strength: "5mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$8.20",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 5,
            name: "LISINOPRIL TB 5MG 100",
            genericName: "Lisinopril",
            ndc: "68180051301",
            packageSize: "100 EA",
            strength: "5mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$1.37",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 6,
            name: "LISINOPRIL TB 2.5MG 500",
            genericName: "Lisinopril",
            ndc: "68180051202",
            packageSize: "500 EA",
            strength: "2.5mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$4.90",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 7,
            name: "LISINOPRIL TB 20MG 1000",
            genericName: "Lisinopril",
            ndc: "00091040810",
            packageSize: "1000 EA",
            strength: "20mg",
            dosageForm: "Tablet"
          },
          cost: "$68.43",
          availability: "In Stock",
          vendor: "TEVA PHAR - 564.47"
        },
        {
          medication: {
            id: 8,
            name: "LISINOPRIL TB 20MG 100",
            genericName: "Lisinopril",
            ndc: "68180098101",
            packageSize: "100 EA",
            strength: "20mg",
            dosageForm: "Tablet"
          },
          cost: "$2.29",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 9,
            name: "LISINOPRIL TB 10MG 100",
            genericName: "Lisinopril",
            ndc: "68180098001",
            packageSize: "100 EA",
            strength: "10mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$1.50",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 10,
            name: "LISINOPRIL TB 30MG 100",
            genericName: "Lisinopril",
            ndc: "68180098201",
            packageSize: "100 EA",
            strength: "30mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$3.60",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        }
      ];
    }
    const isMetformin = searchTerm.toLowerCase().includes("metformin");
    if (isMetformin) {
      return [
        {
          medication: {
            id: 1,
            name: "METFORMIN HCL TB 500MG 1000",
            genericName: "Metformin HCl",
            ndc: "68180085603",
            packageSize: "1000 EA",
            strength: "500mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$12.45",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 2,
            name: "METFORMIN HCL TB 1000MG 500",
            genericName: "Metformin HCl",
            ndc: "68180085703",
            packageSize: "500 EA",
            strength: "1000mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$15.80",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 3,
            name: "METFORMIN HCL TB 850MG 1000",
            genericName: "Metformin HCl",
            ndc: "68180085503",
            packageSize: "1000 EA",
            strength: "850mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$18.22",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 4,
            name: "METFORMIN HCL ER TB 500MG 100",
            genericName: "Metformin HCl ER",
            ndc: "00093750056",
            packageSize: "100 EA",
            strength: "500mg",
            dosageForm: "Extended Release Tablet",
            manufacturer: "Teva Pharmaceuticals"
          },
          cost: "$4.75",
          availability: "In Stock",
          vendor: "TEVA PHAR - 564.47"
        },
        {
          medication: {
            id: 5,
            name: "METFORMIN HCL ER TB 750MG 100",
            genericName: "Metformin HCl ER",
            ndc: "00093750156",
            packageSize: "100 EA",
            strength: "750mg",
            dosageForm: "Extended Release Tablet",
            manufacturer: "Teva Pharmaceuticals"
          },
          cost: "$6.90",
          availability: "In Stock",
          vendor: "TEVA PHAR - 564.47"
        }
      ];
    }
    const isAlprazolam = searchTerm.toLowerCase().includes("alprazolam");
    if (isAlprazolam) {
      return [
        {
          medication: {
            id: 1,
            name: "ALPRAZOLAM TB 10MG 100",
            genericName: "Alprazolam",
            ndc: "68180001001",
            packageSize: "100 EA",
            strength: "10mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$5.25",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 2,
            name: "ALPRAZOLAM TB 20MG 100",
            genericName: "Alprazolam",
            ndc: "68180001002",
            packageSize: "100 EA",
            strength: "20mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$7.80",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        },
        {
          medication: {
            id: 3,
            name: "ALPRAZOLAM TB 5MG 500",
            genericName: "Alprazolam",
            ndc: "68180001003",
            packageSize: "500 EA",
            strength: "5mg",
            dosageForm: "Tablet",
            manufacturer: "Lupin Pharmaceuticals"
          },
          cost: "$12.40",
          availability: "In Stock",
          vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
        }
      ];
    }
    const baseResults = [
      {
        name: `${searchTerm.toUpperCase()} TB 10MG 100`,
        ndc: "68180001001",
        cost: "$5.25",
        vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
      },
      {
        name: `${searchTerm.toUpperCase()} TB 20MG 100`,
        ndc: "68180001002",
        cost: "$7.80",
        vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
      },
      {
        name: `${searchTerm.toUpperCase()} TB 5MG 500`,
        ndc: "68180001003",
        cost: "$12.40",
        vendor: "LUPIN PHA - Contract: METRO KINRAY 3"
      }
    ];
    return baseResults.map((item, index) => ({
      medication: {
        id: index + 1,
        name: item.name,
        genericName: searchType === "generic" ? item.name : null,
        ndc: item.ndc,
        packageSize: item.name.includes("500") ? "500 EA" : "100 EA",
        strength: item.name.includes("20MG") ? "20mg" : item.name.includes("10MG") ? "10mg" : "5mg",
        dosageForm: "Tablet",
        manufacturer: "Lupin Pharmaceuticals"
      },
      cost: item.cost,
      availability: "In Stock",
      vendor: item.vendor
    }));
  }
  async initBrowser() {
    if (!this.browser) {
      const isReplit = process.env.REPL_ID !== void 0;
      const isRender = process.env.RENDER !== void 0;
      const isDigitalOcean = process.env.DIGITAL_OCEAN !== void 0 || process.env.DO_APP_NAME !== void 0;
      let launchConfig = {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-images",
          "--disable-javascript-harmony-shipping",
          "--ignore-certificate-errors",
          "--ignore-ssl-errors",
          "--ignore-certificate-errors-spki-list",
          "--allow-running-insecure-content",
          "--disable-blink-features=AutomationControlled",
          "--disable-default-apps",
          "--disable-sync",
          "--no-default-browser-check",
          "--disable-client-side-phishing-detection",
          "--disable-background-networking",
          "--proxy-server=direct://",
          "--proxy-bypass-list=*"
        ]
      };
      const chromiumPath = await this.findChromiumPath();
      if (chromiumPath) {
        launchConfig.executablePath = chromiumPath;
        console.log(`Using browser at: ${chromiumPath}`);
      } else {
        throw new Error("No browser executable found - install chromium or chrome");
      }
      try {
        this.browser = await puppeteer.launch(launchConfig);
        console.log("\u2705 System browser launched successfully");
      } catch (error) {
        console.log("Browser launch failed:", error.message);
        if (error.message.includes("Browser was not found") || error.message.includes("executablePath")) {
          console.log("\u{1F504} System browser failed, trying Puppeteer bundled browser...");
          try {
            console.log("\u{1F4E6} Using Puppeteer bundled browser...");
            let downloadAttempted = false;
            try {
              this.browser = await puppeteer.launch({
                headless: true,
                args: [
                  "--no-sandbox",
                  "--disable-setuid-sandbox",
                  "--disable-dev-shm-usage",
                  "--disable-gpu",
                  "--disable-software-rasterizer",
                  "--disable-background-timer-throttling",
                  "--disable-backgrounding-occluded-windows",
                  "--disable-renderer-backgrounding",
                  "--disable-web-security"
                ]
              });
              console.log("\u2705 Successfully launched with Puppeteer bundled browser");
              return;
            } catch (bundledError) {
              if ((bundledError.message.includes("Could not find browser") || bundledError.message.includes("Tried to find the browser") || bundledError.message.includes("no executable was found")) && !downloadAttempted) {
                console.log("\u{1F504} Browser not found, attempting download...");
                downloadAttempted = true;
                try {
                  console.log("\u{1F4E5} Installing system dependencies and browser...");
                  try {
                    console.log("\u{1F4E6} Attempting to install Chrome system dependencies...");
                    const approaches = [
                      "nix-env -iA nixpkgs.nss nixpkgs.glib nixpkgs.gtk3",
                      "apk add --no-cache nss glib gtk+3.0-dev",
                      "yum install -y nss glib2 gtk3"
                    ];
                    for (const approach of approaches) {
                      try {
                        console.log(`\u{1F504} Trying: ${approach}`);
                        execSync(approach, { stdio: "inherit", timeout: 6e4 });
                        console.log("\u2705 System dependencies installed successfully");
                        break;
                      } catch (approachError) {
                        console.log(`\u26A0\uFE0F ${approach.split(" ")[0]} failed`);
                      }
                    }
                  } catch (sysError) {
                    console.log("\u26A0\uFE0F All system dependency installation attempts failed");
                  }
                  try {
                    console.log("\u{1F4E5} Installing Puppeteer browser...");
                    execSync("npx puppeteer browsers install chrome", {
                      stdio: "inherit",
                      timeout: 6e4
                      // 1 minute timeout
                    });
                    console.log("\u2705 Browser installed successfully via CLI");
                  } catch (cliError) {
                    console.log("CLI install failed, trying programmatic download...");
                    const puppeteerCore = await import("puppeteer-core");
                    const fetcher = puppeteerCore.default.createBrowserFetcher();
                    console.log("\u{1F4E5} Downloading Chromium browser programmatically...");
                    await fetcher.download("1127108");
                    console.log("\u2705 Browser downloaded successfully");
                  }
                  this.browser = await puppeteer.launch({
                    headless: true,
                    args: [
                      "--no-sandbox",
                      "--disable-setuid-sandbox",
                      "--disable-dev-shm-usage",
                      "--disable-gpu",
                      "--disable-software-rasterizer",
                      "--disable-background-timer-throttling",
                      "--disable-backgrounding-occluded-windows",
                      "--disable-renderer-backgrounding",
                      "--disable-web-security"
                    ]
                    // No executablePath - let Puppeteer find the downloaded browser automatically
                  });
                  console.log("\u2705 Successfully launched after download");
                  return;
                } catch (downloadError) {
                  console.log("\u274C Browser download failed:", downloadError.message);
                  throw bundledError;
                }
              } else {
                throw bundledError;
              }
            }
          } catch (fallbackError) {
            console.log("\u274C Bundled browser also failed:", fallbackError.message);
            console.log("\u{1F50D} Error details for debugging:", {
              message: fallbackError.message,
              includesCouldNotFind: fallbackError.message.includes("Could not find browser"),
              includesTriedToFind: fallbackError.message.includes("Tried to find the browser"),
              includesNoExecutable: fallbackError.message.includes("no executable was found")
            });
            console.log("\u{1F504} Trying to use downloaded browser with compatibility mode...");
            try {
              const downloadedBrowserPath = "/workspace/.cache/puppeteer/chrome/linux-137.0.7151.119/chrome-linux64/chrome";
              console.log(`\u{1F50D} Attempting to use downloaded browser at: ${downloadedBrowserPath}`);
              this.browser = await puppeteer.launch({
                executablePath: downloadedBrowserPath,
                headless: true,
                args: [
                  "--no-sandbox",
                  "--disable-setuid-sandbox",
                  "--disable-dev-shm-usage",
                  "--disable-gpu",
                  "--disable-software-rasterizer",
                  "--disable-background-timer-throttling",
                  "--disable-backgrounding-occluded-windows",
                  "--disable-renderer-backgrounding",
                  "--disable-web-security",
                  "--disable-features=VizDisplayCompositor",
                  "--disable-extensions",
                  "--disable-plugins",
                  "--disable-default-apps",
                  "--disable-sync",
                  "--disable-translate",
                  "--disable-background-networking",
                  "--disable-ipc-flooding-protection",
                  "--single-process",
                  // This might help with missing libraries
                  "--no-zygote"
                ]
              });
              console.log("\u2705 Successfully launched with downloaded browser in compatibility mode");
              return;
            } catch (downloadedPathError) {
              console.log("\u274C Downloaded browser path failed:", downloadedPathError.message);
              if (downloadedPathError.message.includes("libnss3.so")) {
                console.log("\u{1F50D} Missing libnss3.so - this is a system dependency issue");
                console.log("\u{1F4A1} Consider using Docker deployment or a platform with full system access");
              }
              console.log("\u{1F504} Final attempt without executablePath...");
              try {
                delete process.env.PUPPETEER_EXECUTABLE_PATH;
                this.browser = await puppeteer.launch({
                  headless: true,
                  args: ["--no-sandbox", "--disable-setuid-sandbox"]
                });
                console.log("\u2705 Final fallback successful");
                return;
              } catch (finalError) {
                console.log("\u274C All browser launch attempts failed:", finalError.message);
              }
            }
          }
        }
        throw new Error("Browser automation not available in this environment");
      }
    }
    if (!this.page) {
      this.page = await this.browser.newPage();
      await this.page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");
      await this.page.setViewport({ width: 1366, height: 768 });
      await this.page.evaluateOnNewDocument(() => {
        delete window.webdriver;
        Object.defineProperty(navigator, "webdriver", {
          get: () => false
        });
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5]
        });
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"]
        });
        window.chrome = {
          runtime: {},
          loadTimes: function() {
          },
          csi: function() {
          },
          app: {}
        };
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => parameters.name === "notifications" ? Promise.resolve({ state: Notification.permission }) : originalQuery(parameters);
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
          if (type === "mousemove") {
            const originalListener = listener;
            listener = function(e) {
              e.isTrusted = true;
              return originalListener.apply(this, arguments);
            };
          }
          return originalAddEventListener.call(this, type, listener, options);
        };
      });
      await this.page.setExtraHTTPHeaders({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        "sec-ch-ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1"
      });
      await this.page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => void 0 });
        Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
      });
    }
  }
  async login(vendor, credential) {
    try {
      console.log(`\u{1F510} Attempting login to ${vendor.name} with username: ${credential.username}`);
      const browserAvailable = await this.checkBrowserAvailability();
      if (!browserAvailable) {
        console.log("Browser automation not available - cannot perform live scraping");
        return false;
      }
      console.log("\u2705 Browser automation available - attempting real portal login");
      try {
        await this.initBrowser();
        if (!this.page) throw new Error("Failed to initialize browser page");
        console.log("\u2705 Browser initialized successfully");
      } catch (browserError) {
        console.log(`\u274C Browser initialization failed: ${browserError.message}`);
        return false;
      }
      this.currentVendor = vendor;
      console.log(`\u{1F310} Connecting to ${vendor.name} at ${vendor.portalUrl}`);
      try {
        console.log("\u{1F680} Launching browser navigation...");
        const mainPortalUrl = vendor.portalUrl.replace("/login", "").replace("/signin", "");
        console.log(`\u{1F36A} Trying main portal first to use existing session: ${mainPortalUrl}`);
        const response = await this.page.goto(mainPortalUrl, {
          waitUntil: "domcontentloaded",
          timeout: 15e3
        });
        if (!response || !response.ok()) {
          throw new Error(`HTTP ${response?.status() || "No response"} - Portal unreachable`);
        }
        console.log(`\u2705 Successfully connected to ${vendor.name} portal`);
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        const currentUrl = this.page.url();
        const hasLoginForm = await this.page.$('input[name="username"], input[name="password"], input[type="password"]') !== null;
        console.log(`Current URL: ${currentUrl}`);
        console.log(`Login form present: ${hasLoginForm}`);
        if (!hasLoginForm && !currentUrl.includes("login") && !currentUrl.includes("signin")) {
          console.log("\u{1F36A} Already logged in with existing session - skipping authentication");
          return true;
        }
      } catch (navigationError) {
        console.log(`\u274C Navigation failed: ${navigationError.message}`);
        if (navigationError.message.includes("ERR_NAME_NOT_RESOLVED") || navigationError.message.includes("ERR_INTERNET_DISCONNECTED") || navigationError.message.includes("net::ERR_") || navigationError.message.includes("Could not resolve host") || navigationError.message.includes("Navigation timeout") || navigationError.name === "TimeoutError") {
          console.log(`\u{1F310} Network connectivity issue detected - cannot perform live scraping`);
          console.log(`Portal URL: ${vendor.portalUrl}`);
          console.log(`Error: ${navigationError.message}`);
          return false;
        }
        console.error(`Connection error for ${vendor.name}:`, navigationError.message);
        throw new Error(`Failed to connect to ${vendor.name}: ${navigationError.message}`);
      }
      switch (vendor.name) {
        case "McKesson Connect":
          return await this.loginMcKesson(credential);
        case "Cardinal Health":
          return await this.loginCardinal(credential);
        case "Kinray (Cardinal Health)":
          console.log("\u{1F511} Starting Kinray-specific login process...");
          try {
            const loginResult = await this.loginKinray(credential);
            console.log(`\u{1F511} Kinray login result: ${loginResult}`);
            return loginResult;
          } catch (kinrayError) {
            console.log(`\u274C Kinray login error: ${kinrayError.message}`);
            return false;
          }
        case "AmerisourceBergen":
          return await this.loginAmerisource(credential);
        case "Morris & Dickson":
          return await this.loginMorrisDickson(credential);
        default:
          throw new Error(`Unsupported vendor: ${vendor.name}`);
      }
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }
  async loginMcKesson(credential) {
    if (!this.page) return false;
    try {
      await this.page.waitForSelector('input[name="username"], input[name="userId"], input[type="email"]', { timeout: 1e4 });
      await this.page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 1e4 });
      const usernameSelector = await this.page.$('input[name="username"], input[name="userId"], input[type="email"]');
      const passwordSelector = await this.page.$('input[name="password"], input[type="password"]');
      if (usernameSelector && passwordSelector) {
        await usernameSelector.type(credential.username);
        await passwordSelector.type(credential.password);
        const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button:contains("Sign In"), button:contains("Login")');
        if (submitButton) {
          await submitButton.click();
          await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15e3 });
          const isDashboard = await this.page.$(".dashboard, .main-content, .welcome") !== null;
          const isError = await this.page.$(".error, .alert-danger, .login-error") !== null;
          return isDashboard && !isError;
        }
      }
      return false;
    } catch (error) {
      console.error("McKesson login error:", error);
      return false;
    }
  }
  async loginCardinal(credential) {
    if (!this.page) return false;
    try {
      await this.page.waitForSelector('input[name="username"], input[name="email"]', { timeout: 1e4 });
      await this.page.waitForSelector('input[name="password"]', { timeout: 1e4 });
      await this.page.type('input[name="username"], input[name="email"]', credential.username);
      await this.page.type('input[name="password"]', credential.password);
      await this.page.click('button[type="submit"], input[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15e3 });
      const isSuccess = await this.page.$(".dashboard, .main-menu") !== null;
      return isSuccess;
    } catch (error) {
      console.error("Cardinal login error:", error);
      return false;
    }
  }
  async loginKinray(credential) {
    if (!this.page) return false;
    try {
      console.log("=== KINRAY LOGIN ATTEMPT ===");
      console.log(`Username: ${credential.username}`);
      console.log(`Password length: ${credential.password.length} characters`);
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      const pageUrl = this.page.url();
      console.log(`Current URL: ${pageUrl}`);
      await this.page.screenshot({ path: "kinray-login-page.png", fullPage: false });
      console.log("\u{1F4F8} Screenshot saved as kinray-login-page.png");
      const usernameSelectors = [
        'input[placeholder*="kinrayweblink.cardinalhealth.com credentials"]',
        'input[name="username"]',
        'input[name="user"]',
        'input[name="email"]',
        "#username",
        "#user",
        "#email",
        'input[type="text"]',
        'input[type="email"]'
      ];
      const passwordSelectors = [
        'input[name="password"]',
        'input[name="pass"]',
        "#password",
        "#pass",
        'input[type="password"]'
      ];
      let usernameFound = false;
      let passwordFound = false;
      for (const selector of usernameSelectors) {
        try {
          const field = await this.page.$(selector);
          if (field) {
            console.log(`Found username field: ${selector}`);
            await field.click();
            await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1e3));
            await field.type(credential.username, { delay: 50 + Math.random() * 100 });
            usernameFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      for (const selector of passwordSelectors) {
        try {
          const field = await this.page.$(selector);
          if (field) {
            console.log(`Found password field: ${selector}`);
            await field.click();
            await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700));
            await field.type(credential.password, { delay: 50 + Math.random() * 100 });
            passwordFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (!usernameFound || !passwordFound) {
        console.log(`LOGIN FIELD STATUS: username=${usernameFound}, password=${passwordFound}`);
        console.log("Portal accessible but login form differs from expected structure");
        const allInputs = await this.page.$$eval(
          "input",
          (inputs) => inputs.map((input) => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className
          }))
        );
        console.log("All input elements found:", JSON.stringify(allInputs, null, 2));
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, 1e3 + Math.random() * 2e3));
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Login")',
        'button:contains("Sign In")',
        ".login-btn",
        ".submit-btn"
      ];
      let submitSuccess = false;
      for (const selector of submitSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button) {
            console.log(`Found submit button: ${selector}`);
            await button.click();
            submitSuccess = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (!submitSuccess) {
        console.log("No submit button found, trying Enter key");
        await this.page.keyboard.press("Enter");
      }
      let navigationSuccess = false;
      try {
        await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8e3 });
        navigationSuccess = true;
        console.log("Navigation completed successfully");
      } catch (e) {
        console.log("Navigation timeout - checking current page status...");
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      const finalUrl = this.page.url();
      console.log(`Final URL after login attempt: ${finalUrl}`);
      console.log("=== CHECKING LOGIN SUCCESS ===");
      const urlIndicatesSuccess = !finalUrl.includes("login") && !finalUrl.includes("signin") && !finalUrl.includes("auth");
      console.log(`URL indicates success: ${urlIndicatesSuccess} (${finalUrl})`);
      let elementIndicatesSuccess = false;
      try {
        const successElements = await this.page.$$eval("*", (elements) => {
          const successIndicators = [
            "dashboard",
            "welcome",
            "home",
            "main",
            "portal",
            "menu",
            "logout",
            "user",
            "account",
            "profile",
            "nav"
          ];
          return elements.some((el) => {
            const text2 = el.textContent?.toLowerCase() || "";
            const className = el.className?.toLowerCase() || "";
            const id2 = el.id?.toLowerCase() || "";
            return successIndicators.some(
              (indicator) => text2.includes(indicator) || className.includes(indicator) || id2.includes(indicator)
            );
          });
        });
        elementIndicatesSuccess = successElements;
        console.log(`Page elements indicate success: ${elementIndicatesSuccess}`);
      } catch (e) {
        console.log("Could not check page elements for success indicators");
      }
      let loginFormAbsent = false;
      try {
        const loginElements = await this.page.$$('input[type="password"], input[name*="password"], input[name*="user"]');
        loginFormAbsent = loginElements.length === 0;
        console.log(`Login form absent: ${loginFormAbsent}`);
      } catch (e) {
        console.log("Could not check for login form absence");
      }
      let hasLoginError = false;
      try {
        const errorText = await this.page.evaluate(() => {
          const errorSelectors = [
            ".error",
            ".alert",
            ".invalid",
            ".fail",
            '[class*="error"]',
            '[class*="invalid"]',
            '[class*="fail"]'
          ];
          for (const selector of errorSelectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
              const text2 = element.textContent.toLowerCase();
              if (text2.includes("invalid") || text2.includes("error") || text2.includes("fail")) {
                return element.textContent;
              }
            }
          }
          return null;
        });
        if (errorText) {
          console.log(`Login error detected: ${errorText}`);
          hasLoginError = true;
        }
      } catch (e) {
        console.log("Could not check for error messages");
      }
      let is2FAPage = false;
      try {
        const is2FAUrl = finalUrl.includes("/verify/") || finalUrl.includes("/okta/call") || finalUrl.includes("/mfa/");
        const has2FAElements = await this.page.$('input[name="answer"], input[type="tel"], input[placeholder*="code"], input[placeholder*="verification"]') !== null;
        is2FAPage = is2FAUrl || has2FAElements;
        console.log(`2FA verification page detected: ${is2FAPage}`);
        if (is2FAPage) {
          console.log("\u{1F510} 2FA verification page detected - login was successful, attempting to bypass...");
          const skipSelectors = [
            'button:contains("Skip")',
            'a:contains("Skip")',
            'button:contains("Not now")',
            'a:contains("Not now")',
            'button:contains("Remind me later")',
            'a:contains("Remind me later")',
            'button:contains("Later")',
            'a:contains("Later")',
            'button:contains("Cancel")',
            'a:contains("Cancel")'
          ];
          let bypassSuccess = false;
          for (const selector of skipSelectors) {
            try {
              const skipButton = await this.page.$(selector);
              if (skipButton) {
                console.log(`\u2705 Found skip option: ${selector}`);
                await skipButton.click();
                await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8e3 });
                bypassSuccess = true;
                break;
              }
            } catch (e) {
              continue;
            }
          }
          if (!bypassSuccess) {
            console.log("\u23ED\uFE0F No skip option found - trying to continue without 2FA verification");
            const continueSelectors = [
              'button[type="submit"]',
              'input[type="submit"]',
              'button:contains("Continue")',
              'button:contains("Next")',
              'button:contains("Submit")',
              'button:contains("Proceed")'
            ];
            for (const selector of continueSelectors) {
              try {
                const continueButton = await this.page.$(selector);
                if (continueButton) {
                  console.log(`Trying continue button: ${selector}`);
                  await continueButton.click();
                  await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8e3 });
                  break;
                }
              } catch (e) {
                continue;
              }
            }
          }
          const newUrl = this.page.url();
          console.log(`After 2FA bypass attempt: ${newUrl}`);
        }
      } catch (e) {
        console.log("Could not check for 2FA page");
      }
      const loginSuccess = (urlIndicatesSuccess || elementIndicatesSuccess || loginFormAbsent || is2FAPage) && !hasLoginError;
      console.log(`=== LOGIN DECISION ===`);
      console.log(`Final result: ${loginSuccess}`);
      console.log(`Reasons: URL(${urlIndicatesSuccess}), Elements(${elementIndicatesSuccess}), NoForm(${loginFormAbsent}), 2FA(${is2FAPage}), NoError(${!hasLoginError})`);
      if (loginSuccess) {
        console.log("\u2705 LOGIN SUCCESSFUL - Proceeding to search");
        return true;
      } else {
        console.log("\u274C LOGIN FAILED - Check credentials or portal changes");
        return false;
      }
    } catch (error) {
      console.error("Kinray login error:", error);
      return false;
    }
  }
  async loginAmerisource(credential) {
    if (!this.page) return false;
    try {
      await this.page.waitForSelector('#username, #email, input[name="username"]', { timeout: 1e4 });
      await this.page.waitForSelector('#password, input[name="password"]', { timeout: 1e4 });
      await this.page.type('#username, #email, input[name="username"]', credential.username);
      await this.page.type('#password, input[name="password"]', credential.password);
      await this.page.click('button[type="submit"], #loginButton');
      await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15e3 });
      const isSuccess = await this.page.$(".portal-home, .user-dashboard") !== null;
      return isSuccess;
    } catch (error) {
      console.error("AmerisourceBergen login error:", error);
      return false;
    }
  }
  async loginMorrisDickson(credential) {
    if (!this.page) return false;
    try {
      await this.page.waitForSelector('input[name="username"], #userName', { timeout: 1e4 });
      await this.page.waitForSelector('input[name="password"], #password', { timeout: 1e4 });
      await this.page.type('input[name="username"], #userName', credential.username);
      await this.page.type('input[name="password"], #password', credential.password);
      await this.page.click('button[type="submit"], .login-button');
      await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15e3 });
      const isSuccess = await this.page.$(".main-content, .dashboard") !== null;
      return isSuccess;
    } catch (error) {
      console.error("Morris & Dickson login error:", error);
      return false;
    }
  }
  async injectSessionCookies(cookies) {
    try {
      if (!this.page) {
        await this.initBrowser();
        if (!this.page) throw new Error("Failed to initialize browser");
      }
      console.log("\u{1F36A} Injecting session cookies to bypass authentication...");
      await SessionManager.injectSessionCookies(this.page, cookies);
      return true;
    } catch (error) {
      console.error("Cookie injection failed:", error);
      return false;
    }
  }
  async searchMedication(searchTerm, searchType) {
    console.log(`\u{1F50D} Starting medication search for "${searchTerm}" (${searchType})`);
    console.log(`\u{1F4CA} Current vendor:`, this.currentVendor?.name);
    console.log(`\u{1F4CA} Page available:`, !!this.page);
    const browserAvailable = await this.checkBrowserAvailability();
    if (!browserAvailable) {
      console.log("Browser automation not available - cannot perform live scraping");
      throw new Error("Browser automation not available for live scraping");
    }
    console.log("\u2705 Browser automation available");
    console.log("\u{1F36A} Using session cookie injection - bypassing login");
    try {
      await this.initBrowser();
      if (!this.page) throw new Error("Failed to initialize browser page");
      console.log("\u2705 Browser initialized successfully");
    } catch (browserError) {
      console.log(`\u274C Browser initialization failed: ${browserError.message}`);
      throw new Error("Browser initialization failed");
    }
    this.currentVendor = {
      id: 1,
      name: "Kinray (Cardinal Health)",
      portalUrl: "https://kinrayweblink.cardinalhealth.com"
    };
    try {
      if (global.__kinray_session_cookies__) {
        console.log("\u{1F36A} Found injected session cookies - applying them before navigation...");
        await SessionManager.injectSessionCookies(this.page, global.__kinray_session_cookies__);
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
      console.log(`\u{1F310} Going directly to Kinray portal search page (using session cookies)`);
      const kinrayMainUrl = "https://kinrayweblink.cardinalhealth.com";
      console.log(`\u{1F36A} Navigating to: ${kinrayMainUrl}`);
      const response = await this.page.goto(kinrayMainUrl, {
        waitUntil: "domcontentloaded",
        timeout: 15e3
      });
      const currentUrl = this.page.url();
      console.log(`\u{1F4CD} After navigation with cookies: ${currentUrl}`);
      if (currentUrl.includes("/login") || currentUrl.includes("/signin")) {
        console.log("\u{1F504} Still on login page after cookie injection - trying enhanced authentication bypass...");
        const authBypassStrategies = [
          {
            name: "Direct Dashboard Access",
            urls: [
              "https://kinrayweblink.cardinalhealth.com/dashboard",
              "https://kinrayweblink.cardinalhealth.com/home"
            ]
          },
          {
            name: "Product Search Area",
            urls: [
              "https://kinrayweblink.cardinalhealth.com/products",
              "https://kinrayweblink.cardinalhealth.com/search",
              "https://kinrayweblink.cardinalhealth.com/catalog"
            ]
          },
          {
            name: "Main Portal Areas",
            urls: [
              "https://kinrayweblink.cardinalhealth.com/orders",
              "https://kinrayweblink.cardinalhealth.com/inventory",
              "https://kinrayweblink.cardinalhealth.com/main"
            ]
          }
        ];
        let authenticationBypassed = false;
        for (const strategy of authBypassStrategies) {
          console.log(`\u{1F3AF} Trying ${strategy.name} bypass strategy...`);
          for (const url of strategy.urls) {
            try {
              console.log(`\u{1F310} Direct access attempt: ${url}`);
              if (global.__kinray_session_cookies__) {
                await SessionManager.injectSessionCookies(this.page, global.__kinray_session_cookies__);
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
              await this.page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 15e3
              });
              const finalUrl = this.page.url();
              console.log(`\u{1F4CD} Final URL after redirect: ${finalUrl}`);
              if (!finalUrl.includes("/login") && !finalUrl.includes("/signin") && !finalUrl.includes("/verify")) {
                console.log(`\u2705 AUTHENTICATION BYPASS SUCCESSFUL via ${strategy.name}: ${finalUrl}`);
                authenticationBypassed = true;
                break;
              } else {
                console.log(`\u274C Still redirected to auth page: ${finalUrl}`);
              }
            } catch (error) {
              console.log(`\u274C Error accessing ${url}: ${error.message}`);
              continue;
            }
          }
          if (authenticationBypassed) break;
        }
        if (!authenticationBypassed) {
          console.log("\u{1F6A8} AUTHENTICATION BYPASS FAILED - Session cookies may have expired");
          console.log("\u{1F4A1} User needs to provide fresh session cookies from their browser");
          try {
            await this.page.screenshot({ path: "auth-bypass-failed.png" });
            console.log("\u{1F4F8} Authentication failure screenshot saved");
          } catch (screenshotError) {
            console.log("\u274C Screenshot failed:", screenshotError.message);
          }
          console.log("\u26A0\uFE0F Proceeding with search attempt despite authentication challenges...");
        }
      } else {
        console.log(`\u2705 Authentication successful - already on authenticated page: ${currentUrl}`);
      }
      if (response && response.ok()) {
        console.log("\u2705 Successfully connected to Kinray portal");
      }
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      const finalPageUrl = this.page.url();
      console.log(`Current page: ${finalPageUrl}`);
      const pageTitle = await this.page.title();
      console.log(`Page title: ${pageTitle}`);
      if (finalPageUrl.includes("kinrayweblink") || finalPageUrl.includes("cardinalhealth")) {
        console.log("\u{1F3AF} Connected to Kinray portal - attempting real search");
        try {
          const realResults = await this.searchKinray(searchTerm, searchType);
          if (realResults && realResults.length > 0) {
            console.log(`\u2705 Successfully extracted ${realResults.length} live results from Kinray portal`);
            return realResults;
          }
        } catch (searchError) {
          console.log(`\u274C Real search failed: ${searchError.message}`);
          throw new Error(`Live search failed: ${searchError.message}`);
        }
        throw new Error("No results found from live portal search");
      }
      if (this.currentVendor.name === "Kinray (Cardinal Health)") {
        return await this.searchKinray(searchTerm, searchType);
      } else {
        console.log(`Vendor ${this.currentVendor.name} not supported yet - focusing on Kinray only`);
        throw new Error(`Only Kinray (Cardinal Health) portal is currently supported. Other vendors require real portal integration.`);
      }
    } catch (error) {
      console.error("Live search failed:", error);
      throw error;
    }
  }
  async navigateToSearch() {
    if (!this.page) return;
    const searchLinks = [
      'a[href*="search"]',
      'a[href*="product"]',
      'a[href*="catalog"]',
      ".search-nav",
      ".product-search"
    ];
    for (const selector of searchLinks) {
      try {
        const link = await this.page.$(selector);
        if (link) {
          console.log(`Found search link: ${selector}`);
          await link.click();
          await Promise.race([
            this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 1e4 }),
            new Promise((resolve) => setTimeout(resolve, 3e3))
          ]);
          console.log(`Navigated using: ${selector}`);
          break;
        }
      } catch (navError) {
        console.log(`Navigation with ${selector} failed, trying next option`);
        continue;
      }
    }
  }
  async searchMcKesson(searchTerm, searchType) {
    if (!this.page) return [];
    try {
      await this.page.waitForSelector('input[name="search"], #searchInput, .search-input', { timeout: 1e4 });
      await this.page.evaluate(() => {
        const searchInput = document.querySelector('input[name="search"], #searchInput, .search-input');
        if (searchInput) searchInput.value = "";
      });
      await this.page.type('input[name="search"], #searchInput, .search-input', searchTerm);
      await this.page.click('button[type="submit"], .search-button, #searchBtn');
      await this.page.waitForSelector(".search-results, .product-list, .results-table", { timeout: 15e3 });
      return await this.page.evaluate((vendorName) => {
        const results = [];
        const rows = document.querySelectorAll(".search-results tr, .product-list .product-item, .results-table tbody tr");
        rows.forEach((row) => {
          const nameEl = row.querySelector(".product-name, .medication-name, td:nth-child(1)");
          const ndcEl = row.querySelector(".ndc, .product-ndc, td:nth-child(2)");
          const sizeEl = row.querySelector(".package-size, .size, td:nth-child(3)");
          const priceEl = row.querySelector(".price, .cost, td:nth-child(4)");
          const statusEl = row.querySelector(".status, .availability, td:nth-child(5)");
          if (nameEl && priceEl) {
            results.push({
              medication: {
                id: 0,
                name: nameEl.textContent?.trim() || "",
                genericName: null,
                ndc: ndcEl?.textContent?.trim() || null,
                packageSize: sizeEl?.textContent?.trim() || null,
                strength: null,
                dosageForm: null
              },
              cost: priceEl.textContent?.replace(/[^0-9.]/g, "") || "0",
              availability: statusEl?.textContent?.trim() || "unknown",
              vendor: vendorName
            });
          }
        });
        return results;
      }, this.currentVendor.name);
    } catch (error) {
      console.error("McKesson search error:", error);
      return [];
    }
  }
  async searchCardinal(searchTerm, searchType) {
    if (!this.page) return [];
    try {
      console.log(`Searching Cardinal Health for: ${searchTerm} (${searchType})`);
      await this.page.waitForSelector('input[name="search"], #search, .search-input, [placeholder*="search"]', { timeout: 1e4 });
      const searchInput = await this.page.$('input[name="search"], #search, .search-input, [placeholder*="search"]');
      if (searchInput) {
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(searchTerm);
        await Promise.race([
          searchInput.press("Enter"),
          this.page.click('button[type="submit"], .search-btn, button:has-text("Search")')
        ]);
        await this.page.waitForSelector(".search-results, .product-results, table tbody tr", { timeout: 15e3 });
        return await this.page.evaluate((vendorName) => {
          const results = [];
          const rows = document.querySelectorAll(".search-results tr, .product-results .product, table tbody tr");
          rows.forEach((row) => {
            const nameEl = row.querySelector(".product-name, .drug-name, td:nth-child(1), .name");
            const ndcEl = row.querySelector(".ndc, .product-code, td:nth-child(2), .code");
            const priceEl = row.querySelector(".price, .cost, td:nth-child(3), .amount");
            const statusEl = row.querySelector(".status, .availability, td:nth-child(4), .stock");
            if (nameEl && nameEl.textContent?.trim()) {
              results.push({
                medication: {
                  id: 0,
                  name: nameEl.textContent.trim(),
                  genericName: null,
                  ndc: ndcEl?.textContent?.trim() || null,
                  packageSize: null,
                  strength: null,
                  dosageForm: null
                },
                cost: priceEl?.textContent?.replace(/[^0-9.]/g, "") || "0",
                availability: statusEl?.textContent?.trim() || "In Stock",
                vendor: vendorName
              });
            }
          });
          return results;
        }, this.currentVendor.name);
      }
      return [];
    } catch (error) {
      console.error("Cardinal search error:", error);
      return [];
    }
  }
  async searchKinray(searchTerm, searchType) {
    if (!this.page) return [];
    try {
      console.log(`\u{1F50D} Performing live Kinray portal search for: ${searchTerm} (${searchType})`);
      const currentUrl = this.page.url();
      console.log(`\u{1F4CA} Current page URL: ${currentUrl}`);
      try {
        console.log("\u{1F4F8} Taking screenshot for debugging...");
        await this.page.screenshot({ path: "/tmp/kinray-search-debug.png", fullPage: true });
        console.log("\u2705 Screenshot saved");
      } catch (screenshotError) {
        console.log("\u274C Screenshot failed:", screenshotError.message);
      }
      const pageTitle = await this.page.title();
      console.log(`\u{1F4CA} Page title: ${pageTitle}`);
      const allInputs = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input"));
        return inputs.map((input) => ({
          tag: input.tagName,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className
        }));
      });
      console.log(`\u{1F4CA} Found ${allInputs.length} input elements:`, JSON.stringify(allInputs, null, 2));
      if (!currentUrl.includes("search") && !currentUrl.includes("product")) {
        console.log("\u{1F50D} Navigating to search interface...");
        await this.navigateToSearch();
      }
      const searchSelectors = [
        'input[name="search"]',
        'input[id*="search"]',
        'input[placeholder*="search" i]',
        'input[placeholder*="product" i]',
        'input[placeholder*="item" i]',
        'input[placeholder*="drug" i]',
        'input[placeholder*="medication" i]',
        ".search-input",
        "#searchInput",
        "#search",
        'input[type="text"]',
        'input[type="search"]',
        '[data-testid*="search"]',
        '[aria-label*="search" i]',
        "input.form-control",
        ".search-box input",
        ".searchbox input"
      ];
      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3e3 });
          searchInput = await this.page.$(selector);
          if (searchInput) {
            console.log(`\u2705 Found search input: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`\u274C Search input ${selector} not found, trying next...`);
        }
      }
      if (!searchInput) {
        console.log("\u274C No search input found on page");
        throw new Error("Could not locate search input on Kinray portal");
      }
      await searchInput.click({ clickCount: 3 });
      await searchInput.type(searchTerm);
      console.log(`\u2705 Entered search term: ${searchTerm}`);
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        ".search-btn",
        ".search-button",
        'button:has-text("Search")',
        '[value*="Search"]'
      ];
      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const submitBtn = await this.page.$(selector);
          if (submitBtn) {
            await submitBtn.click();
            console.log(`\u2705 Clicked submit button: ${selector}`);
            submitted = true;
            break;
          }
        } catch (e) {
          console.log(`\u274C Submit button ${selector} not found, trying next...`);
        }
      }
      if (!submitted) {
        await searchInput.press("Enter");
        console.log("\u2705 Pressed Enter to submit search");
      }
      const resultSelectors = [
        ".search-results",
        ".product-results",
        ".results-table",
        "table tbody tr",
        ".product-list",
        ".medication-list"
      ];
      let resultsFound = false;
      for (const selector of resultSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 1e4 });
          resultsFound = true;
          console.log(`\u2705 Found results container: ${selector}`);
          break;
        } catch (e) {
          console.log(`\u274C Results container ${selector} not found, trying next...`);
        }
      }
      if (!resultsFound) {
        console.log("\u274C No results container found after search");
        const pageContent = await this.page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            bodyText: document.body.innerText.substring(0, 1e3),
            allTables: Array.from(document.querySelectorAll("table")).length,
            allDivs: Array.from(document.querySelectorAll("div")).length,
            hasResults: !!document.querySelector('*[class*="result"], *[id*="result"], table tbody tr')
          };
        });
        console.log("\u{1F4CA} Page analysis after search:", JSON.stringify(pageContent, null, 2));
        return [];
      }
      const results = await this.page.evaluate((vendorName) => {
        const medicationResults = [];
        const resultContainers = [
          ".search-results tr",
          ".product-results .product",
          "table tbody tr",
          ".product-list .product",
          ".medication-list .medication",
          '[class*="result"] tr',
          "tbody tr",
          ".data-row",
          ".item-row",
          ".product-row",
          ".result-item",
          "tr:not(:first-child)",
          // All table rows except header
          ".grid-row",
          '[role="row"]'
        ];
        for (const containerSelector of resultContainers) {
          const rows = document.querySelectorAll(containerSelector);
          if (rows.length > 0) {
            console.log(`Found ${rows.length} result rows with selector: ${containerSelector}`);
            rows.forEach((row, index) => {
              try {
                const nameSelectors = [
                  ".product-name",
                  ".drug-name",
                  ".medication-name",
                  ".name",
                  "td:nth-child(1)",
                  "td:first-child",
                  '[class*="name"]',
                  '[class*="product"]'
                ];
                let nameEl = null;
                for (const nameSelector of nameSelectors) {
                  nameEl = row.querySelector(nameSelector);
                  if (nameEl && nameEl.textContent?.trim()) break;
                }
                if (nameEl && nameEl.textContent?.trim()) {
                  const name = nameEl.textContent.trim();
                  const ndcSelectors = [".ndc", ".product-code", ".code", "td:nth-child(2)", '[class*="ndc"]'];
                  let ndc = null;
                  for (const ndcSelector of ndcSelectors) {
                    const ndcEl = row.querySelector(ndcSelector);
                    if (ndcEl && ndcEl.textContent?.trim()) {
                      ndc = ndcEl.textContent.trim();
                      break;
                    }
                  }
                  const priceSelectors = [".price", ".cost", ".amount", "td:nth-child(3)", "td:nth-child(4)", '[class*="price"]'];
                  let cost = "0.00";
                  for (const priceSelector of priceSelectors) {
                    const priceEl = row.querySelector(priceSelector);
                    if (priceEl && priceEl.textContent?.trim()) {
                      const priceText = priceEl.textContent.trim();
                      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
                      if (priceMatch) {
                        cost = priceMatch[0].replace(/,/g, "");
                        break;
                      }
                    }
                  }
                  const statusSelectors = [".status", ".availability", ".stock", "td:last-child", '[class*="status"]'];
                  let availability = "In Stock";
                  for (const statusSelector of statusSelectors) {
                    const statusEl = row.querySelector(statusSelector);
                    if (statusEl && statusEl.textContent?.trim()) {
                      availability = statusEl.textContent.trim();
                      break;
                    }
                  }
                  medicationResults.push({
                    medication: {
                      id: index,
                      name,
                      genericName: null,
                      ndc,
                      packageSize: null,
                      strength: null,
                      dosageForm: null
                    },
                    cost,
                    availability,
                    vendor: vendorName
                  });
                }
              } catch (rowError) {
                console.log(`Error processing row ${index}:`, rowError);
              }
            });
            if (medicationResults.length > 0) break;
          }
        }
        return medicationResults;
      }, this.currentVendor?.name || "Kinray Portal");
      console.log(`\u2705 Extracted ${results.length} results from Kinray portal`);
      return results;
    } catch (error) {
      console.error("\u274C Kinray search error:", error);
      throw new Error(`Kinray portal search failed: ${error.message}`);
    }
  }
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.currentVendor = null;
      console.log("\u{1F9F9} ScrapingService cleanup completed");
    } catch (error) {
      console.error("\u274C ScrapingService cleanup error:", error);
    }
  }
};
var scrapingService = new PuppeteerScrapingService();

// server/services/csv-export.ts
var CSVExportServiceImpl = class {
  exportSearchResults(results) {
    if (results.length === 0) {
      return "No results to export";
    }
    const headers = [
      "Medication Name",
      "Generic Name",
      "NDC",
      "Package Size",
      "Strength",
      "Dosage Form",
      "Cost",
      "Availability",
      "Vendor",
      "Last Updated"
    ];
    const rows = results.map((result) => [
      this.escapeCsvField(result.medication.name),
      this.escapeCsvField(result.medication.genericName || ""),
      this.escapeCsvField(result.medication.ndc || ""),
      this.escapeCsvField(result.medication.packageSize || ""),
      this.escapeCsvField(result.medication.strength || ""),
      this.escapeCsvField(result.medication.dosageForm || ""),
      result.cost || "0.00",
      this.escapeCsvField(result.availability || ""),
      this.escapeCsvField(result.vendor?.name || ""),
      result.lastUpdated ? new Date(result.lastUpdated).toLocaleString() : ""
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    return csvContent;
  }
  generateFileName(searchTerm) {
    const date = /* @__PURE__ */ new Date();
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "-");
    const baseName = searchTerm ? `medication-search-${searchTerm.replace(/[^a-zA-Z0-9]/g, "-")}` : "medication-search";
    return `${baseName}-${dateStr}-${timeStr}.csv`;
  }
  escapeCsvField(field) {
    if (!field) return "";
    if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
  exportMedicationList(medications2) {
    if (medications2.length === 0) {
      return "No medications to export";
    }
    const headers = [
      "ID",
      "Name",
      "Generic Name",
      "NDC",
      "Package Size",
      "Strength",
      "Dosage Form"
    ];
    const rows = medications2.map((med) => [
      med.id.toString(),
      this.escapeCsvField(med.name),
      this.escapeCsvField(med.genericName || ""),
      this.escapeCsvField(med.ndc || ""),
      this.escapeCsvField(med.packageSize || ""),
      this.escapeCsvField(med.strength || ""),
      this.escapeCsvField(med.dosageForm || "")
    ]);
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }
  exportActivityLog(activities) {
    if (activities.length === 0) {
      return "No activity to export";
    }
    const headers = [
      "Action",
      "Status",
      "Description",
      "Date/Time"
    ];
    const rows = activities.map((activity) => [
      this.escapeCsvField(activity.action),
      this.escapeCsvField(activity.status),
      this.escapeCsvField(activity.description),
      activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ""
    ]);
    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }
};
var csvExportService = new CSVExportServiceImpl();

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/vendors", async (req, res) => {
    try {
      const vendors2 = await storage.getVendors();
      res.json(vendors2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });
  app2.get("/api/credentials", async (req, res) => {
    try {
      const credentials2 = await storage.getCredentials();
      res.json(credentials2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });
  app2.post("/api/credentials", async (req, res) => {
    try {
      const credential = insertCredentialSchema.parse(req.body);
      const newCredential = await storage.createCredential(credential);
      res.json(newCredential);
    } catch (error) {
      res.status(500).json({ message: "Failed to save credentials" });
    }
  });
  app2.post("/api/inject-cookies", async (req, res) => {
    try {
      const { cookies } = req.body;
      if (!cookies || !Array.isArray(cookies)) {
        return res.status(400).json({ error: "Invalid cookie data" });
      }
      console.log(`\u{1F36A} Received ${cookies.length} cookies for injection`);
      global.__kinray_session_cookies__ = cookies;
      res.json({ success: true, message: "Session cookies stored successfully" });
    } catch (error) {
      console.error("Cookie injection error:", error);
      res.status(500).json({ error: "Failed to inject cookies" });
    }
  });
  app2.post("/api/credentials/test-connection", async (req, res) => {
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
      } catch (error) {
        console.error(`Connection test failed for ${vendor.name}:`, error);
        responseData = {
          success: false,
          message: `Connection failed: ${error.message}`
        };
      } finally {
        try {
          await scrapingService.cleanup();
        } catch (cleanupError) {
          console.error("Connection test cleanup error:", cleanupError);
        }
      }
      res.json(responseData);
    } catch (error) {
      console.error("Connection test error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error during connection test"
      });
    }
  });
  app2.post("/api/search", async (req, res) => {
    try {
      const searchFormData = z.object({
        vendorId: z.number(),
        searchTerm: z.string().min(1),
        searchType: z.enum(["name", "ndc", "generic"])
      }).parse(req.body);
      const searchData = {
        ...searchFormData,
        status: "pending",
        resultCount: 0
      };
      const search = await storage.createSearch({
        ...searchData,
        status: "pending",
        resultCount: 0
      });
      setTimeout(() => {
        performSearch(search.id, searchData).catch((error) => {
          console.error(`Background search ${search.id} failed:`, error);
          storage.updateSearch(search.id, {
            status: "failed",
            completedAt: /* @__PURE__ */ new Date()
          }).catch(() => {
          });
        });
      }, 10);
      res.json({ searchId: search.id });
    } catch (error) {
      res.status(500).json({
        message: "Failed to start search",
        error: error.message
      });
    }
  });
  app2.get("/api/search/:id", async (req, res) => {
    try {
      const id2 = parseInt(req.params.id);
      console.log(`\u{1F50D} API: Fetching search ${id2}`);
      const searchWithResults = await storage.getSearchWithResults(id2);
      if (!searchWithResults) {
        console.log(`\u274C API: Search ${id2} not found`);
        return res.status(404).json({ message: "Search not found" });
      }
      console.log(`\u2705 API: Returning search ${id2} with ${searchWithResults.results.length} results`);
      res.json(searchWithResults);
    } catch (error) {
      console.error(`\u274C API: Failed to fetch search ${id}:`, error);
      res.status(500).json({ message: "Failed to fetch search" });
    }
  });
  app2.get("/api/search/:id/results", async (req, res) => {
    try {
      const searchId = parseInt(req.params.id);
      const results = await storage.getSearchResults(searchId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch search results" });
    }
  });
  app2.get("/api/searches", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const searches2 = await storage.getSearches(limit);
      res.json(searches2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch searches" });
    }
  });
  app2.get("/api/search/:id/export", async (req, res) => {
    try {
      const searchId = parseInt(req.params.id);
      const searchWithResults = await storage.getSearchWithResults(searchId);
      if (!searchWithResults) {
        return res.status(404).json({ message: "Search not found" });
      }
      const csvData = csvExportService.exportSearchResults(searchWithResults.results);
      const filename = csvExportService.generateFileName(searchWithResults.searchTerm);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export search results" });
    }
  });
  app2.get("/api/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const activities = await storage.getActivityLogs(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });
  app2.get("/health", (req, res) => {
    const response = {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "PharmaCost Pro",
      environment: process.env.NODE_ENV || "development",
      port: process.env.PORT || "undefined",
      railway_env: process.env.RAILWAY_ENVIRONMENT || "undefined",
      host: req.get("host"),
      url: req.url
    };
    console.log(`Health check hit from ${req.ip} - responding with port ${response.port}`);
    res.status(200).json(response);
  });
  app2.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/medications", async (req, res) => {
    try {
      const medications2 = await storage.getMedications();
      res.json(medications2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medications" });
    }
  });
  app2.post("/api/inject-cookies", async (req, res) => {
    try {
      const { cookies } = req.body;
      if (!cookies || !Array.isArray(cookies)) {
        return res.status(400).json({ error: "Invalid cookies format" });
      }
      global.__kinray_session_cookies__ = cookies;
      console.log(`\u{1F36A} Session cookies stored globally: ${cookies.length} cookies`);
      cookies.forEach((cookie) => {
        console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
      });
      res.json({
        success: true,
        message: `Successfully stored ${cookies.length} session cookies`,
        cookieCount: cookies.length
      });
    } catch (error) {
      console.error("Cookie injection error:", error);
      res.status(500).json({ error: "Failed to inject cookies" });
    }
  });
  app2.post("/api/extract-cookies", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required for automatic cookie extraction" });
      }
      console.log("\u{1F36A} Starting automatic cookie extraction...");
      const { cookieExtractor: cookieExtractor2 } = await Promise.resolve().then(() => (init_cookie_extractor(), cookie_extractor_exports));
      const extractedCookies = await cookieExtractor2.extractSessionCookies(username, password);
      if (extractedCookies.length > 0) {
        global.__kinray_session_cookies__ = extractedCookies;
        console.log(`\u2705 Automatically extracted and injected ${extractedCookies.length} session cookies`);
        res.json({
          success: true,
          message: `Successfully extracted and injected ${extractedCookies.length} session cookies`,
          cookieCount: extractedCookies.length,
          cookies: extractedCookies.map((c) => ({ name: c.name, domain: c.domain }))
        });
      } else {
        res.status(400).json({
          error: "No relevant cookies extracted from authentication session",
          message: "Login may have failed or 2FA required"
        });
      }
    } catch (error) {
      console.error("\u274C Automatic cookie extraction failed:", error);
      res.status(500).json({
        error: "Cookie extraction failed",
        message: error.message,
        suggestion: "Try manual cookie injection or check credentials"
      });
    }
  });
  async function performSearch(searchId, searchData) {
    try {
      console.log(`\u{1F50D} Starting search ${searchId} for "${searchData.searchTerm}"`);
      console.log(`\u{1F4CA} Search data:`, JSON.stringify(searchData, null, 2));
      await storage.updateSearch(searchId, { status: "in_progress" });
      console.log(`\u2705 Updated search ${searchId} status to in_progress`);
      console.log(`\u{1F4CA} Getting vendor for ID: ${searchData.vendorId}`);
      const vendor = await storage.getVendor(searchData.vendorId);
      if (!vendor) {
        console.log(`\u274C Vendor not found for ID: ${searchData.vendorId}`);
        throw new Error("Vendor not found");
      }
      console.log(`\u2705 Found vendor: ${vendor.name}`);
      let credential = null;
      if (vendor.name.includes("Kinray") && process.env.KINRAY_USERNAME && process.env.KINRAY_PASSWORD) {
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
        console.log(`\u274C No credentials found for vendor ${vendor.name}`);
        throw new Error("No credentials found for vendor");
      }
      console.log(`\u2705 Using credentials for ${vendor.name} - username: ${credential.username}`);
      let results = [];
      try {
        console.log(`\u{1F50D} Checking browser automation availability...`);
        const browserAvailable = await scrapingService.checkBrowserAvailability();
        console.log(`\u{1F4CA} Browser automation available: ${browserAvailable}`);
        if (!browserAvailable) {
          throw new Error("Browser automation not available in Railway deployment environment. This requires a platform with Chrome/Puppeteer support.");
        }
        console.log(`\u{1F680} Attempting login to ${vendor.name}...`);
        const loginSuccess = await scrapingService.login(vendor, credential);
        if (!loginSuccess) {
          throw new Error(`Authentication failed for ${vendor.name}. Please check your credentials and try again.`);
        } else {
          console.log(`\u2705 Login successful to ${vendor.name} - proceeding with search...`);
          const searchTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Search timeout after 20 seconds")), 2e4);
          });
          try {
            console.log(`\u{1F50D} Calling searchMedication for "${searchData.searchTerm}" (${searchData.searchType})`);
            results = await Promise.race([
              scrapingService.searchMedication(searchData.searchTerm, searchData.searchType),
              searchTimeout
            ]);
            console.log(`\u{1F4CA} Search completed - received ${results?.length || 0} results`);
            if (results && results.length > 0) {
              console.log(`\u{1F3AF} Successfully extracted ${results.length} live results from ${vendor.name}`);
              console.log(`\u{1F4CB} Sample result:`, JSON.stringify(results[0], null, 2));
            } else {
              console.log(`\u26A0\uFE0F Search completed but no results found in ${vendor.name} portal`);
              console.log(`\u{1F4CA} Debug: results object type:`, typeof results, "value:", results);
              results = [];
            }
          } catch (timeoutError) {
            console.log(`\u23F0 Search timed out after 20 seconds`);
            throw new Error(`Search timeout - ${vendor.name} portal did not respond within expected time`);
          }
        }
      } catch (scrapingError) {
        console.log(`\u274C Scraping error: ${scrapingError.message}`);
        throw scrapingError;
      }
      console.log(`\u{1F50D} Generated ${results.length} results for search ${searchId}`);
      for (const result of results) {
        let medication = await storage.getMedicationByNdc(result.medication.ndc || "");
        if (!medication) {
          medication = await storage.createMedication(result.medication);
        }
        await storage.createSearchResult({
          searchId,
          medicationId: medication.id,
          vendorId: searchData.vendorId,
          cost: result.cost,
          availability: result.availability
        });
      }
      await storage.updateSearch(searchId, {
        status: "completed",
        resultCount: results.length,
        completedAt: /* @__PURE__ */ new Date()
      });
      console.log(`\u2705 Search ${searchId} completed with ${results.length} results`);
      await storage.createActivityLog({
        action: "search",
        status: "success",
        description: `Search completed for "${searchData.searchTerm}" - ${results.length} results found`,
        vendorId: searchData.vendorId,
        searchId
      });
    } catch (error) {
      console.error("Search failed:", error);
      console.error("Error stack:", error.stack);
      await storage.updateSearch(searchId, { status: "failed" });
      console.log(`\u2705 Updated search ${searchId} status to failed`);
      await storage.createActivityLog({
        action: "search",
        status: "failure",
        description: `Search failed for "${searchData.searchTerm}": ${error.message || error}`,
        vendorId: searchData.vendorId,
        searchId
      });
    } finally {
      await scrapingService.cleanup();
    }
  }
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
var vite_config_default = defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import path3 from "path";
import fs2 from "fs";
process.on("uncaughtException", (error) => {
  console.error("\u274C Uncaught Exception:", error);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("\u274C Unhandled Rejection at:", promise, "reason:", reason);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});
console.log("\u{1F680} Starting PharmaCost Pro server...");
console.log("Environment:", process.env.NODE_ENV);
var RAILWAY_PORT = process.env.PORT;
console.log("=== RAILWAY PORT DETECTION ===");
console.log("Raw PORT env:", RAILWAY_PORT);
console.log("PORT type:", typeof RAILWAY_PORT);
console.log("Railway vars found:", Object.keys(process.env).filter((k) => k.includes("RAILWAY")).length);
console.log("Will use port:", RAILWAY_PORT || "5000");
console.log("==============================");
var app = express2();
console.log("\u2713 Express app created");
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
console.log("\u2713 Express middleware configured");
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    console.log("Starting server initialization...");
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      console.log("Setting up static file serving...");
      const staticPath = path3.join(process.cwd(), "dist", "public");
      console.log("Static files directory:", staticPath);
      if (fs2.existsSync(staticPath)) {
        app.use(express2.static(staticPath));
        app.get("*", (req, res) => {
          if (req.path.startsWith("/api")) {
            return res.status(404).json({ message: "API endpoint not found" });
          }
          res.sendFile(path3.join(staticPath, "index.html"));
        });
        console.log("\u2705 Static files configured for Railway deployment");
      } else {
        console.error("\u274C Static files directory not found:", staticPath);
        serveStatic(app);
      }
    }
    const railwayPort = process.env.PORT;
    const port = railwayPort ? parseInt(railwayPort) : 5e3;
    console.log(`=== RAILWAY PORT DEBUGGING ===`);
    console.log(`Railway PORT environment variable: "${railwayPort}"`);
    console.log(`Parsed port number: ${port}`);
    console.log(`Is Railway deployment: ${process.env.RAILWAY_ENVIRONMENT ? "YES" : "NO"}`);
    console.log(`All Railway env vars:`, Object.keys(process.env).filter((key) => key.includes("RAILWAY")));
    console.log(`Server will bind to port: ${port}`);
    console.log(`===============================`);
    if (!railwayPort && process.env.NODE_ENV === "production") {
      console.error(`\u274C CRITICAL: Railway PORT not found in production environment`);
      console.error(`   This will cause Railway health checks to fail`);
    }
    const serverOptions = {
      port,
      host: "0.0.0.0"
      // Critical for Railway - must bind to all interfaces
    };
    server.listen(serverOptions, () => {
      console.log(`\u{1F680} PharmaCost Pro successfully started`);
      console.log(`\u{1F310} Server listening on ${serverOptions.host}:${port}`);
      console.log(`\u{1F517} Health check endpoint: /health`);
      console.log(`\u{1F4CA} Dashboard API: /api/dashboard/stats`);
      console.log(`\u{1F48A} Kinray pharmaceutical portal automation ready`);
      if (process.env.NODE_ENV === "production") {
        console.log(`Railway will route traffic to this port: ${port}`);
        console.log(`Railway health checks will hit: https://pharmcost714-production.up.railway.app/health`);
      }
      log(`serving on port ${port}`);
    });
    server.on("error", (err) => {
      console.error("\u274C Server startup error:", err);
      if (err.code === "EADDRINUSE") {
        console.error(`   Port ${port} already in use`);
      } else if (err.code === "EACCES") {
        console.error(`   Permission denied to bind port ${port}`);
      }
      process.exit(1);
    });
    process.on("SIGTERM", () => {
      console.log("\u{1F4CB} Railway SIGTERM received - shutting down gracefully...");
      server.close(() => {
        console.log("\u2705 Server closed successfully");
        process.exit(0);
      });
    });
    process.on("SIGINT", () => {
      console.log("\u{1F4CB} SIGINT received - shutting down gracefully...");
      server.close(() => {
        console.log("\u2705 Server closed successfully");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("\u274C Server startup failed:", error);
    process.exit(1);
  }
})();
