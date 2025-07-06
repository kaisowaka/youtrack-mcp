#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { YouTrackClient, MCPResponse } from './youtrack-client.js';
import { ConfigManager } from './config.js';
import { toolDefinitions } from './tools.js';
import { logger } from './logger.js';
import { WebhookHandler } from './webhooks.js';

// Load environment variables
dotenv.config();

class YouTrackMCPServer {
  private server: Server;
  private youtrackClient: YouTrackClient;
  private config: ConfigManager;
  private webhookHandler?: WebhookHandler;

  constructor() {
    this.config = new ConfigManager();
    this.config.validate();

    const { youtrackUrl, youtrackToken } = this.config.get();
    this.youtrackClient = new YouTrackClient(youtrackUrl, youtrackToken);

    this.server = new Server(
      {
        name: 'youtrack-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupWebhooks();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: toolDefinitions,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args = {} } = request.params;

      try {
        let result: MCPResponse;
        
        switch (name) {
          case 'get_project_status':
            result = await this.youtrackClient.getProjectStatus(
              args.projectId as string,
              (args.includeIssues as boolean) ?? true
            );
            break;

          case 'create_issue':
            result = await this.youtrackClient.createIssue({
              projectId: args.projectId as string,
              summary: args.summary as string,
              description: args.description as string,
              type: args.type as string,
              priority: args.priority as string,
            });
            break;

          case 'query_issues':
            result = await this.youtrackClient.queryIssues(
              args.query as string,
              args.fields as string,
              args.limit as number
            );
            break;

          case 'update_issue':
            result = await this.youtrackClient.updateIssue(
              args.issueId as string,
              args.updates as any
            );
            break;

          case 'get_project_issues_summary':
            result = await this.youtrackClient.getProjectIssuesSummary(
              args.projectId as string
            );
            break;

          case 'get_issue_comments':
            result = await this.youtrackClient.getIssueComments(args.issueId as string);
            break;

          case 'add_issue_comment':
            result = await this.youtrackClient.addIssueComment(
              args.issueId as string,
              args.text as string
            );
            break;

          case 'search_users':
            result = await this.youtrackClient.searchUsers(args.query as string);
            break;

          case 'get_project_timeline':
            result = await this.youtrackClient.getProjectTimeline(
              args.projectId as string,
              args.days as number
            );
            break;

          case 'bulk_update_issues':
            result = await this.youtrackClient.bulkUpdateIssues(
              args.issueIds as string[],
              args.updates as any
            );
            break;

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
        
        // Return in the format expected by MCP
        return {
          content: result.content,
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Tool execution error', { tool: name, error: errorMessage, args });
        
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Failed to execute ${name}: ${errorMessage}`
        );
      }
    });
  }

  private setupWebhooks(): void {
    const enableWebhooks = process.env.ENABLE_WEBHOOKS === 'true';
    
    if (enableWebhooks) {
      const port = parseInt(process.env.WEBHOOK_PORT || '3000');
      const secret = process.env.WEBHOOK_SECRET || '';
      
      this.webhookHandler = new WebhookHandler(secret, port);
      
      this.webhookHandler.on('event', (event) => {
        logger.info('Webhook event received', {
          type: event.type,
          projectId: event.projectId,
          issueId: event.issueId,
        });
        
        // Clear relevant cache entries when issues are updated
        if (event.projectId) {
          // Clear project-related cache entries
          this.youtrackClient.clearCache(`project-.*-${event.projectId}`);
        }
      });
      
      logger.info('Webhook handler initialized', { port });
    }
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('YouTrack MCP Server started');
  }

  public async stop(): Promise<void> {
    if (this.webhookHandler) {
      this.webhookHandler.stop();
    }
    logger.info('YouTrack MCP Server stopped');
  }
}

// Handle graceful shutdown
async function main() {
  const server = new YouTrackMCPServer();
  
  // Handle shutdown signals
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await server.run();
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Unhandled error in main', { error });
    process.exit(1);
  });
}
