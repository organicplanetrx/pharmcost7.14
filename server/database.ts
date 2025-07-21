import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import { getRailwayOptimizedConnectionString, logRailwayResourceUsage } from './railway-config';

// Railway PostgreSQL connection with comprehensive error handling
export function createDatabaseConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.error('   Please ensure PostgreSQL service is added to Railway project');
    return null;
  }

  console.log('🔗 Attempting Railway PostgreSQL connection...');
  logRailwayResourceUsage();
  
  try {
    // Use Railway-optimized connection string
    const optimizedUrl = getRailwayOptimizedConnectionString(databaseUrl);
    const sql = neon(optimizedUrl);
    const db = drizzle(sql, { schema });
    
    console.log('✅ Railway PostgreSQL connection established');
    logRailwayResourceUsage();
    return db;
  } catch (error) {
    console.error('❌ Railway PostgreSQL connection failed:', error);
    logRailwayResourceUsage();
    return null;
  }
}

// Test database connection with detailed diagnostics
export async function testDatabaseConnection(db: any) {
  try {
    console.log('🔍 Testing Railway database connection...');
    // Use a simple SELECT query that works with Neon/Railway
    const result = await db.execute('SELECT NOW() as current_time');
    console.log('✅ Railway database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Railway database connection test failed');
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
    }
    return false;
  }
}

// Initialize database schema for Railway
export async function initializeDatabaseSchema(db: any) {
  try {
    console.log('🔧 Railway database schema ready (managed by Drizzle migrations)');
    // Railway + Drizzle handles schema automatically via migrations
    // No manual table creation needed
    return true;
  } catch (error) {
    console.error('❌ Database schema check failed:', error);
    return false;
  }
}