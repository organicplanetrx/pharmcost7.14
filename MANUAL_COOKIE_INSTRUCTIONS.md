# Manual Cookie Extraction Guide for Kinray Authentication

## Problem Solved
The automatic cookie extraction system successfully extracts 11 cookies but encounters 2FA verification that cannot be bypassed programmatically. The solution is to extract cookies from your browser where you're already authenticated.

## Step-by-Step Instructions

### 1. Access Your Authenticated Kinray Session
- Open your browser where you're already logged into Kinray
- Navigate to: https://kinrayweblink.cardinalhealth.com/
- Ensure you're fully authenticated (no login prompts)

### 2. Extract Cookies Using Browser Developer Tools
**Chrome/Edge/Safari:**
1. Press `F12` or right-click → "Inspect"
2. Go to "Application" tab
3. In sidebar, click "Cookies" → "https://kinrayweblink.cardinalhealth.com"
4. You'll see all cookies - copy the important ones

**Firefox:**
1. Press `F12` or right-click → "Inspect Element"  
2. Go to "Storage" tab
3. Click "Cookies" → "https://kinrayweblink.cardinalhealth.com"
4. Copy the authentication cookies

### 3. Format Cookies for the System
Copy cookies in this JSON format:
```json
[
  {
    "name": "JSESSIONID",
    "value": "your_session_value_here",
    "domain": ".cardinalhealth.com",
    "path": "/",
    "secure": true,
    "httpOnly": true
  },
  {
    "name": "_abck", 
    "value": "your_abck_value_here",
    "domain": ".cardinalhealth.com",
    "path": "/",
    "secure": true,
    "httpOnly": false
  }
]
```

### 4. Inject Cookies in PharmaCost Pro
1. Go to: https://pharmcost714-production.up.railway.app
2. Find the "Manual Cookie Injection" tab
3. Paste your formatted cookies
4. Click "Inject Session Cookies"

### 5. Test Authentication
After injection, try searching for:
- "lisinopril,10"
- "metformin,500" 
- "aspirin,325"

The system will use your authenticated session to perform real searches.

## Key Authentication Cookies to Include
Priority cookies for Kinray authentication:
- `JSESSIONID` - Main session identifier
- `_abck` - Anti-bot protection token
- `AWSALB*` - Load balancer session
- Any cookies with "auth", "session", or "okta" in the name

## Why This Works
Your browser cookies contain the completed 2FA authentication tokens that the automated system cannot obtain. This bypasses the 2FA barrier while using legitimate authentication.

## Success Indicators
After cookie injection, searches should:
- Complete within 15-30 seconds
- Return real pharmaceutical data with NDC codes
- Show "success" status in activity logs
- Display actual Kinray pricing information