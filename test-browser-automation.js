import puppeteer from 'puppeteer';

async function testBrowserAutomation() {
  console.log('🚀 Testing browser automation...');
  
  try {
    // Test 1: Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    console.log('✅ Browser launched successfully');
    
    // Test 2: Create page
    const page = await browser.newPage();
    console.log('✅ Page created successfully');
    
    // Test 3: Navigate to a simple page
    await page.goto('https://httpbin.org/get', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('✅ Navigation successful');
    
    // Test 4: Check page content
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);
    
    // Test 5: Try Kinray portal
    console.log('🌐 Testing Kinray portal access...');
    try {
      await page.goto('https://kinrayweblink.cardinalhealth.com/login', { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
      
      const kinrayTitle = await page.title();
      console.log(`✅ Kinray portal accessible - title: ${kinrayTitle}`);
      
      // Check for login form
      const hasLoginForm = await page.$('input[type="password"]') !== null;
      console.log(`✅ Login form found: ${hasLoginForm}`);
      
    } catch (kinrayError) {
      console.log(`❌ Kinray portal test failed: ${kinrayError.message}`);
    }
    
    await browser.close();
    console.log('✅ Browser automation test completed successfully');
    
  } catch (error) {
    console.error('❌ Browser automation test failed:', error.message);
  }
}

testBrowserAutomation();