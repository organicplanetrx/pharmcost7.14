// Debug script to test search completion
const { execSync } = require('child_process');

console.log('🔍 Starting debug search test...');

// Start the server in background
console.log('🚀 Starting server...');
const server = execSync('cd /home/runner/workspace && npm run start', { 
  stdio: 'pipe',
  timeout: 10000,
  encoding: 'utf8'
});

console.log('Server started:', server);

// Wait a moment for server to start
setTimeout(() => {
  console.log('🧪 Testing search creation...');
  
  // Test search creation
  const createSearch = execSync(`curl -s -X POST http://localhost:5000/api/search \
    -H "Content-Type: application/json" \
    -d '{"vendorId": 1, "searchTerm": "lisinopril", "searchType": "name"}'`, {
    encoding: 'utf8'
  });
  
  console.log('Search created:', createSearch);
  
  // Extract search ID
  const searchResponse = JSON.parse(createSearch);
  const searchId = searchResponse.searchId;
  
  console.log(`🔍 Created search ID: ${searchId}`);
  
  // Check search status periodically
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds
  
  const checkStatus = setInterval(() => {
    attempts++;
    console.log(`🔍 Checking search status (attempt ${attempts}/${maxAttempts})...`);
    
    try {
      const status = execSync(`curl -s http://localhost:5000/api/search/${searchId}`, {
        encoding: 'utf8'
      });
      
      console.log('Search status:', status);
      
      const searchData = JSON.parse(status);
      
      if (searchData.status === 'completed') {
        console.log(`✅ Search completed with ${searchData.results?.length || 0} results`);
        clearInterval(checkStatus);
      } else if (searchData.status === 'failed') {
        console.log(`❌ Search failed`);
        clearInterval(checkStatus);
      } else if (attempts >= maxAttempts) {
        console.log(`⏰ Search timed out after ${maxAttempts} attempts`);
        clearInterval(checkStatus);
      }
    } catch (error) {
      console.error('Error checking status:', error.message);
      if (attempts >= maxAttempts) {
        clearInterval(checkStatus);
      }
    }
  }, 1000);
  
}, 3000);