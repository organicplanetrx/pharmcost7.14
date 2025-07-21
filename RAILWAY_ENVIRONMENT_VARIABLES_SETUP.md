# 🚂 How to Add Environment Variables in Railway

## Step-by-Step Instructions

### 1. Access Your Railway Dashboard
1. Go to **https://railway.app**
2. Sign in to your Railway account
3. Click on your **PharmaCost Pro** project

### 2. Navigate to Variables Section
1. In your project dashboard, look for the **"Variables"** tab in the left sidebar
2. Click on **"Variables"** 
   - OR look for a **⚙️ Settings** icon and click **"Environment"**

### 3. Add Required Environment Variables

Click **"+ New Variable"** for each of these:

#### Variable 1: KINRAY_USERNAME
```
Name: KINRAY_USERNAME
Value: [your actual Kinray username here]
```

#### Variable 2: KINRAY_PASSWORD  
```
Name: KINRAY_PASSWORD
Value: [your actual Kinray password here]
```

### 4. Automatic Variables (Railway Provides These)
These are **automatically created** by Railway - you don't need to add them:
- `DATABASE_URL` - Automatically provided when you add PostgreSQL
- `PORT` - Automatically set by Railway
- `NODE_ENV` - Set to "production" by default

## Visual Guide

```
Railway Dashboard
├── Your Project Name
│   ├── 📊 Deployments
│   ├── 📋 Variables  ← CLICK HERE
│   ├── ⚙️ Settings
│   └── 📝 Logs

In Variables Section:
┌─────────────────────────────────────┐
│ Environment Variables               │
├─────────────────────────────────────┤
│ + New Variable                      │ ← CLICK TO ADD
├─────────────────────────────────────┤
│ Name: KINRAY_USERNAME               │
│ Value: your_username                │
│ [Save]                              │
├─────────────────────────────────────┤
│ Name: KINRAY_PASSWORD               │ 
│ Value: your_password                │
│ [Save]                              │
└─────────────────────────────────────┘
```

## After Adding Variables

1. **Save Each Variable** - Click the "Save" or "Add" button after entering each one
2. **Redeploy** - Railway will automatically redeploy your app with the new variables
3. **Wait for Deployment** - Check the "Deployments" tab to see when it's complete

## Testing Your Setup

Once deployed, test your environment variables:

1. **Health Check**: Visit `https://your-app-name.railway.app/api/dashboard/stats`
2. **Credential Test**: Go to your app's dashboard and test the Kinray connection
3. **Search Test**: Try searching for "lisinopril" to verify pharmaceutical data extraction

## Important Notes

- **Keep credentials secure** - Only enter real Kinray portal credentials
- **Variables are encrypted** - Railway securely stores your environment variables  
- **No quotes needed** - Enter values directly without quotation marks
- **Case sensitive** - Use exact variable names: `KINRAY_USERNAME`, `KINRAY_PASSWORD`

## Troubleshooting

**If variables don't work:**
1. Check spelling of variable names (must be exact)
2. Verify no extra spaces in values
3. Redeploy the application after adding variables
4. Check deployment logs for any errors

Your PharmaCost Pro application will use these credentials to connect to the actual Kinray pharmaceutical portal and extract real pricing data!