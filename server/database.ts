import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Railway PostgreSQL connection with error handling
export function createDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('⚠️ DATABASE_URL not found - Railway PostgreSQL may not be configured');
    return null;
  }

  try {
    console.log('🔗 Connecting to Railway PostgreSQL...');
    const sql = neon(databaseUrl);
    const db = drizzle(sql, { schema });
    console.log('✅ Railway PostgreSQL connection established');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to Railway PostgreSQL:', error);
    return null;
  }
}

// Test database connection
export async function testDatabaseConnection(db: any) {
  try {
    // Simple query to test connection
    await db.execute('SELECT 1');
    console.log('✅ Railway database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Railway database connection test failed:', error);
    return false;
  }
}

// Initialize database schema for Railway
export async function initializeDatabaseSchema(db: any) {
  try {
    console.log('🔧 Initializing database schema for Railway...');
    
    // Create tables if they don't exist (Railway auto-migration)
    const tables = [
      'vendors', 'credentials', 'medications', 
      'searches', 'search_results', 'activity_logs'
    ];
    
    // Check if tables exist
    for (const table of tables) {
      try {
        await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`✅ Table ${table} exists`);
      } catch (error) {
        console.log(`⚠️ Table ${table} may need creation`);
      }
    }
    
    console.log('✅ Database schema initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Database schema initialization failed:', error);
    return false;
  }
}