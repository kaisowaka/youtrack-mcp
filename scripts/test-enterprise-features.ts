#!/usr/bin/env node

/**
 * Enterprise Features Test
 * Demonstrates OAuth2 authentication and real-time notifications
 */

import { AuthenticationManager } from '../src/auth/authentication-manager.js';
import { EnhancedMCPTools } from '../src/tools/enhanced-tools.js';
import { logger } from '../src/logger.js';

async function testEnterpriseFeatures() {
  logger.info('🧪 Testing Enterprise Features');

  // Test configuration
  const config = {
    baseUrl: process.env.YOUTRACK_URL || 'https://your-domain.youtrack.cloud',
    token: process.env.YOUTRACK_TOKEN,
    preferOAuth2: false, // Start with token-based auth
    autoRefresh: true
  };

  try {
    // Initialize authentication manager
    logger.info('🔐 Initializing Authentication Manager...');
    const authManager = new AuthenticationManager(config);
    
    // Initialize enhanced tools
    const enhancedTools = new EnhancedMCPTools(authManager);

    // Test authentication status
    logger.info('📊 Testing authentication status...');
    const authStatus = await enhancedTools.handleAuthManage({ action: 'status' });
    logger.info('Auth Status:', authStatus);

    // Test authentication
    if (config.token) {
      logger.info('🔑 Testing token authentication...');
      const authTest = await enhancedTools.handleAuthManage({ action: 'test' });
      logger.info('Auth Test:', authTest);
    }

    // Initialize notification system (if authentication works)
    if (authStatus.success && authStatus.data && 'authenticated' in authStatus.data && authStatus.data.authenticated) {
      logger.info('📱 Initializing notification system...');
      try {
        await enhancedTools.initializeNotifications(config.baseUrl);
        
        // Test notification status
        const notificationStatus = await enhancedTools.handleNotifications({ action: 'status' });
        logger.info('Notification Status:', notificationStatus);

        // Create a test subscription
        logger.info('🔔 Creating test subscription...');
        const subscription = await enhancedTools.handleSubscriptions({
          action: 'create',
          name: 'Test Subscription',
          filters: {
            priority: ['High', 'Critical'],
            type: 'Bug'
          },
          enabled: true
        });
        logger.info('Subscription Created:', subscription);

        // List subscriptions
        const subscriptions = await enhancedTools.handleSubscriptions({ action: 'list' });
        logger.info('All Subscriptions:', subscriptions);

        // Clean up test subscription
        if (subscription.success && subscription.data && 'id' in subscription.data) {
          const cleanup = await enhancedTools.handleSubscriptions({
            action: 'delete',
            id: (subscription.data as any).id
          });
          logger.info('Cleanup Result:', cleanup);
        }

      } catch (error) {
        logger.warn('Notification system initialization failed (expected if not configured):', error);
      }
    }

    // Cleanup
    enhancedTools.cleanup();
    logger.info('✅ Enterprise features test completed');

  } catch (error) {
    logger.error('❌ Enterprise features test failed:', error);
    process.exit(1);
  }
}

// OAuth2 Demo (commented out as it requires browser interaction)
async function demoOAuth2Flow() {
  logger.info('🌐 OAuth2 Flow Demo (requires browser interaction)');
  
  const config = {
    baseUrl: process.env.YOUTRACK_URL || 'https://your-domain.youtrack.cloud',
    preferOAuth2: true,
    oauth2: {
      clientId: process.env.YOUTRACK_OAUTH2_CLIENT_ID,
      clientSecret: process.env.YOUTRACK_OAUTH2_CLIENT_SECRET,
      callbackPort: 8080
    }
  };

  const authManager = new AuthenticationManager(config);
  // const enhancedTools = new EnhancedMCPTools(authManager);

  try {
    // This would open browser for OAuth2 flow
    // const loginResult = await enhancedTools.handleAuthManage({ action: 'login' });
    // logger.info('OAuth2 Login Result:', loginResult);
    
    logger.info('OAuth2 demo skipped (requires browser interaction)');
    logger.info('To test OAuth2: set YOUTRACK_OAUTH2_CLIENT_ID and run manually');
    logger.info('Auth manager initialized successfully:', !!authManager);
    
  } catch (error) {
    logger.error('OAuth2 demo failed:', error);
  }
}

// Run tests
if (process.argv[1].includes('test-enterprise-features')) {
  testEnterpriseFeatures()
    .then(() => {
      logger.info('🎉 All enterprise feature tests completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

export { testEnterpriseFeatures, demoOAuth2Flow };
