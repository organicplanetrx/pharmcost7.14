#!/usr/bin/env node

// Railway-optimized minimal server for PharmaCost Pro
// Addresses Railway's specific networking and health check requirements

console.log('🚂 Railway PharmaCost Pro Server Starting...');

// Critical: Railway environment detection
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_DEPLOYMENT_ID || process.env.RAILWAY_SERVICE_ID;
const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

console.log('=== RAILWAY ENVIRONMENT DEBUG ===');
console.log('Railway detected:', isRailway ? 'YES' : 'NO');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT env var:', process.env.PORT);
console.log('Server will bind to port:', port);
console.log('All environment variables containing RAILWAY:', 
  Object.keys(process.env).filter(key => key.includes('RAILWAY')).map(key => `${key}: ${process.env[key]}`));
console.log('===================================');

// Import the actual application
import('./dist/index.js').then(() => {
  console.log('✅ Main application loaded successfully');
}).catch(error => {
  console.error('❌ Failed to load main application:', error);
  process.exit(1);
});

// Railway-specific error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception (Railway):', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection (Railway):', reason);
  process.exit(1);
});