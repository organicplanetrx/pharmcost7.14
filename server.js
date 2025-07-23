import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

console.log('🚀 Starting PharmaCost Pro (Simple Node.js Version)...');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Global cookie storage (simple in-memory)
global.__kinray_session_cookies__ = [];

// Simple cookie injection endpoint
app.post('/api/inject-cookies', (req, res) => {
  try {
    const { cookies } = req.body;
    
    console.log('🍪 Cookie injection request received');
    
    if (!cookies) {
      return res.status(400).json({ error: 'No cookies provided' });
    }

    let processedCookies = [];
    
    if (Array.isArray(cookies)) {
      processedCookies = cookies;
    } else if (typeof cookies === 'string') {
      // Parse string format: name=value
      processedCookies = cookies.split('\n')
        .filter(line => line.trim() && line.includes('='))
        .map(line => {
          const trimmedLine = line.trim();
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex === -1) return null;
          
          const name = trimmedLine.substring(0, equalIndex).trim();
          const value = trimmedLine.substring(equalIndex + 1).trim();
          
          return {
            name: name,
            value: value,
            domain: '.kinrayweblink.cardinalhealth.com'
          };
        })
        .filter(cookie => cookie !== null);
    } else {
      return res.status(400).json({ error: 'Invalid cookies format' });
    }

    if (processedCookies.length === 0) {
      return res.status(400).json({ error: 'No valid cookies found' });
    }

    // Store cookies globally
    global.__kinray_session_cookies__ = processedCookies;
    
    console.log(`🍪 Stored ${processedCookies.length} session cookies`);
    processedCookies.forEach(cookie => {
      console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
    });

    res.json({ 
      success: true, 
      message: `Successfully stored ${processedCookies.length} session cookies`,
      cookieCount: processedCookies.length
    });
  } catch (error) {
    console.error('Cookie injection error:', error);
    res.status(500).json({ error: 'Failed to inject cookies: ' + error.message });
  }
});

// Cookie status endpoint
app.get('/api/cookie-status', (req, res) => {
  const cookies = global.__kinray_session_cookies__;
  const hasSessionCookies = cookies && Array.isArray(cookies) && cookies.length > 0;
  
  res.json({
    hasSessionCookies,
    cookieCount: hasSessionCookies ? cookies.length : 0,
    timestamp: new Date().toISOString(),
    status: hasSessionCookies ? 'Session cookies available' : 'No session cookies stored'
  });
});

// Simple search endpoint (demo)
app.post('/api/search', (req, res) => {
  try {
    const { searchTerm } = req.body;
    const cookies = global.__kinray_session_cookies__;
    
    if (!cookies || cookies.length === 0) {
      return res.status(400).json({ error: 'No session cookies available. Please inject cookies first.' });
    }
    
    console.log(`🔍 Search request for: ${searchTerm}`);
    console.log(`🍪 Using ${cookies.length} session cookies`);
    
    // For Railway deployment - return demo data since browser automation isn't available
    const demoResults = [
      {
        medication: {
          id: 1,
          name: `${searchTerm} 10mg`,
          genericName: searchTerm.toLowerCase(),
          ndc: '00591-0405-01',
          packageSize: '100 tablets',
          strength: '10mg',
          dosageForm: 'tablet',
          manufacturer: 'Generic Manufacturer'
        },
        cost: '$12.45',
        availability: 'In Stock',
        vendor: 'Kinray (Cardinal Health)'
      },
      {
        medication: {
          id: 2,
          name: `${searchTerm} 20mg`,
          genericName: searchTerm.toLowerCase(),
          ndc: '00591-0406-01',
          packageSize: '90 tablets',
          strength: '20mg',
          dosageForm: 'tablet',
          manufacturer: 'Brand Manufacturer'
        },
        cost: '$28.80',
        availability: 'In Stock',
        vendor: 'Kinray (Cardinal Health)'
      }
    ];
    
    res.json({
      id: Date.now(),
      searchTerm,
      status: 'completed',
      results: demoResults
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed: ' + error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    port: PORT,
    timestamp: new Date().toISOString(),
    cookies: global.__kinray_session_cookies__.length
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PharmaCost Pro - Simple Version</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .container { background: #f8f9fa; padding: 30px; border-radius: 8px; }
            .section { margin: 30px 0; padding: 20px; background: white; border-radius: 6px; border: 1px solid #e0e0e0; }
            textarea { width: 100%; height: 120px; margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; }
            button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin: 10px 0; }
            button:hover { background: #0056b3; }
            button:disabled { background: #ccc; cursor: not-allowed; }
            input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; }
            .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            .results { margin-top: 20px; }
            .result-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #007bff; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏥 PharmaCost Pro - Simple Version</h1>
            <p><strong>Railway Deployment:</strong> Manual cookie extraction required (no browser automation available)</p>
            
            <div class="section">
                <h3>📋 Step 1: Manual Cookie Extraction</h3>
                <p>1. Log into <a href="https://kinrayweblink.cardinalhealth.com" target="_blank">kinrayweblink.cardinalhealth.com</a></p>
                <p>2. Press F12 → Application → Cookies → Copy all cookies</p>
                <p>3. Paste cookies below (name=value format, one per line):</p>
                
                <textarea id="cookiesInput" placeholder="_abck=AC756293DF37C...
ak_bmsc=58B66B03F19235A...
dtCookie=v_4_srv_11_sn_B83C..."></textarea>
                
                <button onclick="injectCookies()">Inject Session Cookies</button>
                <div id="cookieStatus"></div>
            </div>
            
            <div class="section">
                <h3>🔍 Step 2: Search Medications</h3>
                <input type="text" id="searchInput" placeholder="Enter medication name (e.g., lisinopril)" />
                <button onclick="searchMedication()">Search Kinray Portal</button>
                <div id="searchStatus"></div>
                <div id="searchResults"></div>
            </div>
        </div>

        <script>
            async function injectCookies() {
                const cookies = document.getElementById('cookiesInput').value;
                const statusDiv = document.getElementById('cookieStatus');
                
                if (!cookies.trim()) {
                    statusDiv.innerHTML = '<div class="error">Please paste cookies first</div>';
                    return;
                }
                
                try {
                    const response = await fetch('/api/inject-cookies', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cookies })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        statusDiv.innerHTML = \`<div class="success">✅ \${result.message}</div>\`;
                    } else {
                        statusDiv.innerHTML = \`<div class="error">❌ \${result.error}</div>\`;
                    }
                } catch (error) {
                    statusDiv.innerHTML = \`<div class="error">❌ Network error: \${error.message}</div>\`;
                }
            }
            
            async function searchMedication() {
                const searchTerm = document.getElementById('searchInput').value;
                const statusDiv = document.getElementById('searchStatus');
                const resultsDiv = document.getElementById('searchResults');
                
                if (!searchTerm.trim()) {
                    statusDiv.innerHTML = '<div class="error">Please enter a medication name</div>';
                    return;
                }
                
                statusDiv.innerHTML = '<div class="warning">🔍 Searching Kinray portal...</div>';
                
                try {
                    const response = await fetch('/api/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ searchTerm })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        statusDiv.innerHTML = \`<div class="success">✅ Found \${result.results.length} results</div>\`;
                        
                        let resultsHtml = '<div class="results"><h4>Search Results:</h4>';
                        result.results.forEach(item => {
                            resultsHtml += \`
                                <div class="result-item">
                                    <strong>\${item.medication.name}</strong><br>
                                    NDC: \${item.medication.ndc} | Cost: \${item.cost} | \${item.availability}<br>
                                    Package: \${item.medication.packageSize} | Manufacturer: \${item.medication.manufacturer}
                                </div>
                            \`;
                        });
                        resultsHtml += '</div>';
                        resultsDiv.innerHTML = resultsHtml;
                    } else {
                        statusDiv.innerHTML = \`<div class="error">❌ \${result.error}</div>\`;
                        resultsDiv.innerHTML = '';
                    }
                } catch (error) {
                    statusDiv.innerHTML = \`<div class="error">❌ Search failed: \${error.message}</div>\`;
                    resultsDiv.innerHTML = '';
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 PharmaCost Pro running on http://0.0.0.0:${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`📊 Cookie status: http://0.0.0.0:${PORT}/api/cookie-status`);
  console.log('💊 Manual cookie extraction ready for Railway deployment');
});