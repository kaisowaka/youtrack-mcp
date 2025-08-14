import { AuthenticationManager } from '../auth/authentication-manager.js';
import { NotificationManager, NotificationSubscription } from '../notifications/notification-manager.js';
import { logger } from '../logger.js';
import { ResponseFormatter } from '../api/base/response-formatter.js';

/**
 * Core tools for authentication and notification management.
 * (Previously named EnhancedMCPTools; renamed for simplicity.)
 */
export class CoreTools {
	private authManager: AuthenticationManager;
	private notificationManager: NotificationManager | null = null;

	constructor(authManager: AuthenticationManager) {
		this.authManager = authManager;
	}

	async initializeNotifications(baseUrl: string): Promise<void> {
		try {
			const authToken = await this.authManager.getAuthToken();
			this.notificationManager = new NotificationManager(baseUrl);
			await this.notificationManager.initialize(authToken);
			this.setupNotificationHandlers();
		} catch (error) {
			logger.warn('Failed to initialize notification system', error);
		}
	}

	async handleAuthManage(args: any) {
		const { action } = args;
		const wrapSuccess = (data: any, message: string) => ResponseFormatter.formatSuccess(data, message);
		const wrapError = (error: string) => ResponseFormatter.formatError(error, undefined, { source: 'auth_tool' });
		switch (action) {
			case 'status': return wrapSuccess(this.authManager.getAuthStatus(), 'Authentication status retrieved');
			case 'login':
				try { const token = await this.authManager.authenticate(); return wrapSuccess({ authenticated: true, token: token.substring(0,10)+'...' }, 'Authentication successful'); } catch (e:any) { return wrapError(`Authentication failed: ${e.message||e}`);}      
			case 'logout':
				try { await this.authManager.signOut(); return wrapSuccess({ authenticated: false }, 'Signed out successfully'); } catch (e:any) { return wrapError(`Sign out failed: ${e.message||e}`);}      
			case 'reauth':
				try { const token = await this.authManager.forceReauth(); return wrapSuccess({ authenticated: true, token: token.substring(0,10)+'...' }, 'Re-authentication successful'); } catch (e:any) { return wrapError(`Re-authentication failed: ${e.message||e}`);}      
			case 'test':
				try { const isValid = await this.authManager.testAuthentication(); return wrapSuccess({ valid: isValid }, isValid? 'Authentication test passed':'Authentication test failed'); } catch (e:any) { return wrapError(`Authentication test failed: ${e.message||e}`);}      
			default: return wrapError(`Unknown auth action: ${action}`);
		}
	}

	async handleNotifications(args: any) {
		const { action, ...params } = args;
		if (!this.notificationManager) return ResponseFormatter.formatError('Notification system not initialized', { action });
		const listNotifications = (limit:number)=>({ notifications: this.notificationManager!.getRecentNotifications(limit), count: this.notificationManager!.getRecentNotifications().length });
		switch(action) {
			case 'status': return ResponseFormatter.formatSuccess(this.notificationManager.getStatus(), 'Notification status retrieved');
			case 'list': { const { limit=50 } = params; return ResponseFormatter.formatSuccess(listNotifications(limit), `Retrieved ${Math.min(limit, this.notificationManager.getRecentNotifications().length)} notifications`);}      
			case 'clear': this.notificationManager.clearNotifications(); return ResponseFormatter.formatSuccess({ cleared: true }, 'Notifications cleared');
			case 'subscribe':
				try { const subscription: NotificationSubscription = { id: params.id || `sub-${Date.now()}`, name: params.name || 'Custom Subscription', enabled: params.enabled !== false, filters: params.filters || {}, deliveryMethods: params.deliveryMethods || ['immediate'], createdAt: Date.now(), updatedAt: Date.now() }; this.notificationManager.addSubscription(subscription); return ResponseFormatter.formatSuccess(subscription, 'Subscription created'); } catch(e:any){ return ResponseFormatter.formatError(`Failed to create subscription: ${e.message||e}`, { action }); }
			case 'unsubscribe': { const { id } = params; if(!id) return ResponseFormatter.formatError('Subscription ID required', { action }); const removed = this.notificationManager.removeSubscription(id); return removed? ResponseFormatter.formatSuccess({ removed }, 'Subscription removed'): ResponseFormatter.formatError('Subscription not found', { id }); }
			case 'subscriptions': return ResponseFormatter.formatSuccess({ subscriptions: this.notificationManager.getSubscriptions(), count: this.notificationManager.getSubscriptions().length }, 'Subscriptions retrieved');
			default: return ResponseFormatter.formatError(`Unknown notification action: ${action}`, { action });
		}
	}

	async handleSubscriptions(args:any) {
		const { action, ...params } = args;
		if (!this.notificationManager) return ResponseFormatter.formatError('Notification system not initialized', { action });
		switch(action) {
			case 'create': { const { name, filters, enabled=true, deliveryMethods=['immediate'] } = params; if(!name) return ResponseFormatter.formatError('Subscription name required', { action }); const subscription: NotificationSubscription = { id: `sub-${Date.now()}-${Math.random().toString(36).substr(2,9)}`, name, enabled, filters: filters||{}, deliveryMethods, createdAt: Date.now(), updatedAt: Date.now() }; this.notificationManager.addSubscription(subscription); return ResponseFormatter.formatSuccess(subscription, 'Subscription created successfully'); }
			case 'update': { const { id, updates } = params; if(!id) return ResponseFormatter.formatError('Subscription ID required', { action }); const existing = this.notificationManager.getSubscriptions().find(s=>s.id===id); if(!existing) return ResponseFormatter.formatError('Subscription not found', { id }); const updated: NotificationSubscription = { ...existing, ...updates, id: existing.id, createdAt: existing.createdAt, updatedAt: Date.now() }; this.notificationManager.removeSubscription(id); this.notificationManager.addSubscription(updated); return ResponseFormatter.formatSuccess(updated, 'Subscription updated successfully'); }
			case 'delete': { const { id: deleteId } = params; if(!deleteId) return ResponseFormatter.formatError('Subscription ID required', { action }); const wasRemoved = this.notificationManager.removeSubscription(deleteId); return wasRemoved ? ResponseFormatter.formatSuccess({ deleted: true, id: deleteId }, 'Subscription deleted') : ResponseFormatter.formatError('Subscription not found', { id: deleteId }); }
			case 'list': return ResponseFormatter.formatSuccess({ subscriptions: this.notificationManager.getSubscriptions(), count: this.notificationManager.getSubscriptions().length }, 'Subscriptions retrieved');
			default: return ResponseFormatter.formatError(`Unknown subscription action: ${action}`, { action });
		}
	}

	private setupNotificationHandlers(): void {
		if (!this.notificationManager) return;
		this.notificationManager.on('notification', (event) => {
			logger.info(`Notification: ${event.title}`);
			logger.info(`  Message: ${event.message}`);
			logger.info(`  Priority: ${event.priority}`);
			if (event.priority === 'urgent') logger.warn(`URGENT: ${event.title}`);
		});
		this.notificationManager.on('disconnected', () => { logger.warn('Notification system disconnected - real-time updates unavailable'); });
	}

	getNotificationManager(): NotificationManager | null { return this.notificationManager; }
	cleanup(): void { if (this.notificationManager) { this.notificationManager.disconnect(); this.notificationManager = null; } }
}
