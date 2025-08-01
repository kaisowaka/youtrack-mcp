import { AuthenticationManager } from '../auth/authentication-manager.js';
import { NotificationManager, NotificationSubscription } from '../notifications/notification-manager.js';
import { logger } from '../logger.js';

/**
 * Enhanced MCP Tools for Authentication and Notifications
 */
export class EnhancedMCPTools {
  private authManager: AuthenticationManager;
  private notificationManager: NotificationManager | null = null;

  constructor(authManager: AuthenticationManager) {
    this.authManager = authManager;
  }

  /**
   * Initialize notification system
   */
  async initializeNotifications(baseUrl: string): Promise<void> {
    try {
      const authToken = await this.authManager.getAuthToken();
      this.notificationManager = new NotificationManager(baseUrl);
      await this.notificationManager.initialize(authToken);
      
      // Set up event handlers for MCP client notifications
      this.setupNotificationHandlers();
      
    } catch (error) {
      logger.warn('Failed to initialize notification system', error);
      // Continue without notifications rather than failing
    }
  }

  /**
   * Authentication Management Tool
   */
  async handleAuthManage(args: any) {
    const { action } = args;
    
    switch (action) {
      case 'status':
        return {
          success: true,
          data: this.authManager.getAuthStatus(),
          message: 'Authentication status retrieved'
        };

      case 'login':
        try {
          const token = await this.authManager.authenticate();
          return {
            success: true,
            data: { 
              authenticated: true,
              token: token.substring(0, 10) + '...' // Masked for security
            },
            message: 'Authentication successful'
          };
        } catch (error) {
          return {
            success: false,
            error: `Authentication failed: ${error instanceof Error ? error.message : error}`,
            message: 'Authentication failed'
          };
        }

      case 'logout':
        try {
          await this.authManager.signOut();
          return {
            success: true,
            data: { authenticated: false },
            message: 'Signed out successfully'
          };
        } catch (error) {
          return {
            success: false,
            error: `Sign out failed: ${error instanceof Error ? error.message : error}`,
            message: 'Sign out failed'
          };
        }

      case 'reauth':
        try {
          const token = await this.authManager.forceReauth();
          return {
            success: true,
            data: { 
              authenticated: true,
              token: token.substring(0, 10) + '...'
            },
            message: 'Re-authentication successful'
          };
        } catch (error) {
          return {
            success: false,
            error: `Re-authentication failed: ${error instanceof Error ? error.message : error}`,
            message: 'Re-authentication failed'
          };
        }

      case 'test':
        try {
          const isValid = await this.authManager.testAuthentication();
          return {
            success: true,
            data: { valid: isValid },
            message: isValid ? 'Authentication test passed' : 'Authentication test failed'
          };
        } catch (error) {
          return {
            success: false,
            error: `Authentication test failed: ${error instanceof Error ? error.message : error}`,
            message: 'Authentication test failed'
          };
        }

      default:
        return {
          success: false,
          error: `Unknown auth action: ${action}`,
          message: 'Invalid action'
        };
    }
  }

  /**
   * Notification Management Tool
   */
  async handleNotifications(args: any) {
    const { action, ...params } = args;

    if (!this.notificationManager) {
      return {
        success: false,
        error: 'Notification system not initialized',
        message: 'Notifications not available'
      };
    }

    switch (action) {
      case 'status':
        return {
          success: true,
          data: this.notificationManager.getStatus(),
          message: 'Notification status retrieved'
        };

      case 'list': {
        const { limit = 50 } = params;
        return {
          success: true,
          data: {
            notifications: this.notificationManager.getRecentNotifications(limit),
            count: this.notificationManager.getRecentNotifications().length
          },
          message: `Retrieved ${Math.min(limit, this.notificationManager.getRecentNotifications().length)} notifications`
        };
      }

      case 'clear':
        this.notificationManager.clearNotifications();
        return {
          success: true,
          data: { cleared: true },
          message: 'Notifications cleared'
        };

      case 'subscribe':
        try {
          const subscription: NotificationSubscription = {
            id: params.id || `sub-${Date.now()}`,
            name: params.name || 'Custom Subscription',
            enabled: params.enabled !== false,
            filters: params.filters || {},
            deliveryMethods: params.deliveryMethods || ['immediate'],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          this.notificationManager.addSubscription(subscription);
          
          return {
            success: true,
            data: subscription,
            message: 'Subscription created'
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to create subscription: ${error instanceof Error ? error.message : error}`,
            message: 'Subscription creation failed'
          };
        }

      case 'unsubscribe': {
        const { id } = params;
        if (!id) {
          return {
            success: false,
            error: 'Subscription ID required',
            message: 'Missing subscription ID'
          };
        }
        
        const removed = this.notificationManager.removeSubscription(id);
        return {
          success: removed,
          data: { removed },
          message: removed ? 'Subscription removed' : 'Subscription not found'
        };
      }

      case 'subscriptions':
        return {
          success: true,
          data: {
            subscriptions: this.notificationManager.getSubscriptions(),
            count: this.notificationManager.getSubscriptions().length
          },
          message: 'Subscriptions retrieved'
        };

      default:
        return {
          success: false,
          error: `Unknown notification action: ${action}`,
          message: 'Invalid action'
        };
    }
  }

  /**
   * Subscription Management Tool
   */
  async handleSubscriptions(args: any) {
    const { action, ...params } = args;

    if (!this.notificationManager) {
      return {
        success: false,
        error: 'Notification system not initialized',
        message: 'Subscriptions not available'
      };
    }

    switch (action) {
      case 'create': {
        const { name, filters, enabled = true, deliveryMethods = ['immediate'] } = params;
        
        if (!name) {
          return {
            success: false,
            error: 'Subscription name required',
            message: 'Missing subscription name'
          };
        }

        const subscription: NotificationSubscription = {
          id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          enabled,
          filters: filters || {},
          deliveryMethods,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        this.notificationManager.addSubscription(subscription);

        return {
          success: true,
          data: subscription,
          message: 'Subscription created successfully'
        };
      }

      case 'update': {
        const { id, updates } = params;
        
        if (!id) {
          return {
            success: false,
            error: 'Subscription ID required',
            message: 'Missing subscription ID'
          };
        }

        const subscriptions = this.notificationManager.getSubscriptions();
        const existing = subscriptions.find(sub => sub.id === id);
        
        if (!existing) {
          return {
            success: false,
            error: 'Subscription not found',
            message: 'Subscription does not exist'
          };
        }

        const updated: NotificationSubscription = {
          ...existing,
          ...updates,
          id: existing.id, // Prevent ID changes
          createdAt: existing.createdAt, // Preserve creation time
          updatedAt: Date.now()
        };

        this.notificationManager.removeSubscription(id);
        this.notificationManager.addSubscription(updated);

        return {
          success: true,
          data: updated,
          message: 'Subscription updated successfully'
        };
      }

      case 'delete': {
        const { id: deleteId } = params;
        
        if (!deleteId) {
          return {
            success: false,
            error: 'Subscription ID required',
            message: 'Missing subscription ID'
          };
        }

        const wasRemoved = this.notificationManager.removeSubscription(deleteId);

        return {
          success: wasRemoved,
          data: { deleted: wasRemoved },
          message: wasRemoved ? 'Subscription deleted' : 'Subscription not found'
        };
      }

      case 'list':
        return {
          success: true,
          data: {
            subscriptions: this.notificationManager.getSubscriptions(),
            count: this.notificationManager.getSubscriptions().length
          },
          message: 'Subscriptions retrieved'
        };

      default:
        return {
          success: false,
          error: `Unknown subscription action: ${action}`,
          message: 'Invalid action'
        };
    }
  }

  /**
   * Setup notification event handlers for MCP client
   */
  private setupNotificationHandlers(): void {
    if (!this.notificationManager) return;

    this.notificationManager.on('notification', (event) => {
      logger.info(`📨 Notification: ${event.title}`);
      
      // Here we could emit MCP notifications to connected clients
      // This would require extending the MCP protocol or using a custom notification mechanism
      
      // For now, we'll log the notification for the user to see
      logger.info(`   Message: ${event.message}`);
      logger.info(`   Priority: ${event.priority}`);
      
      if (event.priority === 'urgent') {
        logger.warn(`🚨 URGENT NOTIFICATION: ${event.title}`);
      }
    });

    this.notificationManager.on('disconnected', () => {
      logger.warn('📱 Notification system disconnected - real-time updates unavailable');
    });
  }

  /**
   * Get notification manager instance
   */
  getNotificationManager(): NotificationManager | null {
    return this.notificationManager;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.notificationManager) {
      this.notificationManager.disconnect();
      this.notificationManager = null;
    }
  }
}
