// Test automatic cookie extraction without credentials (demo)
console.log('🍪 Testing automatic cookie extraction system...\n');

// Test the API endpoint
fetch('https://pharmcost714-production.up.railway.app/api/extract-cookies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'demo_user',
    password: 'demo_pass'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ Cookie extraction API response:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.success) {
    console.log(`\n✅ Success: ${data.message}`);
    console.log(`🍪 Cookie count: ${data.cookieCount}`);
  } else {
    console.log(`\n❌ Error: ${data.error}`);
    console.log(`💡 Suggestion: ${data.suggestion || 'Check credentials'}`);
  }
})
.catch(error => {
  console.error('❌ Test failed:', error.message);
});

console.log('⏳ Testing automatic cookie extraction (this may take 30-60 seconds)...');