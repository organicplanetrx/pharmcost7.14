import { eq, desc, and, gte } from 'drizzle-orm';
import {
  vendors,
  credentials,
  medications,
  searches,
  searchResults,
  activityLogs,
  type Vendor,
  type InsertVendor,
  type Credential,
  type InsertCredential,
  type Medication,
  type InsertMedication,
  type Search,
  type InsertSearch,
  type SearchResult,
  type InsertSearchResult,
  type ActivityLog,
  type InsertActivityLog,
  type SearchWithResults,
} from "@shared/schema";
import { IStorage } from './storage';
import { createDatabaseConnection, testDatabaseConnection, initializeDatabaseSchema } from './database';

export class RailwayDatabaseStorage implements IStorage {
  private db: any;
  private isConnected = false;
  private connectionPromise: Promise<void>;

  constructor() {
    this.connectionPromise = this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    try {
      console.log('🚀 Initializing Railway PostgreSQL connection...');
      this.db = createDatabaseConnection();
      
      if (this.db) {
        // Test connection with retry logic for crashed PostgreSQL service
        let retries = 3;
        while (retries > 0 && !this.isConnected) {
          this.isConnected = await testDatabaseConnection(this.db);
          if (!this.isConnected) {
            console.log(`   Retrying PostgreSQL connection... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            retries--;
          }
        }
        
        if (this.isConnected) {
          await initializeDatabaseSchema(this.db);
          console.log('🗄️ Railway PostgreSQL storage operational');
        } else {
          console.error('❌ PostgreSQL service appears to be crashed or unreachable');
          console.error('   Check Railway PostgreSQL service status in dashboard');
        }
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      this.isConnected = false;
    }
  }

  private async ensureConnection(): Promise<boolean> {
    await this.connectionPromise;
    if (!this.isConnected) {
      throw new Error('Railway PostgreSQL connection not available');
    }
    return true;
  }

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(vendors);
      return result;
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      return [];
    }
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(vendors).where(eq(vendors.id, id));
      return result[0];
    } catch (error) {
      console.error('❌ Error fetching vendor:', error);
      return undefined;
    }
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    await this.ensureConnection();
    const result = await this.db.insert(vendors).values(vendor).returning();
    return result[0];
  }

  // Credentials
  async getCredentials(): Promise<Credential[]> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(credentials);
      return result;
    } catch (error) {
      console.error('❌ Error fetching credentials:', error);
      return [];
    }
  }

  async getCredentialByVendorId(vendorId: number): Promise<Credential | undefined> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(credentials).where(eq(credentials.vendorId, vendorId));
      return result[0];
    } catch (error) {
      console.error('❌ Error fetching credential by vendor:', error);
      return undefined;
    }
  }

  async createCredential(credential: InsertCredential): Promise<Credential> {
    await this.ensureConnection();
    const result = await this.db.insert(credentials).values(credential).returning();
    return result[0];
  }

  async updateCredential(id: number, credential: Partial<InsertCredential>): Promise<Credential | undefined> {
    await this.ensureConnection();
    try {
      const result = await this.db.update(credentials).set(credential).where(eq(credentials.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('❌ Error updating credential:', error);
      return undefined;
    }
  }

  async deleteCredential(id: number): Promise<boolean> {
    await this.ensureConnection();
    try {
      await this.db.delete(credentials).where(eq(credentials.id, id));
      return true;
    } catch (error) {
      console.error('❌ Error deleting credential:', error);
      return false;
    }
  }

  // Medications
  async getMedications(): Promise<Medication[]> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(medications);
      return result;
    } catch (error) {
      console.error('❌ Error fetching medications:', error);
      return [];
    }
  }

  async getMedicationByNdc(ndc: string): Promise<Medication | undefined> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(medications).where(eq(medications.ndc, ndc));
      return result[0];
    } catch (error) {
      console.error('❌ Error fetching medication by NDC:', error);
      return undefined;
    }
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    await this.ensureConnection();
    const result = await this.db.insert(medications).values(medication).returning();
    return result[0];
  }

  async updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined> {
    await this.ensureConnection();
    try {
      const result = await this.db.update(medications).set(medication).where(eq(medications.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('❌ Error updating medication:', error);
      return undefined;
    }
  }

  // Searches
  async getSearches(limit: number = 50): Promise<Search[]> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(searches).orderBy(desc(searches.createdAt)).limit(limit);
      return result;
    } catch (error) {
      console.error('❌ Error fetching searches:', error);
      return [];
    }
  }

  async getSearch(id: number): Promise<Search | undefined> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(searches).where(eq(searches.id, id));
      return result[0];
    } catch (error) {
      console.error('❌ Error fetching search:', error);
      return undefined;
    }
  }

  async getSearchWithResults(id: number): Promise<SearchWithResults | undefined> {
    await this.ensureConnection();
    try {
      const search = await this.getSearch(id);
      if (!search) return undefined;

      const searchResultsData = await this.getSearchResults(id);
      
      // Convert SearchResult[] to the expected format with medication data
      const results = searchResultsData.map(sr => ({
        ...sr,
        medication: {
          id: sr.medicationId || 0,
          name: 'Unknown',
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
      console.error('❌ Error fetching search with results:', error);
      return undefined;
    }
  }

  async createSearch(search: InsertSearch): Promise<Search> {
    await this.ensureConnection();
    const result = await this.db.insert(searches).values(search).returning();
    return result[0];
  }

  async updateSearch(id: number, search: Partial<Search>): Promise<Search | undefined> {
    await this.ensureConnection();
    try {
      const result = await this.db.update(searches).set(search).where(eq(searches.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('❌ Error updating search:', error);
      return undefined;
    }
  }

  // Search Results
  async getSearchResults(searchId: number): Promise<SearchResult[]> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(searchResults).where(eq(searchResults.searchId, searchId));
      return result;
    } catch (error) {
      console.error('❌ Error fetching search results:', error);
      return [];
    }
  }

  async createSearchResult(result: InsertSearchResult): Promise<SearchResult> {
    await this.ensureConnection();
    const dbResult = await this.db.insert(searchResults).values(result).returning();
    return dbResult[0];
  }

  // Activity Logs
  async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    await this.ensureConnection();
    try {
      const result = await this.db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
      return result;
    } catch (error) {
      console.error('❌ Error fetching activity logs:', error);
      return [];
    }
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    await this.ensureConnection();
    const result = await this.db.insert(activityLogs).values(log).returning();
    return result[0];
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalSearchesToday: number;
    totalCostAnalysis: string;
    csvExportsGenerated: number;
  }> {
    await this.ensureConnection();
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count searches today
      const searchesToday = await this.db
        .select({ count: 'COUNT(*)' })
        .from(searches)
        .where(gte(searches.createdAt, today));

      // Calculate total cost analysis
      const totalCostQuery = await this.db
        .select({ sum: 'SUM(CAST(cost AS DECIMAL))' })
        .from(searchResults)
        .where(eq(searchResults.cost, searchResults.cost)); // Basic filter

      // Count CSV exports
      const csvExports = await this.db
        .select({ count: 'COUNT(*)' })
        .from(activityLogs)
        .where(and(
          eq(activityLogs.action, 'export'),
          eq(activityLogs.status, 'success')
        ));

      return {
        totalSearchesToday: parseInt(searchesToday[0]?.count || '0'),
        totalCostAnalysis: (parseFloat(totalCostQuery[0]?.sum || '0')).toFixed(2),
        csvExportsGenerated: parseInt(csvExports[0]?.count || '0')
      };
    } catch (error) {
      console.error('❌ Error calculating dashboard stats:', error);
      return {
        totalSearchesToday: 0,
        totalCostAnalysis: "0.00",
        csvExportsGenerated: 0
      };
    }
  }
}