// Direct test of search functionality with fresh cookies
const fetch = require('node-fetch');

async function testSearchDirect() {
  console.log('🧪 Testing search with fresh session cookies...');
  
  try {
    // First inject the fresh cookies
    const cookieResponse = await fetch('https://pharmcost714-production.up.railway.app/api/inject-cookies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cookies: [
          {"name":"_abck","value":"AC756293DF37C328FA11ECF46C51C3F7~0~YAAQqCTDFxOAryeYAQAA8r8oLw58RC2Jg+O4QoTDzAvQM/idjJcv/tCY4hDQ5ON6dH9a8fHFUmpQLXaN6tkp0sV7AzBRNZSN7RTJH6rPgk9Bt8V3nsGbO+W7YYnN6sKRywJk8dGkVIEBqYveKnZEnVfdQ3Q8JZWSXzLrt0agOkei0rKkeYqm20r6uISX7Wqk7p2c6/AXJmXBgv63CnAP3j9Ezr1Om0cE8T6r68eNhvrTO6cEnasygsiivrZEfZWikwrAGpVjPhnSuxZDohzgAa89ybN91Llvra98HNaBpWIVdg55VfPY4aHUh/EcmV4GRe0YwYaiNf7bct0LdGK6nBsHtOi+CuVD8GglJRIqIfS+08yKHobvL0uX1YgMcHYFUAqOyScid5xDm7o1EYlkkVe6OSMzT5JJafqzVeQEgvTpF5WO21Uwf/GSYEM+H3AjXr0pnnHBNDmyJq847Gz4Ltlk4XkdWynbQ9hawNKt3je9svtPHbuTNnODgpWl16J1EiTt3YIJSVK9Ffaiv+x1Jo7Isqs2kY1VqhM5hOiGyqvmx2cEq/KxUtgMJRXqSpn7IYT3XthDpv78j/jOMUVHyoQl7MZ28ExFS16jXM6SyiGrQf8rcSmj013aYQ==~-1~-1~-1","domain":".cardinalhealth.com","path":"/"},
          {"name":"okta-oauth-nonce","value":"51GePTswrm","domain":".cardinalhealth.com","path":"/"},
          {"name":"okta-oauth-state","value":"8rFzn3MH5q","domain":".cardinalhealth.com","path":"/"},
          {"name":"rxVisitor","value":"1751920089532AVIPF3TK1OGUKVBT2T44E43CL9G0DOKO","domain":".cardinalhealth.com","path":"/"}
        ]
      })
    });
    
    const cookieResult = await cookieResponse.json();
    console.log('🍪 Cookie injection result:', cookieResult);
    
    // Start search
    const searchResponse = await fetch('https://pharmcost714-production.up.railway.app/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vendorId: 1,
        searchTerm: 'lisinopril', 
        searchType: 'name'
      })
    });
    
    const searchResult = await searchResponse.json();
    console.log('🔍 Search started:', searchResult);
    
    if (searchResult.searchId) {
      // Poll for results
      console.log('⏳ Waiting for search to complete...');
      
      for (let i = 0; i < 12; i++) { // Wait up to 60 seconds
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const resultsResponse = await fetch(`https://pharmcost714-production.up.railway.app/api/search/${searchResult.searchId}/results`);
        const results = await resultsResponse.json();
        
        console.log(`🔍 Check ${i + 1}: Found ${results.length} results`);
        
        if (results.length > 0) {
          console.log('✅ Results found!', results);
          break;
        }
        
        // Check search status
        const statusResponse = await fetch(`https://pharmcost714-production.up.railway.app/api/search/${searchResult.searchId}`);
        const statusResult = await statusResponse.json();
        console.log(`📊 Search status:`, statusResult.status);
        
        if (statusResult.status === 'completed') {
          console.log('🏁 Search completed with no results');
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSearchDirect();