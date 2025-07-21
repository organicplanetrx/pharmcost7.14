# Railway Continuous Restart Fix

## Critical Problem Identified
Railway is continuously killing and restarting the container with SIGTERM because:
1. Server starts successfully on port 5000 (hardcoded)
2. Railway assigns a dynamic PORT environment variable
3. Railway's health check tries to connect on the dynamic port
4. Health check fails because server is on wrong port
5. Railway kills container and restarts it in endless loop

## Root Cause
The server was binding to hardcoded port 5000 instead of Railway's dynamically assigned PORT environment variable, causing Railway's load balancer to be unable to reach the health check endpoint.

## Comprehensive Fix Applied
1. **Dynamic Port Binding**: Server now properly uses Railway's PORT environment variable
2. **Removed Hardcoded Ports**: Eliminated all hardcoded PORT=5000 configurations
3. **Enhanced Port Debugging**: Added Railway deployment detection and port logging
4. **Dedicated Health Endpoint**: `/health` endpoint optimized for Railway's load balancer
5. **Proper Environment Handling**: Railway will provide the correct port dynamically

## Expected Resolution
- Server will bind to Railway's assigned port (not 5000)
- Railway's health checks will succeed on the correct port
- No more continuous SIGTERM/restart cycles
- Application will be accessible via Railway's public URL
- Container will stay running continuously

This addresses the fundamental Railway networking requirement of using dynamic port assignment.