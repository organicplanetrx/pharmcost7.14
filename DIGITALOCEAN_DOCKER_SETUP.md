# DigitalOcean Docker Setup - Step by Step Guide

## Method 1: Change Existing App to Docker

### Step 1: Access Your App Settings
1. Go to https://cloud.digitalocean.com/apps
2. Click on your PharmaCost Pro app
3. Click the "Settings" tab at the top
4. Look for "Components" section on the left sidebar

### Step 2: Edit Component Settings
1. Click on your app component (usually shows as "web service" or similar)
2. Look for "Source" or "Build" section
3. Click "Edit" next to the build configuration
4. Change "Build Command" from automatic detection to "Docker"
5. Make sure "Dockerfile" is selected as the build source

### Step 3: If You Can't Find Docker Option
If Docker isn't available as an option:
1. Click "Create Component" 
2. Select "Docker" as the component type
3. Point it to your GitHub repository
4. Set the Dockerfile path to "./Dockerfile"

## Method 2: Create New App with Docker (Recommended)

### Step 1: Create New App
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Connect your GitHub repository
4. **Important**: When it asks for "Resource Type", select "Docker" instead of "Node.js"

### Step 2: Configure Docker Settings
1. Set Dockerfile path: `./Dockerfile`
2. Set HTTP port: `5000`
3. Set environment variables:
   ```
   NODE_ENV=production
   KINRAY_USERNAME=your_kinray_username
   KINRAY_PASSWORD=your_kinray_password
   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
   ```

### Step 3: Deploy
1. Click "Create Resources"
2. Wait for build to complete (may take 5-10 minutes for first Docker build)

## Method 3: Alternative Platforms (If DigitalOcean Docker Not Available)

### Option A: Fly.io (Recommended)
1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Deploy: `fly deploy`

### Option B: Railway (Retry)
1. Go to https://railway.app
2. Connect GitHub repository
3. Railway should automatically detect Dockerfile
4. Add environment variables
5. Deploy

### Option C: Render
1. Go to https://render.com
2. Create "Web Service"
3. Connect GitHub repository
4. Select "Docker" as environment
5. Add environment variables
6. Deploy

## Environment Variables for All Platforms
```
NODE_ENV=production
KINRAY_USERNAME=your_actual_username
KINRAY_PASSWORD=your_actual_password
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

## Troubleshooting

### If Docker Option Not Available
- Try Method 2 (create new app) instead of editing existing
- Some DigitalOcean plans may not support Docker - check your plan
- Consider alternative platforms listed above

### If Build Fails
- Check that all files (Dockerfile, docker-compose.yml) are in root directory
- Verify environment variables are set correctly
- Check build logs for specific errors

## What Happens Next
Once deployed with Docker:
1. Chrome will be pre-installed with all dependencies
2. Browser automation will work immediately
3. No more "libnss3.so" errors
4. Live pharmaceutical portal scraping will be operational

The Docker approach eliminates all the system dependency issues we've been fighting.