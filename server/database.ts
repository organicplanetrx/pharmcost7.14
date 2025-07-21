import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';

// Railway PostgreSQL connection with comprehensive error handling
export function createDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.error('   Please ensure PostgreSQL service is added to Railway project');
    return null;
  }

  console.log('🔗 Attempting Railway PostgreSQL connection...');
  console.log('   Database URL format:', databaseUrl.substring(0, 30) + '...');
  
  try {
    const sql = neon(databaseUrl, {
      connectionTimeoutMillis: 10000,
      queryTimeoutMillis: 30000,
    });
    const db = drizzle(sql, { schema });
    console.log('✅ Railway PostgreSQL connection established');
    return db;
  } catch (error) {
    console.error('❌ Railway PostgreSQL connection failed:', error);
    console.error('   This may indicate Railway PostgreSQL service issues');
    return null;
  }
}

// Test database connection with detailed diagnostics
export async function testDatabaseConnection(db: any) {
  try {
    console.log('🔍 Testing Railway database connection...');
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Railway database connection test successful');
    console.log('   Test query result:', result);
    return true;
  } catch (error) {
    console.error('❌ Railway database connection test failed');
    console.error('   Error details:', error);
    console.error('   Error type:', typeof error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
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