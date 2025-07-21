# Railway Deployment Fix - Container Init Error

## Issue Identified
Railway was experiencing container initialization errors:
```
ERROR (catatonit:2): failed to exec pid1: No such file or directory
```

## Root Cause
- Complex npm script execution causing container startup failures
- Build process not completing properly before container start
- Process initialization conflicts in Railway's container environment

## Solution Applied

### 1. Simplified Start Command
**Changed from:** `npm run start`
**Changed to:** `node dist/index.js`

This eliminates npm script wrapper complexity and directly executes the built application.

### 2. Optimized Build Process
- Build occurs during install phase: `npm ci --omit=dev && npm run build`
- Removes dev dependencies after build to reduce container size
- Direct node execution avoids npm process management overhead

### 3. Updated Configuration Files

**railway.json:**
- Direct node execution: `"startCommand": "node dist/index.js"`
- Increased health check timeout to 300s
- Reduced restart retries to prevent cascade failures

**nixpacks.toml:**
- Simplified nixPkgs to just nodejs-20_x
- Combined install and build phases
- Direct node start command

**Procfile:**
- Clean process definition: `web: node dist/index.js`

## Expected Resolution

The deployment should now:
1. Build successfully during install phase
2. Start container with direct node execution
3. Avoid npm script complexity that was causing pid1 errors
4. Complete health checks within 300 second timeout

## Next Steps After Fix

1. **Redeploy on Railway** - The fixed configuration should resolve container init errors
2. **Verify Health Check** - Visit `/api/dashboard/stats` endpoint
3. **Test Environment Variables** - Ensure KINRAY_USERNAME and KINRAY_PASSWORD are accessible
4. **Validate Browser Automation** - Test Kinray portal connection and pharmaceutical searches

The simplified deployment approach should eliminate the catatonit pid1 initialization failures and provide stable Railway hosting for PharmaCost Pro.