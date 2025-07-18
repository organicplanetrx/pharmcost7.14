import { storage } from './server/storage.js';
import { scrapingService } from './server/services/scraper.js';

console.log('🧪 Testing direct search functionality...');

// Test creating a search with real data
async function testDirectSearch() {
  try {
    // Create a search
    const search = await storage.createSearch({
      vendorId: 1,
      searchTerm: 'lisinopril',
      searchType: 'name',
      status: 'pending',
      resultCount: 0
    });
    
    console.log('✅ Search created:', search);
    
    // Update to in progress
    await storage.updateSearch(search.id, { status: 'in_progress' });
    console.log('✅ Search updated to in_progress');
    
    // Create some test results
    const testResults = [
      {
        medication: {
          name: 'Lisinopril 10mg Tablets',
          genericName: 'Lisinopril',
          ndc: '0781-1506-01',
          packageSize: '100 tablets',
          strength: '10mg',
          dosageForm: 'Tablet'
        },
        cost: '12.50',
        availability: 'Available',
        vendor: 'Kinray'
      },
      {
        medication: {
          name: 'Lisinopril 20mg Tablets',
          genericName: 'Lisinopril',
          ndc: '0781-1507-01',
          packageSize: '100 tablets',
          strength: '20mg',
          dosageForm: 'Tablet'
        },
        cost: '18.75',
        availability: 'Available',
        vendor: 'Kinray'
      }
    ];
    
    // Save results
    for (const result of testResults) {
      // Create medication
      const medication = await storage.createMedication(result.medication);
      
      // Create search result
      await storage.createSearchResult({
        searchId: search.id,
        medicationId: medication.id,
        vendorId: 1,
        cost: result.cost,
        availability: result.availability
      });
    }
    
    console.log('✅ Results saved to storage');
    
    // Complete the search
    await storage.updateSearch(search.id, {
      status: 'completed',
      resultCount: testResults.length,
      completedAt: new Date()
    });
    
    console.log('✅ Search completed');
    
    // Test retrieval
    const searchWithResults = await storage.getSearchWithResults(search.id);
    console.log('✅ Retrieved search with results:', {
      id: searchWithResults.id,
      status: searchWithResults.status,
      resultCount: searchWithResults.resultCount,
      results: searchWithResults.results.length
    });
    
    if (searchWithResults.results.length > 0) {
      console.log('✅ Sample result:', searchWithResults.results[0]);
    }
    
    return search.id;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

testDirectSearch().then(searchId => {
  console.log(`✅ Direct search test completed successfully! Search ID: ${searchId}`);
}).catch(error => {
  console.error('❌ Direct search test failed:', error);
});