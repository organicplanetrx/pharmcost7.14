import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { type IStorage } from "../storage";
import {
  type InsertVendor,
  type InsertCredential,
  type InsertMedication,
  type InsertSearch,
  type InsertSearchResult,
  type InsertActivityLog,
  type Vendor,
  type Credential,
  type Medication,
  type Search,
  type SearchResult,
  type SearchWithResults,
  type ActivityLog,
  type DashboardStats,
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  private static instance: DatabaseStorage;
  private readonly instanceId: string;

  private constructor() {
    this.instanceId = Math.random().toString(36).substring(2, 8);
    console.log(`🗄️ Creating DatabaseStorage instance - ID: ${this.instanceId}`);
  }

  static getInstance(): DatabaseStorage {
    if (!DatabaseStorage.instance) {
      DatabaseStorage.instance = new DatabaseStorage();
    }
    return DatabaseStorage.instance;
  }

  // Vendor operations
  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    // For now, return a hardcoded Kinray vendor
    return {
      id: 1,
      name: "Kinray (Cardinal Health)",
      website: "kinrayweblink.cardinalhealth.com",
      portalUrl: "https://kinrayweblink.cardinalhealth.com/login",
      isActive: true,
    };
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    // Return hardcoded Kinray vendor
    if (id === 1) {
      return {
        id: 1,
        name: "Kinray (Cardinal Health)",
        website: "kinrayweblink.cardinalhealth.com",
        portalUrl: "https://kinrayweblink.cardinalhealth.com/login",
        isActive: true,
      };
    }
    return undefined;
  }

  async getVendors(): Promise<Vendor[]> {
    return [
      {
        id: 1,
        name: "Kinray (Cardinal Health)",
        website: "kinrayweblink.cardinalhealth.com",
        portalUrl: "https://kinrayweblink.cardinalhealth.com/login",
        isActive: true,
      },
    ];
  }

  // Credential operations
  async createCredential(credential: InsertCredential): Promise<Credential> {
    const newCredential: Credential = {
      ...credential,
      id: Date.now(), // Simple ID generation
      lastValidated: new Date(),
    };
    return newCredential;
  }

  async getCredential(id: number): Promise<Credential | undefined> {
    return undefined; // Not implemented for demo
  }

  async getCredentials(): Promise<Credential[]> {
    return []; // Return empty for demo
  }

  async updateCredential(id: number, updates: Partial<Credential>): Promise<Credential | undefined> {
    return undefined; // Not implemented for demo
  }

  async deleteCredential(id: number): Promise<boolean> {
    return false; // Not implemented for demo
  }

  // Medication operations
  async createMedication(medication: InsertMedication): Promise<Medication> {
    const newMedication: Medication = {
      ...medication,
      id: Date.now() + Math.random() * 1000, // Simple ID generation
    };
    return newMedication;
  }

  async getMedication(id: number): Promise<Medication | undefined> {
    return undefined; // Not implemented for demo
  }

  async getMedications(): Promise<Medication[]> {
    return []; // Return empty for demo
  }

  // Search operations - using memory storage for now
  private searches = new Map<number, Search>();
  private searchResults = new Map<number, SearchResult>();
  private medications = new Map<number, Medication>();
  private searchId = 1;
  private searchResultId = 1;

  async createSearch(search: InsertSearch): Promise<Search> {
    const newSearch: Search = {
      ...search,
      id: this.searchId++,
      createdAt: new Date(),
      status: "pending",
      resultCount: 0,
      completedAt: null,
    };
    this.searches.set(newSearch.id, newSearch);
    console.log(`🔄 DatabaseStorage: Created search ${newSearch.id} - Total searches: ${this.searches.size}`);
    return newSearch;
  }

  async getSearch(id: number): Promise<Search | undefined> {
    return this.searches.get(id);
  }

  async getSearchWithResults(id: number): Promise<SearchWithResults | undefined> {
    console.log(`🔍 DatabaseStorage: getSearchWithResults called for searchId: ${id}`);
    console.log(`📊 DatabaseStorage instance: ${this.instanceId}`);
    console.log(`📊 Available searches: ${this.searches.size} - IDs: [${Array.from(this.searches.keys()).join(', ')}]`);
    console.log(`📊 Available results: ${this.searchResults.size} - IDs: [${Array.from(this.searchResults.keys()).join(', ')}]`);
    console.log(`📊 Available medications: ${this.medications.size} - IDs: [${Array.from(this.medications.keys()).join(', ')}]`);

    const search = this.searches.get(id);
    if (!search) {
      console.log(`❌ DatabaseStorage: Search ${id} not found`);
      return undefined;
    }

    const results = Array.from(this.searchResults.values()).filter(sr => sr.searchId === id);
    const searchWithResults: SearchWithResults = {
      ...search,
      results: results.map(result => ({
        ...result,
        medication: this.medications.get(result.medicationId!) || null,
      })),
    };

    console.log(`📋 DatabaseStorage: Found ${results.length} results for search ${id}`);
    return searchWithResults;
  }

  async getSearches(limit: number): Promise<Search[]> {
    return Array.from(this.searches.values()).slice(0, limit);
  }

  async updateSearch(id: number, updates: Partial<Search>): Promise<Search | undefined> {
    const search = this.searches.get(id);
    if (!search) return undefined;

    const updatedSearch = { ...search, ...updates };
    this.searches.set(id, updatedSearch);
    console.log(`🔄 DatabaseStorage: Updated search ${id} - Status: ${updatedSearch.status}`);
    return updatedSearch;
  }

  async deleteSearch(id: number): Promise<boolean> {
    return this.searches.delete(id);
  }

  // Search result operations
  async createSearchResult(result: InsertSearchResult): Promise<SearchResult> {
    const newResult: SearchResult = {
      ...result,
      id: this.searchResultId++,
      lastUpdated: new Date(),
      vendorId: result.vendorId ?? null,
      searchId: result.searchId ?? null,
      medicationId: result.medicationId ?? null,
      cost: result.cost ?? null,
      availability: result.availability ?? null,
    };
    this.searchResults.set(newResult.id, newResult);
    console.log(`🔄 DatabaseStorage: Created result ${newResult.id} for search ${newResult.searchId} - Total results: ${this.searchResults.size}`);
    return newResult;
  }

  async getSearchResult(id: number): Promise<SearchResult | undefined> {
    return this.searchResults.get(id);
  }

  async getSearchResults(searchId: number): Promise<SearchResult[]> {
    return Array.from(this.searchResults.values()).filter(sr => sr.searchId === searchId);
  }

  async updateSearchResult(id: number, updates: Partial<SearchResult>): Promise<SearchResult | undefined> {
    const result = this.searchResults.get(id);
    if (!result) return undefined;

    const updatedResult = { ...result, ...updates };
    this.searchResults.set(id, updatedResult);
    return updatedResult;
  }

  async deleteSearchResult(id: number): Promise<boolean> {
    return this.searchResults.delete(id);
  }

  // Activity log operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const newLog: ActivityLog = {
      ...log,
      id: Date.now(),
      timestamp: new Date(),
    };
    return newLog;
  }

  async getActivityLogs(limit: number): Promise<ActivityLog[]> {
    return []; // Return empty for demo
  }

  // Dashboard stats
  async getDashboardStats(): Promise<DashboardStats> {
    return {
      totalSearchesToday: this.searches.size,
      totalCostAnalysis: 0,
      csvExportsGenerated: 0,
    };
  }
}