import { logger } from '../logger.js';
import { createServer, Server } from 'http';
import { parse } from 'url';
import open from 'open';
import crypto from 'crypto';

/**
 * OAuth2 Configuration for YouTrack
 */
export interface OAuth2Config {
  baseUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  callbackPort: number;
}

/**
 * OAuth2 Authentication Tokens
 */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

/**
 * OAuth2 Manager for YouTrack Authentication
 * Based on YouTrack mobile app's OAuth2 implementation
 */
export class OAuth2Manager {
  private config: OAuth2Config;
  private server: Server | null = null;
  private codeVerifier: string | null = null;
  private state: string | null = null;

  constructor(config: OAuth2Config) {
    this.config = {
      ...config,
      scopes: config.scopes.length > 0 ? config.scopes : ['YouTrack']
    };
  }

  /**
   * Start OAuth2 authentication flow
   * Opens browser and starts callback server
   */
  async authenticate(): Promise<AuthTokens> {
    return new Promise((resolve, reject) => {
      try {
        // Generate PKCE parameters
        this.codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(this.codeVerifier);
        this.state = this.generateState();

        // Start callback server
        this.startCallbackServer(resolve, reject);

        // Build authorization URL
        const authUrl = this.buildAuthorizationUrl(codeChallenge);

        // Open browser
        logger.info('🔐 Starting OAuth2 authentication flow...');
        logger.info('Opening browser for authentication...');
        
        this.openBrowser(authUrl);

        // Set timeout for authentication
        setTimeout(() => {
          this.cleanup();
          reject(new Error('Authentication timeout - please try again'));
        }, 300000); // 5 minutes timeout

      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const tokenUrl = `${this.config.baseUrl}/api/rest/oauth2/token`;
    
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });

    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      
      return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: Date.now() + (tokenData.expires_in * 1000),
        token_type: tokenData.token_type || 'Bearer',
        scope: tokenData.scope || this.config.scopes.join(' ')
      };

    } catch (error) {
      logger.error('Token refresh failed', error);
      throw error;
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<void> {
    const revokeUrl = `${this.config.baseUrl}/api/rest/oauth2/revoke`;
    
    try {
      await fetch(revokeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token,
          client_id: this.config.clientId,
        }).toString(),
      });
      
      logger.info('🔓 Access token revoked successfully');

    } catch (error) {
      logger.warn('Failed to revoke token', error);
      // Don't throw - revocation is best effort
    }
  }

  /**
   * Start local HTTP server to handle OAuth callback
   */
  private startCallbackServer(
    resolve: (tokens: AuthTokens) => void, 
    reject: (error: Error) => void
  ): void {
    this.server = createServer(async (req, res) => {
      try {
        const url = parse(req.url || '', true);
        
        if (url.pathname === '/callback') {
          const { code, state, error } = url.query;

          // Send response to browser
          res.writeHead(200, { 'Content-Type': 'text/html' });
          
          if (error) {
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #d32f2f;">❌ Authentication Failed</h2>
                  <p>Error: ${error}</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            reject(new Error(`OAuth2 error: ${error}`));
            return;
          }

          if (!code || !state || state !== this.state) {
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #d32f2f;">❌ Authentication Failed</h2>
                  <p>Invalid authorization code or state mismatch.</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            reject(new Error('Invalid authorization code or state mismatch'));
            return;
          }

          try {
            const tokens = await this.exchangeCodeForTokens(code as string);
            
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #4caf50;">✅ Authentication Successful!</h2>
                  <p>You have successfully authenticated with YouTrack.</p>
                  <p>You can close this window and return to your application.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);

            this.cleanup();
            resolve(tokens);

          } catch (tokenError) {
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h2 style="color: #d32f2f;">❌ Token Exchange Failed</h2>
                  <p>Failed to exchange authorization code for tokens.</p>
                  <p>You can close this window and try again.</p>
                </body>
              </html>
            `);
            reject(tokenError as Error);
          }
        }
      } catch (serverError) {
        logger.error('OAuth callback server error', serverError);
        reject(serverError as Error);
      }
    });

    this.server.listen(this.config.callbackPort, 'localhost', () => {
      logger.info(`🔗 OAuth callback server listening on port ${this.config.callbackPort}`);
    });

    this.server.on('error', (error) => {
      logger.error('OAuth callback server error', error);
      reject(error);
    });
  }

  /**
   * Build authorization URL with PKCE
   */
  private buildAuthorizationUrl(codeChallenge: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: this.state!,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'login'
    });

    return `${this.config.baseUrl}/api/rest/oauth2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<AuthTokens> {
    const tokenUrl = `${this.config.baseUrl}/api/rest/oauth2/token`;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      code_verifier: this.codeVerifier!,
    });

    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const tokenData = await response.json();

    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      token_type: tokenData.token_type || 'Bearer',
      scope: tokenData.scope || this.config.scopes.join(' ')
    };
  }

  /**
   * Open browser for authentication
   */
  private async openBrowser(url: string): Promise<void> {
    try {
      await open(url);
    } catch (error) {
      logger.error('Failed to open browser automatically');
      logger.info('Please open the following URL in your browser:');
      logger.info(url);
    }
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  /**
   * Generate state parameter
   */
  private generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.codeVerifier = null;
    this.state = null;
  }

  /**
   * Check if tokens are expired
   */
  static isTokenExpired(tokens: AuthTokens): boolean {
    return Date.now() >= (tokens.expires_at - 30000); // 30 second buffer
  }

  /**
   * Get default OAuth2 configuration for YouTrack
   */
  static getDefaultConfig(baseUrl: string): OAuth2Config {
    return {
      baseUrl,
      clientId: 'youtrack-mcp-server',
      scopes: ['YouTrack'],
      redirectUri: 'http://localhost:8080/callback',
      callbackPort: 8080
    };
  }
}
