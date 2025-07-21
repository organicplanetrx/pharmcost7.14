// Railway-specific configuration optimizations to prevent PostgreSQL crashes

export const RAILWAY_CONFIG = {
  // Database connection limits to prevent resource exhaustion
  MAX_CONNECTIONS: 5, // Conservative limit for Railway free tier
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  QUERY_TIMEOUT: 60000, // 1 minute for complex pharmaceutical queries
  
  // Memory optimization settings
  ENABLE_CONNECTION_POOLING: true,
  POOL_MIN_SIZE: 1,
  POOL_MAX_SIZE: 3,
  
  // Railway service resource limits
  MAX_MEMORY_MB: 512, // Railway free tier limit
  CPU_CORES: 1,
  
  // Error handling and retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  ENABLE_GRACEFUL_DEGRADATION: true,
  
  // Logging levels for Railway debugging
  LOG_DATABASE_QUERIES: process.env.NODE_ENV === 'development',
  LOG_CONNECTION_EVENTS: true,
  LOG_ERROR_DETAILS: true
};

export function getRailwayOptimizedConnectionString(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    
    // Add Railway-optimized connection parameters
    url.searchParams.set('sslmode', 'require');
    url.searchParams.set('connect_timeout', '30');
    url.searchParams.set('application_name', 'PharmaCost-Pro');
    
    return url.toString();
  } catch (error) {
    console.error('❌ Error optimizing Railway connection string:', error);
    return databaseUrl;
  }
}

export function logRailwayResourceUsage() {
  if (process.memoryUsage && RAILWAY_CONFIG.LOG_CONNECTION_EVENTS) {
    const memory = process.memoryUsage();
    console.log('📊 Railway resource usage:');
    console.log(`   Memory: ${Math.round(memory.rss / 1024 / 1024)}MB / ${RAILWAY_CONFIG.MAX_MEMORY_MB}MB`);
    console.log(`   Heap: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`);
  }
}