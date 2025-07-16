// Test script to debug storage issues
const { storage } = require('./server/storage.ts');

async function testStorage() {
  console.log('🧪 Testing storage system...');
  
  try {
    // Test creating a search
    const searchData = {
      vendorId: 1,
      searchTerm: 'test',
      searchType: 'name',
      status: 'pending',
      resultCount: 0
    };
    
    console.log('Creating search with data:', searchData);
    const search = await storage.createSearch(searchData);
    console.log('Created search:', search);
    
    // Test retrieving the search
    console.log('Retrieving search with ID:', search.id);
    const retrieved = await storage.getSearchWithResults(search.id);
    console.log('Retrieved search:', retrieved);
    
    if (retrieved) {
      console.log('✅ Storage system working correctly');
    } else {
      console.log('❌ Storage retrieval failed');
    }
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
  }
}

testStorage();