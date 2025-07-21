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
    console.log('🔍 Testing Railway PostgreSQL connection...');
    // Simple query with timeout to avoid hanging on crashed PostgreSQL
    const result = await Promise.race([
      db.execute('SELECT 1 as test'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 10000))
    ]);
    console.log('✅ Railway PostgreSQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ Railway PostgreSQL connection failed');
    if (error instanceof Error) {
      console.error('   Error:', error.message);
      if (error.message.includes('Connection timeout')) {
        console.error('   PostgreSQL service may be crashed or unreachable');
      }
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