export class ManualCookieGuidance {
  static getInstructions(): {
    step: string;
    instructions: string;
    technical: string;
  }[] {
    return [
      {
        step: "1. Log into Kinray Portal",
        instructions: "Open kinrayweblink.cardinalhealth.com in your browser and log in with your credentials",
        technical: "Ensure you're fully authenticated and can access the product search page"
      },
      {
        step: "2. Open Browser Developer Tools",
        instructions: "Press F12 (or right-click → Inspect) to open developer tools",
        technical: "Navigate to the Application tab (Chrome) or Storage tab (Firefox)"
      },
      {
        step: "3. Extract Session Cookies",
        instructions: "Go to Application → Cookies → kinrayweblink.cardinalhealth.com",
        technical: "Copy all cookies, especially: JSESSIONID, abck, bm_sz, ak_bmsc"
      },
      {
        step: "4. Use Manual Cookie Injection",
        instructions: "Use the 'Manual Cookie Injection' section in the app interface",
        technical: "Paste cookies in JSON format: [{\"name\":\"JSESSIONID\",\"value\":\"...\",\"domain\":\"...\"}]"
      }
    ];
  }

  static generateCookieTemplate(): string {
    return `[
  {
    "name": "JSESSIONID",
    "value": "YOUR_SESSION_ID_HERE",
    "domain": ".kinrayweblink.cardinalhealth.com",
    "path": "/",
    "httpOnly": true,
    "secure": true
  },
  {
    "name": "abck",
    "value": "YOUR_ABCK_VALUE_HERE",
    "domain": ".cardinalhealth.com",
    "path": "/",
    "httpOnly": false,
    "secure": true
  }
]`;
  }
}