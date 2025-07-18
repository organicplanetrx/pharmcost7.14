# Simple DigitalOcean Docker Deploy Steps

## The Easy Way (Recommended)

Since we already have a Dockerfile in the repository root, DigitalOcean will automatically use Docker on the next deployment.

### Step 1: Add Environment Variables
1. Go to your DigitalOcean app dashboard
2. Click "Settings" tab
3. Click "App-Level Environment Variables" (or similar)
4. Add these variables:
   ```
   NODE_ENV=production
   KINRAY_USERNAME=your_kinray_username
   KINRAY_PASSWORD=your_kinray_password
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
   ```

### Step 2: Force a New Deployment
1. Go to "Deployments" tab
2. Click "Create Deployment" 
3. Or simply push a small change to your GitHub repository

### Step 3: Watch the Build Logs
Look for these indicators that Docker is being used:
- "Building with Dockerfile"
- "Installing Chrome dependencies"
- "Setting up Google Chrome"

## If Docker Still Doesn't Work

### Option 1: Create New App (5 minutes)
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect your GitHub repository
4. DigitalOcean will automatically detect the Dockerfile
5. Add environment variables
6. Deploy

### Option 2: Try Alternative Platform
If DigitalOcean continues to have issues, try:
- **Railway**: https://railway.app (often works better with Docker)
- **Render**: https://render.com (good Docker support)
- **Fly.io**: https://fly.io (excellent for Docker apps)

## What Should Happen
Once Docker is working:
1. Chrome will be pre-installed during build
2. No more "libnss3.so" errors
3. Browser automation will work immediately
4. Live pharmaceutical portal scraping operational

## Quick Test
After deployment, test the "Test Connection" button - it should work without any browser errors.