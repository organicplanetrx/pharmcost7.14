import { Router } from 'express';
import { browserSessionDetector } from '../services/browser-session-detector';

const router = Router();

// Check if user has an authenticated Kinray session
router.get('/check-auth-status', async (req, res) => {
  try {
    console.log('🔍 Checking for authenticated Kinray session...');
    
    // Try to detect existing session
    const sessionCookies = await browserSessionDetector.detectAndExtractSession();
    
    if (sessionCookies && sessionCookies.length > 0) {
      // Store cookies globally for use in searches
      global.__kinray_session_cookies__ = sessionCookies;
      
      console.log(`✅ Found authenticated session with ${sessionCookies.length} cookies`);
      
      res.json({
        authenticated: true,
        cookieCount: sessionCookies.length,
        message: 'Authenticated Kinray session detected'
      });
    } else {
      console.log('⚠️ No authenticated session found');
      
      res.json({
        authenticated: false,
        cookieCount: 0,
        message: 'Please log into Kinray in another browser tab'
      });
    }
    
  } catch (error) {
    console.error('❌ Auth status check failed:', error);
    
    res.status(500).json({
      authenticated: false,
      error: 'Failed to check authentication status',
      message: 'Please try logging into Kinray manually'
    });
  }
});

export default router;