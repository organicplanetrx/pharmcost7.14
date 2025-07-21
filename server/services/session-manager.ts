/**
 * Session Manager for Kinray Portal
 * Handles session cookie management and authentication bypass
 */

import { Page } from 'puppeteer';

export interface SessionCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
}

export class SessionManager {
  
  /**
   * Inject pre-authenticated session cookies into the browser
   */
  static async injectSessionCookies(page: Page, cookies: SessionCookie[]): Promise<void> {
    console.log('🍪 Injecting session cookies to bypass authentication...');
    
    for (const cookie of cookies) {
      try {
        await page.setCookie({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          expires: cookie.expires
        });
        console.log(`✅ Injected cookie: ${cookie.name}`);
      } catch (error) {
        console.log(`❌ Failed to inject cookie ${cookie.name}:`, error);
      }
    }
  }

  /**
   * Check if session is still valid
   */
  static async validateSession(page: Page): Promise<boolean> {
    try {
      const currentUrl = page.url();
      const hasLoginForm = await page.$('input[name="username"], input[type="password"]') !== null;
      
      // If we're not on login page and no login form, session is likely valid
      return !currentUrl.includes('login') && !currentUrl.includes('signin') && !hasLoginForm;
    } catch (error) {
      return false;
    }
  }

  /**
   * Extract common Kinray session cookie names
   */
  static getKinraySessionCookieNames(): string[] {
    return [
      'JSESSIONID',
      'SESSION',
      'auth-token',
      'kinray-session',
      'cardinal-auth',
      '_session',
      'okta-oauth-state',
      'DT'
    ];
  }
}