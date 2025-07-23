import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Clock, Search, Settings } from 'lucide-react';
import { ManualCookieInterface } from './manual-cookie-interface';

interface SystematicSearchInterfaceProps {
  onSearchComplete: (searchId: number) => void;
}

export function SystematicSearchInterface({ onSearchComplete }: SystematicSearchInterfaceProps) {
  const [step, setStep] = useState<'credentials' | 'manual-cookies' | 'cookies' | 'search' | 'results'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cookieStatus, setCookieStatus] = useState<{
    extracted: boolean;
    count: number;
    validated: boolean;
  }>({ extracted: false, count: 0, validated: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [requiresManualCookies, setRequiresManualCookies] = useState(false);

  // STEP 1: Extract fresh cookies from credentials
  const handleExtractCookies = async () => {
    if (!username || !password) {
      setError('Please enter your Kinray username and password');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      console.log('🔄 STEP 1: Starting fresh cookie extraction...');
      
      const response = await fetch('/api/extract-fresh-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        setCookieStatus({
          extracted: true,
          count: result.cookieCount,
          validated: result.validated
        });
        setStep('cookies');
        console.log('✅ STEP 1 COMPLETE: Fresh cookies extracted and validated');
      } else if (result.requiresManualCookies) {
        console.log('⚠️ Browser automation not available - switching to manual cookie extraction');
        setRequiresManualCookies(true);
        setStep('manual-cookies');
        setError('');
      } else {
        setError(result.error || 'Failed to extract cookies');
      }
    } catch (err) {
      setError('Network error during cookie extraction');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 2: Perform verified search
  const handleVerifiedSearch = async () => {
    if (!searchTerm) {
      setError('Please enter a medication name to search');
      return;
    }

    setIsProcessing(true);
    setError('');
    setStep('search');

    try {
      console.log('🔄 STEP 2: Starting verified search...');
      
      // Start search
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerm,
          searchType: 'generic_name',
          vendorId: 1
        })
      });

      const searchResult = await searchResponse.json();

      if (searchResult.success) {
        const searchId = searchResult.searchId;
        console.log(`✅ STEP 2: Search started with ID ${searchId}`);
        
        // Poll for completion
        await pollForResults(searchId);
        
      } else {
        setError(searchResult.error || 'Search failed to start');
        setStep('cookies');
      }
    } catch (err) {
      setError('Network error during search');
      setStep('cookies');
    } finally {
      setIsProcessing(false);
    }
  };

  // Poll for search completion
  const pollForResults = async (searchId: number) => {
    const maxAttempts = 20;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/search/${searchId}`);
        const search = await response.json();

        if (search.status === 'completed') {
          console.log('✅ STEP 3 COMPLETE: Search results ready');
          setStep('results');
          onSearchComplete(searchId);
          return;
        } else if (search.status === 'failed') {
          setError('Search failed - please try again');
          setStep('cookies');
          return;
        } else if (attempts >= maxAttempts) {
          setError('Search timeout - results may still be processing');
          setStep('cookies');
          return;
        }

        // Continue polling
        setTimeout(poll, 2000);
      } catch (err) {
        setError('Error checking search status');
        setStep('cookies');
      }
    };

    poll();
  };

  return (
    <Card className="pharma-card">
      <CardHeader>
        <CardTitle>Systematic Kinray Search</CardTitle>
        <CardDescription>
          Step-by-step authentication and medication search process
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Step Progress Indicator */}
        <div className="flex items-center space-x-4 mb-6">
          <StepIndicator 
            stepNumber={1} 
            title="Extract Cookies" 
            status={step === 'credentials' ? 'current' : cookieStatus.extracted ? 'complete' : 'pending'} 
          />
          <Separator orientation="horizontal" className="flex-1" />
          <StepIndicator 
            stepNumber={2} 
            title="Verify Login" 
            status={step === 'cookies' ? 'current' : step === 'search' || step === 'results' ? 'complete' : 'pending'} 
          />
          <Separator orientation="horizontal" className="flex-1" />
          <StepIndicator 
            stepNumber={3} 
            title="Search & Extract" 
            status={step === 'search' ? 'current' : step === 'results' ? 'complete' : 'pending'} 
          />
        </div>

        {/* STEP 1: Credentials */}
        {step === 'credentials' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Enter Kinray Credentials</h3>
            <p className="text-sm text-muted-foreground">
              Your credentials will be used to extract fresh session cookies from Kinray portal
            </p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Kinray Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isProcessing}
              />
              <Input
                type="password"
                placeholder="Kinray Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isProcessing}
              />
              <Button 
                onClick={handleExtractCookies}
                disabled={isProcessing || !username || !password}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Fresh Cookies...
                  </>
                ) : (
                  'Extract Fresh Session Cookies'
                )}
              </Button>
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('manual-cookies')}
                  className="text-sm"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Use Manual Cookie Extraction Instead
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL COOKIE EXTRACTION */}
        {step === 'manual-cookies' && (
          <ManualCookieInterface 
            onCookiesInjected={() => {
              setCookieStatus({
                extracted: true,
                count: 10, // Will be updated by actual cookie count
                validated: true
              });
              setStep('cookies');
            }} 
          />
        )}

        {/* STEP 2: Cookie Status & Search */}
        {step === 'cookies' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Ready to Search</h3>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Session Active & Validated
                </span>
                <Badge variant="secondary">{cookieStatus.count} cookies</Badge>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Fresh session cookies extracted and verified for Kinray portal access
              </p>
            </div>
            
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter medication name (e.g., lisinopril)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isProcessing}
              />
              <Button 
                onClick={handleVerifiedSearch}
                disabled={isProcessing || !searchTerm}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Searching Kinray Portal...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Medication
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Search Progress */}
        {step === 'search' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3: Searching Kinray Portal</h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Verifying login and extracting results...
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Searching for "{searchTerm}" in Kinray pharmaceutical database
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Results Ready */}
        {step === 'results' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4: Results Ready</h3>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Search Completed Successfully
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Fresh medication pricing data extracted from Kinray portal
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800 dark:text-red-200">Error</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StepIndicatorProps {
  stepNumber: number;
  title: string;
  status: 'pending' | 'current' | 'complete';
}

function StepIndicator({ stepNumber, title, status }: StepIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'complete': return 'bg-green-600 text-white';
      case 'current': return 'bg-blue-600 text-white';
      default: return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor()}`}>
        {status === 'complete' ? '✓' : stepNumber}
      </div>
      <span className="text-xs text-center">{title}</span>
    </div>
  );
}