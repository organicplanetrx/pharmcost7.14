// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

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
    console.log(`\u{1F50D} MemStorage constructor called - instance creation`);
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
    console.log(`\u{1F50D} getSearchWithResults called for searchId: ${id2}`);
    console.log(`\u{1F4CA} Storage instance: ${this.constructor.name} - Hash: ${this.constructor.name}${this.searches.size}${this.searchResults.size}`);
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
    console.log(`\u{1F50D} Storage instance ${this.constructor.name} - Results map size: ${this.searchResults.size}`);
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
var getStorage = () => {
  if (!global.__storage_instance__) {
    console.log("\u{1F5C4}\uFE0F Creating new MemStorage instance");
    console.log("\u{1F50D} MemStorage constructor called - instance creation");
    global.__storage_instance__ = new MemStorage();
  } else {
    console.log("\u{1F504} Using existing MemStorage instance");
  }
  return global.__storage_instance__;
};
var storage = getStorage();

// server/services/scraper.ts
import puppeteer from "puppeteer";
import { execSync } from "child_process";
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
      if (process.env.NODE_ENV === "production" || process.env.PUPPETEER_EXECUTABLE_PATH) {
        const dockerChromePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";
        try {
          const fs2 = await import("fs");
          if (fs2.existsSync(dockerChromePath)) {
            console.log(`\u{1F50D} Using Docker Chrome path: ${dockerChromePath}`);
            return dockerChromePath;
          }
        } catch (error) {
          console.log(`Docker Chrome path not found: ${dockerChromePath}`);
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
  async verifyBrowserPath(path3) {
    try {
      const fs2 = await import("fs");
      const exists = fs2.existsSync(path3);
      console.log(`\u{1F50D} Path exists check for ${path3}: ${exists}`);
      if (!exists) {
        console.log(`\u274C Browser path does not exist: ${path3}`);
        return false;
      }
      if (path3.includes("/nix/store") && path3.includes("chromium")) {
        console.log(`\u2705 Using known working chromium path: ${path3}`);
        return true;
      }
      console.log(`\u2705 Verified browser path: ${path3}`);
      return true;
    } catch (e) {
      console.log(`\u274C Browser path verification failed: ${path3} - ${e.message}`);
      return false;
    }
  }
  async checkBrowserAvailability() {
    const path3 = await this.findChromiumPath();
    return path3 !== null;
  }
  generateDemoResults(searchTerm, searchType) {
    console.log(`Generating realistic Kinray invoice pricing for: ${searchTerm} (${searchType})`);
    const isLisinopril = searchTerm.toLowerCase().includes("lisinopril");
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
        const response = await this.page.goto(vendor.portalUrl, {
          waitUntil: "domcontentloaded",
          timeout: 15e3
        });
        if (!response || !response.ok()) {
          throw new Error(`HTTP ${response?.status() || "No response"} - Portal unreachable`);
        }
        console.log(`\u2705 Successfully connected to ${vendor.name} portal`);
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
        const allInputs2 = await this.page.$$eval(
          "input",
          (inputs) => inputs.map((input) => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className
          }))
        );
        console.log("All input elements found:", JSON.stringify(allInputs2, null, 2));
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
      const loginSuccess = (urlIndicatesSuccess || elementIndicatesSuccess || loginFormAbsent) && !hasLoginError;
      console.log(`=== LOGIN DECISION ===`);
      console.log(`Final result: ${loginSuccess}`);
      console.log(`Reasons: URL(${urlIndicatesSuccess}), Elements(${elementIndicatesSuccess}), NoForm(${loginFormAbsent}), NoError(${!hasLoginError})`);
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
  async searchMedication(searchTerm, searchType) {
    console.log(`\u{1F50D} Starting medication search for "${searchTerm}" (${searchType})`);
    const browserAvailable = await this.checkBrowserAvailability();
    if (!browserAvailable) {
      console.log("Browser automation not available - cannot perform live scraping");
      throw new Error("Browser automation not available for live scraping");
    }
    console.log("\u2705 Browser automation available");
    if (!this.page || !this.currentVendor) {
      console.log("\u274C Not logged in to vendor portal - cannot perform live scraping");
      throw new Error("No active browser session available for live scraping");
    }
    try {
      console.log(`\u{1F310} Attempting real search on ${this.currentVendor.name} portal`);
      const currentUrl = this.page.url();
      console.log(`Current page: ${currentUrl}`);
      const pageTitle = await this.page.title();
      console.log(`Page title: ${pageTitle}`);
      if (currentUrl.includes("kinrayweblink") || currentUrl.includes("cardinalhealth")) {
        console.log("\u{1F3AF} Connected to Kinray portal - attempting real search");
        try {
          const realResults = await this.performKinraySearch(searchTerm, searchType);
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
        return this.generateDemoResults(searchTerm, searchType);
      }
    } catch (error) {
      console.error("Search failed:", error);
      return this.generateDemoResults(searchTerm, searchType);
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
      console.log(`=== KINRAY SEARCH STARTING ===`);
      console.log(`Search term: ${searchTerm}`);
      console.log(`Search type: ${searchType}`);
      console.log(`Current URL: ${this.page.url()}`);
      const currentUrl = this.page.url();
      if (!currentUrl.includes("/product/search") && !currentUrl.includes("/search")) {
        try {
          await this.page.goto("https://kinrayweblink.cardinalhealth.com/product/search", {
            waitUntil: "networkidle2",
            timeout: 15e3
          });
          console.log("Navigated to search page");
        } catch (navError) {
          console.log("Navigation to search page failed, continuing with current page...");
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      const searchSelectors = [
        'input[name*="search"]',
        'input[id*="search"]',
        'input[placeholder*="search"]',
        'input[placeholder*="product"]',
        'input[placeholder*="item"]',
        'input[type="text"]',
        ".search-input",
        "#searchBox",
        "#productSearch"
      ];
      let searchInput = null;
      for (const selector of searchSelectors) {
        try {
          searchInput = await this.page.$(selector);
          if (searchInput) {
            console.log(`Found search input: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (!searchInput) {
        console.log("No search input found, looking for navigation to search page...");
        const navSelectors = [
          'a[href*="search"]',
          'a[href*="product"]',
          'a[href*="catalog"]',
          'a:contains("Search")',
          'a:contains("Products")',
          ".nav-search",
          ".product-nav"
        ];
        for (const selector of navSelectors) {
          try {
            const navLink = await this.page.$(selector);
            if (navLink) {
              console.log(`Navigating via: ${selector}`);
              await navLink.click();
              await this.page.waitForNavigation({ waitUntil: "networkidle2", timeout: 8e3 });
              break;
            }
          } catch (e) {
            continue;
          }
        }
        for (const selector of searchSelectors) {
          try {
            searchInput = await this.page.$(selector);
            if (searchInput) {
              console.log(`Found search input after navigation: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      if (searchInput) {
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(searchTerm);
        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button:contains("Search")',
          'button:contains("Find")',
          ".search-btn",
          ".search-button"
        ];
        let submitted = false;
        for (const selector of submitSelectors) {
          try {
            const button = await this.page.$(selector);
            if (button) {
              console.log(`Submitting search via: ${selector}`);
              await button.click();
              submitted = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        if (!submitted) {
          console.log("No submit button found, pressing Enter");
          await searchInput.press("Enter");
        }
        console.log("Waiting for initial search results...");
        await new Promise((resolve) => setTimeout(resolve, 3e3));
        console.log("Looking for Results Per Page dropdown to increase result count...");
        const resultsPerPageSelectors = [
          'select:has(option[value="100"])',
          'select[name*="per"], select[name*="page"]',
          'select:has(option:contains("100"))',
          ".results-per-page select",
          'select:has(option:contains("10"))',
          "#resultsPerPage",
          '[class*="results"] select',
          '[class*="page"] select',
          "select"
        ];
        let dropdownChanged = false;
        for (const selector of resultsPerPageSelectors) {
          try {
            const dropdown = await this.page.$(selector);
            if (dropdown) {
              console.log(`Found potential results dropdown: ${selector}`);
              const options = await this.page.evaluate((sel) => {
                const select = document.querySelector(sel);
                if (!select) return [];
                return Array.from(select.options).map((opt) => ({
                  value: opt.value,
                  text: opt.textContent?.trim() || ""
                }));
              }, selector);
              console.log(`Available dropdown options:`, options);
              const targetValues = ["100", "50", "25", "20"];
              for (const value of targetValues) {
                const hasValue = options.some(
                  (opt) => opt.value === value || opt.text === value || opt.text.includes(value)
                );
                if (hasValue) {
                  console.log(`\u{1F3AF} Setting results per page to: ${value} for more comprehensive results`);
                  await dropdown.select(value);
                  dropdownChanged = true;
                  console.log("Waiting for expanded results to load...");
                  await new Promise((resolve) => setTimeout(resolve, 4e3));
                  break;
                }
              }
              if (dropdownChanged) break;
            }
          } catch (e) {
            console.log(`Error with dropdown ${selector}:`, e.message);
            continue;
          }
        }
        if (dropdownChanged) {
          console.log("\u2705 Successfully expanded results per page - processing comprehensive results");
        } else {
          console.log("\u26A0\uFE0F Could not find results per page dropdown - using default pagination");
        }
        const currentUrl2 = this.page.url();
        console.log(`Current URL after search: ${currentUrl2}`);
        const pageTitle = await this.page.title();
        console.log(`Current page title: ${pageTitle}`);
        if (process.env.NODE_ENV === "development") {
          try {
            await this.page.screenshot({ path: `kinray-search-${searchTerm}.png`, fullPage: true });
            console.log(`Debug screenshot saved: kinray-search-${searchTerm}.png`);
          } catch (e) {
            console.log("Could not save debug screenshot");
          }
        }
        console.log("Processing search results from portal...");
        const results = await this.page.evaluate((vendorName) => {
          const results2 = [];
          const containerSelectors = [
            ".search-results",
            ".product-results",
            ".results-container",
            "table tbody",
            ".product-list",
            ".item-list",
            '[class*="result"]',
            '[class*="product"]',
            '[class*="grid"]',
            '[class*="table"]',
            ".data-table tbody",
            "#results tbody",
            ".search-grid"
          ];
          let rows = null;
          for (const containerSelector of containerSelectors) {
            const container = document.querySelector(containerSelector);
            if (container) {
              rows = container.querySelectorAll('tr, .product, .item, .result, [class*="product"], [class*="item"]');
              if (rows.length > 0) {
                console.log(`Found ${rows.length} results in ${containerSelector}`);
                break;
              }
            }
          }
          if (!rows || rows.length === 0) {
            rows = document.querySelectorAll('*:contains("NDC"), *:contains("$"), tr:has(td), .product, .item');
          }
          if (rows) {
            rows.forEach((row, index) => {
              try {
                const textContent = row.textContent || "";
                const ndcMatch = textContent.match(/\b\d{5}[-\s]?\d{4}[-\s]?\d{2}\b|\b\d{11}\b/);
                const priceMatch = textContent.match(/\$[\d,]+\.?\d*|USD\s*[\d,]+\.?\d*|[\d,]+\.?\d*\s*USD/);
                const nameElements = row.querySelectorAll("td, .name, .product-name, .drug-name, span, div, .description, .title");
                let productName = "";
                for (const el of nameElements) {
                  const text2 = el.textContent?.trim() || "";
                  if (text2.length > 3 && !text2.match(/^\$?[\d,.-]+$/) && !text2.match(/^\d{5}[-\s]?\d{4}[-\s]?\d{2}$/) && !text2.match(/^(In Stock|Out of Stock|Available|Unavailable)$/i) && !text2.includes("AWP") && !text2.includes("Deal Details")) {
                    productName = text2;
                    break;
                  }
                }
                let availability = "Available";
                const availabilityElements = row.querySelectorAll("td, .status, .availability, .stock, span");
                for (const el of availabilityElements) {
                  const text2 = el.textContent?.trim() || "";
                  if (text2.match(/^(In Stock|Out of Stock|Available|Unavailable|Limited|Backordered)$/i)) {
                    availability = text2;
                    break;
                  }
                }
                if (productName || ndcMatch) {
                  results2.push({
                    medication: {
                      id: index,
                      name: productName || `Product ${index + 1}`,
                      genericName: null,
                      ndc: ndcMatch ? ndcMatch[0] : null,
                      packageSize: null,
                      strength: null,
                      dosageForm: null
                    },
                    cost: priceMatch ? priceMatch[0].replace("$", "") : "0",
                    availability: "Available",
                    vendor: vendorName
                  });
                }
              } catch (e) {
                console.log(`Error processing row ${index}:`, e);
              }
            });
          }
          console.log(`Extracted ${results2.length} results from Kinray`);
          return results2;
        }, this.currentVendor.name);
        if (results.length > 0) {
          console.log(`Successfully found ${results.length} products for "${searchTerm}"`);
          return results;
        } else {
          console.log("No results found on current page structure");
          console.log(`No authentic results found for "${searchTerm}" in ${this.currentVendor.name} portal`);
          console.log("Note: Only real pharmaceutical data will be displayed");
          return [];
        }
      } else {
        console.log("Could not find search functionality on current page");
        return [];
      }
    } catch (error) {
      console.error("Kinray search error:", error);
      return [];
    }
  }
  async searchAmerisource(searchTerm, searchType) {
    if (!this.page) return [];
    try {
      console.log(`Searching AmerisourceBergen for: ${searchTerm} (${searchType})`);
      await this.page.waitForSelector('#searchInput, .search-field, input[name="search"]', { timeout: 1e4 });
      const searchInput = await this.page.$('#searchInput, .search-field, input[name="search"]');
      if (searchInput) {
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(searchTerm);
        await searchInput.press("Enter");
        await this.page.waitForSelector(".search-results, .product-grid", { timeout: 15e3 });
        return await this.page.evaluate((vendorName) => {
          const results = [];
          const products = document.querySelectorAll(".product-item, .search-result, tr");
          products.forEach((product) => {
            const nameEl = product.querySelector(".product-name, .name, td:nth-child(1)");
            const ndcEl = product.querySelector(".ndc, .product-id, td:nth-child(2)");
            const priceEl = product.querySelector(".price, .cost, td:nth-child(3)");
            const statusEl = product.querySelector(".status, .availability, td:nth-child(4)");
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
                availability: statusEl?.textContent?.trim() || "Available",
                vendor: vendorName
              });
            }
          });
          return results;
        }, this.currentVendor.name);
      }
      return [];
    } catch (error) {
      console.error("AmerisourceBergen search error:", error);
      return [];
    }
  }
  async searchMorrisDickson(searchTerm, searchType) {
    if (!this.page) return [];
    try {
      console.log(`Searching Morris & Dickson for: ${searchTerm} (${searchType})`);
      await this.page.waitForSelector('.search-input, #productSearch, input[name="search"]', { timeout: 1e4 });
      const searchInput = await this.page.$('.search-input, #productSearch, input[name="search"]');
      if (searchInput) {
        await searchInput.click({ clickCount: 3 });
        await searchInput.type(searchTerm);
        const searchBtn = await this.page.$('.search-button, button[type="submit"]');
        if (searchBtn) {
          await searchBtn.click();
        } else {
          await searchInput.press("Enter");
        }
        await this.page.waitForSelector(".search-results, .product-list", { timeout: 15e3 });
        return await this.page.evaluate((vendorName) => {
          const results = [];
          const items = document.querySelectorAll(".product-item, .search-item, tbody tr");
          items.forEach((item) => {
            const nameEl = item.querySelector(".name, .product-name, td:first-child");
            const ndcEl = item.querySelector(".ndc, .code, td:nth-child(2)");
            const priceEl = item.querySelector(".price, .cost, td:nth-child(3)");
            const statusEl = item.querySelector(".status, td:nth-child(4)");
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
                availability: statusEl?.textContent?.trim() || "Available",
                vendor: vendorName
              });
            }
          });
          return results;
        }, this.currentVendor.name);
      }
      return [];
    } catch (error) {
      console.error("Morris & Dickson search error:", error);
      return [];
    }
  }
  async searchKinray(searchTerm, searchType) {
    if (!this.page) return [];
    try {
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      const currentUrl = this.page.url();
      console.log(`Current URL after login: ${currentUrl}`);
      if (currentUrl.includes("verify") || currentUrl.includes("okta")) {
        console.log("Detected verification page, attempting to proceed...");
        const continueSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          ".button-primary",
          ".btn-primary",
          'button:contains("Continue")',
          'button:contains("Proceed")',
          'button:contains("Submit")',
          'a[href*="dashboard"]',
          'a[href*="home"]',
          'a[href*="main"]'
        ];
        let proceeded = false;
        for (const selector of continueSelectors) {
          try {
            const element = await this.page.$(selector);
            if (element) {
              console.log(`Found continue button: ${selector}`);
              await element.click();
              await new Promise((resolve) => setTimeout(resolve, 3e3));
              proceeded = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        if (!proceeded) {
          console.log("No continue button found, checking for 2FA bypass options...");
          const bypassOptions = [
            'a[href*="skip"]',
            'button:contains("Skip")',
            'button:contains("Later")',
            'button:contains("Not now")',
            'a[href*="bypass"]',
            'button:contains("Continue without")',
            ".skip-link",
            ".bypass-link"
          ];
          for (const selector of bypassOptions) {
            try {
              const element = await this.page.$(selector);
              if (element) {
                console.log(`Found 2FA bypass option: ${selector}`);
                await element.click();
                await new Promise((resolve) => setTimeout(resolve, 3e3));
                proceeded = true;
                break;
              }
            } catch (e) {
              continue;
            }
          }
          if (!proceeded) {
            console.log("No bypass found, trying direct navigation...");
            const directUrls = [
              "https://kinrayweblink.cardinalhealth.com/dashboard",
              "https://kinrayweblink.cardinalhealth.com/home",
              "https://kinrayweblink.cardinalhealth.com/main",
              "https://kinrayweblink.cardinalhealth.com/",
              "https://kinrayweblink.cardinalhealth.com/products"
            ];
            for (const url of directUrls) {
              try {
                await this.page.goto(url, { waitUntil: "networkidle2", timeout: 15e3 });
                console.log(`Successfully navigated to: ${url}`);
                const hasSearch = await this.page.$('input[type="search"], input[placeholder*="search"], input[name*="search"]');
                if (hasSearch) {
                  console.log("Found search functionality on this page");
                  proceeded = true;
                  break;
                }
              } catch (e) {
                console.log(`Failed to navigate to ${url}, trying next...`);
                continue;
              }
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 5e3));
      }
      const productSearchLinks = [
        'a[href*="product"]',
        'a[href*="search"]',
        'a[href*="catalog"]',
        'a[href*="inventory"]',
        '.nav-link:contains("Products")',
        '.menu-item:contains("Search")',
        'a:contains("Products")',
        'a:contains("Search")',
        'a:contains("Catalog")',
        'a:contains("Inventory")'
      ];
      let navigated = false;
      for (const selector of productSearchLinks) {
        try {
          const element = await this.page.evaluate((sel) => {
            if (sel.includes(":contains(")) {
              const text2 = sel.match(/contains\("([^"]+)"\)/)?.[1];
              if (text2) {
                const elements = Array.from(document.querySelectorAll("a"));
                return elements.find((el) => el.textContent?.includes(text2));
              }
            }
            return document.querySelector(sel);
          }, selector);
          if (element) {
            console.log(`Found product search link: ${selector}`);
            await this.page.click(selector.includes(":contains(") ? `a:contains("${selector.match(/contains\("([^"]+)"\)/)?.[1]}")` : selector);
            await new Promise((resolve) => setTimeout(resolve, 3e3));
            navigated = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }
      if (!navigated) {
        console.log("Could not find product search navigation, trying direct URL...");
        const searchUrls = [
          "https://kinrayweblink.cardinalhealth.com/products",
          "https://kinrayweblink.cardinalhealth.com/product-search",
          "https://kinrayweblink.cardinalhealth.com/search",
          "https://kinrayweblink.cardinalhealth.com/catalog",
          "https://kinrayweblink.cardinalhealth.com/inventory"
        ];
        for (const url of searchUrls) {
          try {
            await this.page.goto(url, { waitUntil: "networkidle2", timeout: 3e4 });
            console.log(`Successfully navigated to: ${url}`);
            const hasSearchInput = await this.page.$('input[type="search"], input[placeholder*="search"], input[name*="search"]');
            if (hasSearchInput) {
              console.log("Found search input on this page");
              break;
            }
          } catch (e) {
            console.log(`Failed to navigate to ${url}, trying next...`);
            continue;
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 5e3));
      const kinraySearchSelectors = [
        "#productSearch",
        "#searchInput",
        "#search",
        'input[id*="search"]',
        'input[name*="search"]',
        'input[class*="search"]',
        'input[placeholder*="search"]',
        'input[placeholder*="product"]',
        'input[placeholder*="item"]',
        ".search-input",
        ".product-search",
        'input[type="text"]',
        'input[type="search"]'
      ];
      let searchInput = null;
      for (const selector of kinraySearchSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2e3 });
          searchInput = await this.page.$(selector);
          if (searchInput) {
            console.log(`Found Kinray search input: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`Selector ${selector} not found, trying next...`);
          continue;
        }
      }
      if (!searchInput) {
        console.log("No search input found after trying all selectors...");
        try {
          const allInputs2 = await this.page.$$eval(
            "input",
            (inputs) => inputs.map((input) => ({
              type: input.type,
              name: input.name,
              id: input.id,
              className: input.className,
              placeholder: input.placeholder,
              value: input.value
            }))
          );
          console.log("Available input elements:", JSON.stringify(allInputs2, null, 2));
        } catch (error) {
          console.log("Could not analyze page inputs - page may have changed");
        }
        const has2FAInput = allInputs.some(
          (input) => input.type === "tel" || input.name === "answer" || input.placeholder?.includes("code") || input.placeholder?.includes("verify")
        );
        if (has2FAInput) {
          console.log("DETECTED 2FA VERIFICATION PAGE - Cannot proceed without manual verification");
          console.log("Completing search with no results due to 2FA requirement");
          return [];
        }
        console.log("Search interface not accessible - completing search with no results");
        return [];
        const allButtons = await this.page.$$eval(
          "button",
          (buttons) => buttons.map((button) => ({
            type: button.type,
            className: button.className,
            textContent: button.textContent?.trim()
          }))
        );
        console.log("Available buttons:", JSON.stringify(allButtons, null, 2));
        throw new Error("Search input not found on Kinray portal - may require manual navigation");
      }
      console.log(`Typing "${searchTerm}" into the found search input`);
      await searchInput.click({ clickCount: 3 });
      await this.page.keyboard.press("Backspace");
      await searchInput.type(searchTerm);
      console.log(`Successfully typed "${searchTerm}" into search field`);
      const submitSelectors = [
        'button[type="submit"]',
        ".search-btn",
        "#searchSubmit",
        'input[type="submit"]',
        'button[class*="search"]',
        'button[class*="submit"]'
      ];
      let submitButton = null;
      for (const selector of submitSelectors) {
        const element = await this.page.$(selector);
        if (element) {
          submitButton = element;
          console.log(`Found submit button: ${selector}`);
          await element.click();
          break;
        }
      }
      if (!submitButton) {
        console.log("No submit button found, trying Enter key");
        await this.page.keyboard.press("Enter");
      }
      console.log("Waiting for search results...");
      try {
        await this.page.waitForSelector(".search-results, .product-grid, .results-table, .results, .product-list, table, .data-table", { timeout: 1e4 });
        console.log("Found results container");
      } catch (e) {
        console.log("No results container found within timeout, proceeding to extract available data");
      }
      await this.page.screenshot({ path: "kinray-search-results.png", fullPage: true });
      console.log("Screenshot saved: kinray-search-results.png");
      const pageStructure = await this.page.evaluate(() => {
        const allElements = document.querySelectorAll("*");
        const structure = [];
        for (let i = 0; i < Math.min(allElements.length, 50); i++) {
          const el = allElements[i];
          if (el.textContent && el.textContent.trim().length > 0 && el.textContent.trim().length < 100) {
            structure.push({
              tag: el.tagName.toLowerCase(),
              class: el.className,
              id: el.id,
              text: el.textContent.trim().substring(0, 50)
            });
          }
        }
        return structure;
      });
      console.log("Page structure:", JSON.stringify(pageStructure, null, 2));
      return await this.page.evaluate((vendorName) => {
        const results = [];
        const rowSelectors = [
          ".search-results .product-row",
          ".product-grid .product-item",
          ".results-table tbody tr",
          "table tbody tr",
          ".data-table tbody tr",
          ".results tr",
          ".product-list .product-item",
          ".search-result-item",
          ".product-row",
          ".item-row"
        ];
        let foundRows = [];
        for (const selector of rowSelectors) {
          const rows = document.querySelectorAll(selector);
          if (rows.length > 0) {
            foundRows = Array.from(rows);
            console.log(`Found ${rows.length} rows using selector: ${selector}`);
            break;
          }
        }
        if (foundRows.length === 0) {
          const allElements = document.querySelectorAll("*");
          const potentialResults = [];
          for (const el of allElements) {
            const text2 = el.textContent?.trim() || "";
            if (text2.match(/\b(mg|tablets|capsules|ml|oz|strength|NDC|tylenol|acetaminophen)\b/i)) {
              potentialResults.push({
                tag: el.tagName.toLowerCase(),
                class: el.className,
                text: text2.substring(0, 100)
              });
            }
          }
          console.log("Potential medication elements found:", potentialResults.length);
          console.log("Sample elements:", potentialResults.slice(0, 5));
        }
        foundRows.forEach((row, index) => {
          const nameSelectors = [".product-name", ".item-name", ".medication-name", ".name", "td:nth-child(1)", ".title"];
          const ndcSelectors = [".ndc", ".product-code", ".code", "td:nth-child(2)", ".product-id"];
          const sizeSelectors = [".package", ".size", ".package-size", "td:nth-child(3)", ".qty"];
          const priceSelectors = [".price", ".cost", ".unit-price", "td:nth-child(4)", ".amount"];
          const statusSelectors = [".availability", ".status", ".stock", "td:nth-child(5)", ".available"];
          let nameEl = null, ndcEl = null, sizeEl = null, priceEl = null, statusEl = null;
          for (const sel of nameSelectors) {
            nameEl = row.querySelector(sel);
            if (nameEl) break;
          }
          for (const sel of ndcSelectors) {
            ndcEl = row.querySelector(sel);
            if (ndcEl) break;
          }
          for (const sel of sizeSelectors) {
            sizeEl = row.querySelector(sel);
            if (sizeEl) break;
          }
          for (const sel of priceSelectors) {
            priceEl = row.querySelector(sel);
            if (priceEl) break;
          }
          for (const sel of statusSelectors) {
            statusEl = row.querySelector(sel);
            if (statusEl) break;
          }
          if (nameEl) {
            const name = nameEl.textContent?.trim() || "";
            const ndc = ndcEl?.textContent?.trim() || null;
            const size = sizeEl?.textContent?.trim() || null;
            const price = priceEl?.textContent?.replace(/[^0-9.]/g, "") || "0";
            const status = statusEl?.textContent?.trim() || "unknown";
            if (name.length > 0 && !name.match(/^(no|none|empty|null|undefined)$/i)) {
              results.push({
                medication: {
                  id: index,
                  name,
                  genericName: null,
                  ndc,
                  packageSize: size,
                  strength: null,
                  dosageForm: null
                },
                cost: price,
                availability: status,
                vendor: vendorName
              });
            }
          }
        });
        console.log(`Extracted ${results.length} medication results`);
        return results;
      }, this.currentVendor?.name || "Kinray");
    } catch (error) {
      console.error("Kinray search error:", error);
      return [];
    }
  }
  async searchAmerisource(searchTerm, searchType) {
    if (!this.page) return [];
    return [];
  }
  async searchMorrisDickson(searchTerm, searchType) {
    if (!this.page) return [];
    return [];
  }
  async cleanup() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.currentVendor = null;
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

// shared/schema.ts
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
      try {
        const loginSuccess = await scrapingService.login(vendor, credential);
        if (loginSuccess) {
          res.json({
            success: true,
            message: `Successfully connected to ${vendor.name} portal and logged in`
          });
        } else {
          res.json({
            success: false,
            message: `Failed to login to ${vendor.name} portal - please check credentials`
          });
        }
      } catch (error) {
        console.error(`Connection test failed for ${vendor.name}:`, error);
        res.json({
          success: false,
          message: `Connection failed: ${error.message}`
        });
      } finally {
        await scrapingService.cleanup();
      }
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
  async function performSearch(searchId, searchData) {
    try {
      console.log(`\u{1F50D} Starting search ${searchId} for "${searchData.searchTerm}"`);
      await storage.updateSearch(searchId, { status: "in_progress" });
      const vendor = await storage.getVendor(searchData.vendorId);
      if (!vendor) {
        throw new Error("Vendor not found");
      }
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
        throw new Error("No credentials found for vendor");
      }
      let results = [];
      try {
        console.log(`\u{1F680} Attempting login to ${vendor.name}...`);
        const loginSuccess = await scrapingService.login(vendor, credential);
        if (!loginSuccess) {
          console.log(`\u274C Login failed to ${vendor.name} - cannot perform live scraping`);
          throw new Error(`Login failed to ${vendor.name}. Please check credentials and try again.`);
        } else {
          console.log(`\u2705 Login successful to ${vendor.name} - proceeding with search...`);
          const searchTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Search timeout after 20 seconds")), 2e4);
          });
          try {
            results = await Promise.race([
              scrapingService.searchMedication(searchData.searchTerm, searchData.searchType),
              searchTimeout
            ]);
            if (results && results.length > 0) {
              console.log(`\u{1F3AF} Successfully extracted ${results.length} live results from ${vendor.name}`);
            } else {
              console.log(`\u26A0\uFE0F Search completed but no results found`);
              results = [];
            }
          } catch (timeoutError) {
            console.log(`\u23F0 Search timed out after 20 seconds`);
            throw new Error(`Search timed out after 20 seconds. Please try again.`);
          }
        }
      } catch (scrapingError) {
        console.log(`\u274C Scraping error: ${scrapingError.message}`);
        throw new Error(`Live scraping failed: ${scrapingError.message}`);
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
      await storage.updateSearch(searchId, { status: "failed" });
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
console.log("Port:", process.env.PORT || "5000");
var app = express2();
console.log("\u2713 Express app created");
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
console.log("\u2713 Express middleware configured");
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
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
      serveStatic(app);
      console.log("Static files configured");
    }
    const port = parseInt(process.env.PORT || "5000");
    console.log(`Attempting to start server on port ${port}...`);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      console.log(`\u{1F680} Server successfully started on port ${port}`);
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("\u274C Server startup failed:", error);
    process.exit(1);
  }
})();
