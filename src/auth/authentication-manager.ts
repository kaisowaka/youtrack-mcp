import { logger } from '../logger.js';
import { OAuth2Manager, OAuth2Config, AuthTokens } from './oauth2-manager.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  baseUrl: string;
  // Token-based authentication
  token?: string;
  // OAuth2 authentication
  oauth2?: {
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
    callbackPort?: number;
  };
  // Authentication preferences
  preferOAuth2?: boolean;
  autoRefresh?: boolean;
}

/**
 * Stored authentication data
 */
interface StoredAuth {
  type: 'token' | 'oauth2';
  baseUrl: string;
  data: {
    token?: string;
    oauth2?: AuthTokens;
  };
  lastUsed: number;
}

/**
 * Enhanced Authentication Manager
 * Supports both token-based and OAuth2 authentication
 */
export class AuthenticationManager {
  private config: AuthConfig;
  private oauth2Manager: OAuth2Manager | null = null;
  private currentAuth: StoredAuth | null = null;
  private authFile: string;

  constructor(config: AuthConfig) {
    this.config = config;
    this.authFile = join(homedir(), '.youtrack-mcp-auth.json');
    
    // Initialize OAuth2 manager if configured
    if (this.config.oauth2 || this.config.preferOAuth2) {
      const oauth2Config: OAuth2Config = {
        baseUrl: config.baseUrl,
        clientId: config.oauth2?.clientId || 'youtrack-mcp-server',
        clientSecret: config.oauth2?.clientSecret,
        scopes: config.oauth2?.scopes || ['YouTrack'],
        redirectUri: `http://localhost:${config.oauth2?.callbackPort || 8080}/callback`,
        callbackPort: config.oauth2?.callbackPort || 8080
      };
      
      this.oauth2Manager = new OAuth2Manager(oauth2Config);
    }

    // Load stored authentication
    this.loadStoredAuth();
  }

  /**
   * Get current authentication token
   * Handles both token-based and OAuth2 authentication
   */
  async getAuthToken(): Promise<string> {
    // Try to use existing authentication
    if (this.currentAuth) {
      if (this.currentAuth.type === 'token' && this.currentAuth.data.token) {
        return this.currentAuth.data.token;
      }
      
      if (this.currentAuth.type === 'oauth2' && this.currentAuth.data.oauth2) {
        const tokens = this.currentAuth.data.oauth2;
        
        // Check if token needs refresh
        if (OAuth2Manager.isTokenExpired(tokens) && this.oauth2Manager) {
          try {
            logger.info('🔄 Refreshing OAuth2 token...');
            const newTokens = await this.oauth2Manager.refreshToken(tokens.refresh_token);
            
            // Update stored authentication
            this.currentAuth.data.oauth2 = newTokens;
            this.saveStoredAuth();
            
            return newTokens.access_token;
          } catch (error) {
            logger.warn('Token refresh failed, falling back to re-authentication', error);
            // Clear invalid tokens and re-authenticate
            this.currentAuth = null;
            return await this.authenticate();
          }
        }
        
        return tokens.access_token;
      }
    }

    // No valid authentication found, start authentication flow
    return await this.authenticate();
  }

  /**
   * Start authentication flow
   * Chooses between token and OAuth2 based on configuration
   */
  async authenticate(): Promise<string> {
    // If token is provided, use token-based authentication
    if (this.config.token && !this.config.preferOAuth2) {
      logger.info('🔑 Using token-based authentication');
      
      this.currentAuth = {
        type: 'token',
        baseUrl: this.config.baseUrl,
        data: { token: this.config.token },
        lastUsed: Date.now()
      };
      
      this.saveStoredAuth();
      return this.config.token;
    }

    // Use OAuth2 authentication
    if (this.oauth2Manager) {
      logger.info('🔐 Starting OAuth2 authentication flow...');
      
      try {
        const tokens = await this.oauth2Manager.authenticate();
        
        this.currentAuth = {
          type: 'oauth2',
          baseUrl: this.config.baseUrl,
          data: { oauth2: tokens },
          lastUsed: Date.now()
        };
        
        this.saveStoredAuth();
        logger.info('✅ OAuth2 authentication successful');
        
        return tokens.access_token;
        
      } catch (error) {
        logger.error('OAuth2 authentication failed', error);
        
        // Fall back to token if available
        if (this.config.token) {
          logger.info('🔄 Falling back to token-based authentication');
          return this.config.token;
        }
        
        throw new Error(`Authentication failed: ${error instanceof Error ? error.message : error}`);
      }
    }

    throw new Error('No authentication method configured. Please provide either a token or OAuth2 configuration.');
  }

  /**
   * Sign out and clear stored authentication
   */
  async signOut(): Promise<void> {
    if (this.currentAuth?.type === 'oauth2' && this.currentAuth.data.oauth2 && this.oauth2Manager) {
      try {
        await this.oauth2Manager.revokeToken(this.currentAuth.data.oauth2.access_token);
      } catch (error) {
        logger.warn('Failed to revoke token during sign out', error);
      }
    }

    this.currentAuth = null;
    this.clearStoredAuth();
    logger.info('🔓 Signed out successfully');
  }

  /**
   * Get current authentication status
   */
  getAuthStatus(): {
    authenticated: boolean;
    type: 'token' | 'oauth2' | 'none';
    expiresAt?: number;
    baseUrl: string;
  } {
    if (!this.currentAuth) {
      return {
        authenticated: false,
        type: 'none',
        baseUrl: this.config.baseUrl
      };
    }

    return {
      authenticated: true,
      type: this.currentAuth.type,
      expiresAt: this.currentAuth.type === 'oauth2' ? this.currentAuth.data.oauth2?.expires_at : undefined,
      baseUrl: this.currentAuth.baseUrl
    };
  }

  /**
   * Force re-authentication
   */
  async forceReauth(): Promise<string> {
    await this.signOut();
    return await this.authenticate();
  }

  /**
   * Load stored authentication from file
   */
  private loadStoredAuth(): void {
    try {
      if (existsSync(this.authFile)) {
        const authData = JSON.parse(readFileSync(this.authFile, 'utf8'));
        
        // Validate stored authentication
        if (authData.baseUrl === this.config.baseUrl) {
          this.currentAuth = authData;
          logger.debug('📁 Loaded stored authentication');
        } else {
          logger.debug('🔄 Base URL changed, clearing stored authentication');
          this.clearStoredAuth();
        }
      }
    } catch (error) {
      logger.warn('Failed to load stored authentication', error);
      this.clearStoredAuth();
    }
  }

  /**
   * Save authentication to file
   */
  private saveStoredAuth(): void {
    try {
      if (this.currentAuth) {
        writeFileSync(this.authFile, JSON.stringify(this.currentAuth, null, 2));
        logger.debug('💾 Saved authentication to file');
      }
    } catch (error) {
      logger.warn('Failed to save authentication', error);
    }
  }

  /**
   * Clear stored authentication
   */
  private clearStoredAuth(): void {
    try {
      if (existsSync(this.authFile)) {
        writeFileSync(this.authFile, '{}');
      }
    } catch (error) {
      logger.warn('Failed to clear stored authentication', error);
    }
  }

  /**
   * Create authentication manager from environment variables
   */
  static fromEnvironment(): AuthenticationManager {
    const baseUrl = process.env.YOUTRACK_URL;
    if (!baseUrl) {
      throw new Error('YOUTRACK_URL environment variable is required');
    }

    const config: AuthConfig = {
      baseUrl,
      token: process.env.YOUTRACK_TOKEN,
      preferOAuth2: process.env.YOUTRACK_PREFER_OAUTH2 === 'true',
      autoRefresh: process.env.YOUTRACK_AUTO_REFRESH !== 'false',
      oauth2: {
        clientId: process.env.YOUTRACK_CLIENT_ID,
        clientSecret: process.env.YOUTRACK_CLIENT_SECRET,
        scopes: process.env.YOUTRACK_SCOPES?.split(',') || ['YouTrack'],
        callbackPort: process.env.YOUTRACK_CALLBACK_PORT ? parseInt(process.env.YOUTRACK_CALLBACK_PORT) : 8080
      }
    };

    return new AuthenticationManager(config);
  }

  /**
   * Get authorization header value
   */
  async getAuthHeader(): Promise<string> {
    const token = await this.getAuthToken();
    return `Bearer ${token}`;
  }

  /**
   * Test authentication by making a simple API call
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const authHeader = await this.getAuthHeader();
      
      const response = await fetch(`${this.config.baseUrl}/api/rest/users/me`, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        logger.info(`✅ Authentication test successful - logged in as ${user.name || user.login}`);
        return true;
      } else {
        logger.error(`❌ Authentication test failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
    } catch (error) {
      logger.error('Authentication test failed', error);
      return false;
    }
  }
}
