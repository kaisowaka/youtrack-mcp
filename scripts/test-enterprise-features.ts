#!/usr/bin/env node

/**
 * Enterprise Features Test
 * Demonstrates OAuth2 authentication and real-time notifications
 */

import { AuthenticationManager } from '../src/auth/authentication-manager.js';
import { CoreTools } from '../src/tools/core-tools.js';
import { logger } from '../src/logger.js';

async function testEnterpriseFeatures() {
  logger.info('Testing enterprise features');

  // Test configuration
  const config = {
    baseUrl: process.env.YOUTRACK_URL || 'https://your-domain.youtrack.cloud',
    token: process.env.YOUTRACK_TOKEN,
    preferOAuth2: false, // Start with token-based auth
    autoRefresh: true
  };

  try {
    // Initialize authentication manager
  logger.info('Initializing authentication manager');
    const authManager = new AuthenticationManager(config);
    
    // Initialize enhanced tools
  const coreTools = new CoreTools(authManager);

    // Test authentication status
  logger.info('Checking authentication status');
  const authStatusResp = await coreTools.handleAuthManage({ action: 'status' });
  const authStatus = JSON.parse(authStatusResp.content[0].text);
  logger.info('Auth Status:', authStatus);

    // Test authentication
    if (config.token) {
  logger.info('Testing token authentication');
  const authTestResp = await coreTools.handleAuthManage({ action: 'test' });
  const authTest = JSON.parse(authTestResp.content[0].text);
  logger.info('Auth Test:', authTest);
    }

    // Initialize notification system (if authentication works)
  if (authStatus.success && authStatus.data?.authenticated) {
  logger.info('Initializing notification system');
      try {
  await coreTools.initializeNotifications(config.baseUrl);
        
        // Test notification status
  const notificationStatusResp = await coreTools.handleNotifications({ action: 'status' });
  const notificationStatus = JSON.parse(notificationStatusResp.content[0].text);
  logger.info('Notification Status:', notificationStatus);

        // Create a test subscription
  logger.info('Creating test subscription');
  const subscriptionResp = await coreTools.handleSubscriptions({
          action: 'create',
          name: 'Test Subscription',
          filters: {
            priority: ['High', 'Critical'],
            type: 'Bug'
          },
          enabled: true
        });
  const subscription = JSON.parse(subscriptionResp.content[0].text);
  logger.info('Subscription Created:', subscription);

        // List subscriptions
  const subscriptionsResp = await coreTools.handleSubscriptions({ action: 'list' });
  const subscriptions = JSON.parse(subscriptionsResp.content[0].text);
  logger.info('All Subscriptions:', subscriptions);

        // Clean up test subscription
        if (subscription.success && subscription.data?.id) {
          const cleanupResp = await coreTools.handleSubscriptions({
            action: 'delete',
            id: subscription.data.id
          });
          const cleanup = JSON.parse(cleanupResp.content[0].text);
          logger.info('Cleanup Result:', cleanup);
        }

      } catch (error) {
        logger.warn('Notification system initialization failed (expected if not configured):', error);
      }
    }

    // Cleanup
  coreTools.cleanup();
  logger.info('Enterprise features test completed');

  } catch (error) {
  logger.error('Enterprise features test failed:', error);
    process.exit(1);
  }
}

// OAuth2 Demo (commented out as it requires browser interaction)
async function demoOAuth2Flow() {
  logger.info('OAuth2 flow demo (requires browser interaction)');
  
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
  logger.info('All enterprise feature tests completed');
      process.exit(0);
    })
    .catch(error => {
  logger.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { testEnterpriseFeatures, demoOAuth2Flow };
