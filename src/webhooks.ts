import { EventEmitter } from 'events';
import express from 'express';
import crypto from 'crypto';
import { logger } from './logger.js';

export interface WebhookEvent {
  type: 'issue.created' | 'issue.updated' | 'issue.deleted' | 'comment.added';
  projectId: string;
  issueId?: string;
  data: any;
  timestamp: Date;
}

export class WebhookHandler extends EventEmitter {
  private app: express.Application;
  private secret: string;
  private server: any;

  constructor(secret: string, port: number = 3000) {
    super();
    this.secret = secret;
    this.app = express();
    this.setupRoutes();
    
    this.server = this.app.listen(port, () => {
      logger.info(`Webhook server listening on port ${port}`);
      console.log(`Webhook server listening on port ${port}`);
    });
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    this.app.post('/webhook/youtrack', (req, res) => {
      try {
        // Verify webhook signature if secret is provided
        if (this.secret && !this.verifySignature(req)) {
          logger.warn('Invalid webhook signature', { ip: req.ip });
          return res.status(401).send('Invalid signature');
        }

        const event: WebhookEvent = {
          type: req.body.eventType,
          projectId: req.body.project?.id,
          issueId: req.body.issue?.id,
          data: req.body,
          timestamp: new Date(),
        };

        logger.info('Webhook event received', { 
          type: event.type, 
          projectId: event.projectId, 
          issueId: event.issueId 
        });

        this.emit('event', event);
        res.status(200).send('OK');
      } catch (error) {
        logger.error('Webhook processing error', { error });
        res.status(500).send('Internal Server Error');
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });
  }

  private verifySignature(req: express.Request): boolean {
    const signature = req.headers['x-youtrack-signature'] as string;
    if (!signature) return false;

    try {
      const hmac = crypto.createHmac('sha256', this.secret);
      hmac.update(JSON.stringify(req.body));
      const calculatedSignature = `sha256=${hmac.digest('hex')}`;

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(calculatedSignature)
      );
    } catch (error) {
      logger.error('Signature verification error', { error });
      return false;
    }
  }

  stop(): void {
    if (this.server) {
      this.server.close(() => {
        logger.info('Webhook server stopped');
      });
    }
  }
}
