const { execSync } = require('child_process');

console.log('🔍 TESTING SESSION COOKIE AUTHENTICATION BYPASS...\n');

try {
  // Test 1: Inject fresh cookies
  console.log('1. Injecting session cookies...');
  const cookieResult = execSync(`curl -s "https://pharmcost714-production.up.railway.app/api/inject-cookies" \
    -H "Content-Type: application/json" \
    -d '{"cookies": [{"name":"_abck","value":"AC756293DF37C328FA11ECF46C51C3F7~0~YAAQqCTDFxOAryeYAQAA8r8oLw58RC2Jg+O4QoTDzAvQM/idjJcv/tCY4hDQ5ON6dH9a8fHFUmpQLXaN6tkp0sV7AzBRNZSN7RTJH6rPgk9Bt8V3nsGbO+W7YYnN6sKRywJk8dGkVIEBqYveKnZEnVfdQ3Q8JZWSXzLrt0agOkei0rKkeYqm20r6uISX7Wqk7p2c6/AXJmXBgv63CnAP3j9Ezr1Om0cE8T6r68eNhvrTO6cEnasygsiivrZEfZWikwrAGpVjPhnSuxZDohzgAa89ybN91Llvra98HNaBpWIVdg55VfPY4aHUh/EcmV4GRe0YwYaiNf7bct0LdGK6nBsHtOi+CuVD8GglJRIqIfS+08yKHobvL0uX1YgMcHYFUAqOyScid5xDm7o1EYlkkVe6OSMzT5JJafqzVeQEgvTpF5WO21Uwf/GSYEM+H3AjXr0pnnHBNDmyJq847Gz4Ltlk4XkdWynbQ9hawNKt3je9svtPHbuTNnODgpWl16J1EiTt3YIJSVK9Ffaiv+x1Jo7Isqs2kY1VqhM5hOiGyqvmx2cEq/KxUtgMJRXqSpn7IYT3XthDpv78j/jOMUVHyoQl7MZ28ExFS16jXM6SyiGrQf8rcSmj013aYQ==~-1~-1~-1","domain":".cardinalhealth.com","path":"/"},{"name":"okta-oauth-nonce","value":"51GePTswrm","domain":".cardinalhealth.com","path":"/"},{"name":"okta-oauth-state","value":"8rFzn3MH5q","domain":".cardinalhealth.com","path":"/"},{"name":"rxVisitor","value":"1751920089532AVIPF3TK1OGUKVBT2T44E43CL9G0DOKO","domain":".cardinalhealth.com","path":"/"}]}'`, {encoding: 'utf8'});
  console.log('✅ Cookie injection result:', cookieResult);
  
  // Test 2: Start search
  console.log('\n2. Starting lisinopril search...');
  const searchResult = execSync(`curl -s "https://pharmcost714-production.up.railway.app/api/search" \
    -H "Content-Type: application/json" \
    -d '{"vendorId": 1, "searchTerm": "lisinopril", "searchType": "name"}'`, {encoding: 'utf8'});
  console.log('✅ Search started:', searchResult);
  
  const searchData = JSON.parse(searchResult);
  const searchId = searchData.searchId;
  
  if (searchId) {
    console.log('\n3. Monitoring search progress...');
    
    // Monitor search for up to 60 seconds
    for (let i = 0; i < 12; i++) {
      console.log(`\n   Check ${i + 1}/12 (${i * 5}s):`);
      
      // Check search status
      const statusResult = execSync(`curl -s "https://pharmcost714-production.up.railway.app/api/search/${searchId}"`, {encoding: 'utf8'});
      const status = JSON.parse(statusResult);
      console.log(`   Status: ${status.status} | Results: ${status.resultCount}`);
      
      // Check for results
      const resultsResult = execSync(`curl -s "https://pharmcost714-production.up.railway.app/api/search/${searchId}/results"`, {encoding: 'utf8'});
      const results = JSON.parse(resultsResult);
      
      if (results.length > 0) {
        console.log('\n🎉 SUCCESS! Found results:');
        results.slice(0, 3).forEach((result, idx) => {
          console.log(`   ${idx + 1}. ${result.name} - $${result.cost} (${result.ndcCode})`);
        });
        break;
      }
      
      if (status.status === 'completed' || status.status === 'failed') {
        console.log(`\n❌ Search ${status.status} with no results`);
        break;
      }
      
      // Wait 5 seconds before next check
      if (i < 11) {
        execSync('sleep 5');
      }
    }
  }
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}

console.log('\n🏁 Authentication bypass test completed');