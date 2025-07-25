#!/usr/bin/env node

// Set MCP server mode FIRST, before any imports that use logger
process.env.MCP_SERVER = 'true';

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
    logger.info('Initializing YouTrack MCP Server', { 
      url: youtrackUrl, 
      tokenLength: youtrackToken?.length,
      hasToken: !!youtrackToken 
    });
    
    // Use single consolidated YouTrack client
    this.youtrackClient = new YouTrackClient(youtrackUrl, youtrackToken);
    logger.info('Consolidated YouTrack client initialized successfully');

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

  // Helper method to resolve project ID with defaults
  private resolveProjectId(providedProjectId?: string): string {
    const config = this.config.get();
    const projectId = providedProjectId || config.defaultProjectId;
    
    if (!projectId) {
      throw new Error('Project ID is required. Either provide projectId parameter or set PROJECT_ID environment variable.');
    }
    
    return projectId;
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
          case 'list_projects': {
            logger.info('Executing list_projects with consolidated client');
            
            // Diagnostic info
            const { youtrackUrl, youtrackToken } = this.config.get();
            logger.info('Config details for list_projects', { 
              url: youtrackUrl, 
              tokenLength: youtrackToken?.length 
            });
            
            try {
              const projects = await this.youtrackClient.listProjects(args.fields as string);
              logger.info('Successfully retrieved projects', { count: projects.length });
              result = {
                content: [{
                  type: 'text',
                  text: JSON.stringify(projects, null, 2)
                }]
              };
            } catch (error) {
              logger.error('Consolidated client error in list_projects', { 
                error: (error as Error).message,
                stack: (error as Error).stack
              });
              throw error;
            }
            break;
          }

          case 'validate_project': {
            logger.info('Executing validate_project with consolidated client', { projectId: args.projectId });
            const validation = await this.youtrackClient.validateProject(args.projectId as string);
            logger.info('Successfully validated project', { result: validation });
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(validation, null, 2)
              }]
            };
            break;
          }

          case 'get_project_status': {
            const stats = await this.youtrackClient.getProjectStats(args.projectId as string);
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(stats, null, 2)
              }]
            };
            break;
          }

          case 'get_project_custom_fields': {
            const customFields = await this.youtrackClient.getProjectCustomFields(args.projectId as string);
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(customFields, null, 2)
              }]
            };
            break;
          }

          case 'create_issue':
            result = await this.youtrackClient.createIssue({
              projectId: this.resolveProjectId(args.projectId as string),
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

          case 'bulk_update_issues':
            result = await this.youtrackClient.bulkUpdateIssues(
              args.issueIds as string[],
              args.updates as any
            );
            break;

          // Milestone Management Tools
          case 'create_milestone':
            result = await this.youtrackClient.createMilestone({
              projectId: this.resolveProjectId(args.projectId as string),
              name: args.name as string,
              targetDate: args.targetDate as string,
              description: args.description as string,
              criteria: args.criteria as string[],
            });
            break;

          case 'assign_issues_to_milestone':
            result = await this.youtrackClient.assignIssuesToMilestone({
              milestoneId: args.milestoneId as string,
              issueIds: args.issueIds as string[],
            });
            break;

          case 'get_milestone_progress':
            result = await this.youtrackClient.getMilestoneProgress(args.milestoneId as string);
            break;

          case 'log_work_time':
            result = await this.youtrackClient.logWorkTime({
              issueId: args.issueId as string,
              duration: args.duration as string,
              date: args.date as string,
              description: args.description as string,
              workType: args.workType as string,
            });
            break;

          // PHASE 1: REPORTS & ENHANCED TIMESHEET HANDLERS
          case 'get_time_tracking_report':
            result = await this.youtrackClient.getTimeTrackingReport({
              projectId: args.projectId as string,
              userId: args.userId as string,
              startDate: args.startDate as string,
              endDate: args.endDate as string,
              groupBy: args.groupBy as 'user' | 'issue' | 'date' | 'workType',
            });
            break;

          case 'get_user_timesheet':
            result = await this.youtrackClient.getUserTimesheet({
              userId: args.userId as string,
              startDate: args.startDate as string,
              endDate: args.endDate as string,
              includeDetails: args.includeDetails as boolean,
            });
            break;

          case 'get_project_statistics': {
            const period = (args.startDate && args.endDate) ? {
              startDate: args.startDate as string,
              endDate: args.endDate as string
            } : undefined;
            
            result = await this.youtrackClient.getProjectStatistics({
              projectId: args.projectId as string,
              period: period,
              includeTimeTracking: args.includeTimeTracking as boolean,
            });
            break;
          }

          // ========================
          // PHASE 2: AGILE BOARDS
          // ========================
          case 'list_agile_boards':
            result = await this.youtrackClient.listAgileBoards({
              projectId: args.projectId as string,
              includeDetails: args.includeDetails as boolean,
            });
            break;

          case 'get_board_details':
            result = await this.youtrackClient.getBoardDetails({
              boardId: args.boardId as string,
              includeColumns: args.includeColumns as boolean,
              includeSprints: args.includeSprints as boolean,
            });
            break;

          case 'list_sprints':
            result = await this.youtrackClient.listSprints({
              boardId: args.boardId as string,
              includeArchived: args.includeArchived as boolean,
              includeIssues: args.includeIssues as boolean,
            });
            break;

          case 'get_sprint_details':
            result = await this.youtrackClient.getSprintDetails({
              boardId: args.boardId as string,
              sprintId: args.sprintId as string,
              includeIssues: args.includeIssues as boolean,
            });
            break;

          case 'assign_issue_to_sprint':
            result = await this.youtrackClient.assignIssueToSprint({
              issueId: args.issueId as string,
              sprintId: args.sprintId as string,
              boardId: args.boardId as string,
            });
            break;

          case 'remove_issue_from_sprint':
            result = await this.youtrackClient.removeIssueFromSprint({
              issueId: args.issueId as string,
              sprintId: args.sprintId as string,
            });
            break;

          case 'get_sprint_progress':
            result = await this.youtrackClient.getSprintProgress({
              boardId: args.boardId as string,
              sprintId: args.sprintId as string,
              includeBurndown: args.includeBurndown as boolean,
            });
            break;

          // ===========================
          // PHASE 3: KNOWLEDGE BASE
          // ===========================
          case 'list_articles':
            result = await this.youtrackClient.listArticles({
              projectId: args.projectId as string,
              query: args.query as string,
              includeContent: args.includeContent as boolean,
            });
            break;

          case 'get_article':
            result = await this.youtrackClient.getArticle({
              articleId: args.articleId as string,
              includeComments: args.includeComments as boolean,
            });
            break;

          case 'create_article':
            result = await this.youtrackClient.createArticle({
              title: args.title as string,
              summary: args.summary as string,
              content: args.content as string,
              projectId: this.resolveProjectId(args.projectId as string),
              tags: args.tags as string[],
            });
            break;

          case 'update_article':
            result = await this.youtrackClient.updateArticle({
              articleId: args.articleId as string,
              title: args.title as string,
              summary: args.summary as string,
              content: args.content as string,
              tags: args.tags as string[],
            });
            break;

          case 'delete_article':
            result = await this.youtrackClient.deleteArticle({
              articleId: args.articleId as string,
            });
            break;

          case 'search_articles':
            result = await this.youtrackClient.searchArticles({
              searchTerm: args.searchTerm as string,
              projectId: args.projectId as string,
              tags: args.tags as string[],
              includeContent: args.includeContent as boolean,
            });
            break;

          case 'get_articles_by_tag':
            result = await this.youtrackClient.getArticlesByTag({
              tag: args.tag as string,
              projectId: args.projectId as string,
              includeContent: args.includeContent as boolean,
            });
            break;

          case 'get_knowledge_base_stats':
            result = await this.youtrackClient.getKnowledgeBaseStats({
              projectId: args.projectId as string,
            });
            break;

          case 'link_sub_article':
            result = await this.youtrackClient.linkSubArticle({
              parentArticleId: args.parentArticleId as string,
              childArticleId: args.childArticleId as string,
            });
            break;

          case 'get_sub_articles':
            result = await this.youtrackClient.getSubArticles({
              parentArticleId: args.parentArticleId as string,
              includeContent: args.includeContent as boolean,
            });
            break;

          case 'link_articles_with_fallback':
            // Use the existing linkSubArticle method instead of complex hierarchy
            result = await this.youtrackClient.linkSubArticle({
              parentArticleId: args.parentId as string,
              childArticleId: args.childId as string,
            });
            break;

          case 'get_article_hierarchy':
            // Use the existing getSubArticles method instead of complex hierarchy
            result = await this.youtrackClient.getSubArticles({
              parentArticleId: args.articleId as string,
              includeContent: true,
            });
            break;

          case 'create_article_group': {
            const articles = args.articles as Array<{
              title: string;
              content: string;
              tags?: string[];
              parentIndex?: number;
            }>;
            const projectId = args.projectId as string;
            
            // Simple implementation: create articles sequentially and link them
            const groupResults = {
              created: [] as Array<{ id: string; title: string; index: number }>,
              errors: [] as Array<{ index: number; error: string }>,
              links: [] as Array<{ success: boolean; parentId: string; childId: string; method: string; error?: string }>
            };

            // Create all articles first
            for (let i = 0; i < articles.length; i++) {
              try {
                const articleResponse = await this.youtrackClient.createArticle({
                  title: articles[i].title,
                  content: articles[i].content,
                  projectId,
                  tags: articles[i].tags || []
                });

                // Extract article ID (simple extraction)
                const articleId = this.extractArticleIdFromResponse(articleResponse);
                groupResults.created.push({ 
                  id: articleId, 
                  title: articles[i].title, 
                  index: i 
                });
              } catch (error) {
                groupResults.errors.push({ 
                  index: i, 
                  error: error instanceof Error ? error.message : String(error)
                });
              }
            }

            // Create links between articles
            for (let i = 0; i < articles.length; i++) {
              const article = articles[i];
              if (article.parentIndex !== undefined) {
                const child = groupResults.created.find(c => c.index === i);
                const parent = groupResults.created.find(c => c.index === article.parentIndex);
                
                if (child && parent) {
                  try {
                    await this.youtrackClient.linkSubArticle({
                      parentArticleId: parent.id,
                      childArticleId: child.id
                    });
                    
                    groupResults.links.push({
                      success: true,
                      parentId: parent.id,
                      childId: child.id,
                      method: 'api',
                      error: undefined
                    });
                  } catch (error) {
                    groupResults.links.push({
                      success: false,
                      parentId: parent.id,
                      childId: child.id,
                      method: 'failed',
                      error: error instanceof Error ? error.message : String(error)
                    });
                  }
                }
              }
            }

            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(groupResults, null, 2)
              }]
            };
            break;
          }

          // ===========================
          // PHASE 4: GANTT CHARTS & DEPENDENCIES
          // ===========================
          case 'get_project_timeline':
            result = await this.youtrackClient.getProjectTimeline({
              projectId: args.projectId as string,
              startDate: args.startDate as string,
              endDate: args.endDate as string,
              includeCompleted: args.includeCompleted as boolean,
            });
            break;

          case 'create_issue_dependency':
            result = await this.youtrackClient.createIssueDependency({
              sourceIssueId: args.sourceIssueId as string,
              targetIssueId: args.targetIssueId as string,
              linkType: args.linkType as string,
            });
            break;

          case 'get_issue_dependencies':
            result = await this.youtrackClient.getIssueDependencies({
              issueId: args.issueId as string,
              includeTransitive: args.includeTransitive as boolean,
            });
            break;

          case 'get_critical_path':
            result = await this.youtrackClient.getCriticalPath({
              projectId: args.projectId as string,
              targetIssueId: args.targetIssueId as string,
            });
            break;

          case 'get_resource_allocation':
            result = await this.youtrackClient.getResourceAllocation({
              projectId: args.projectId as string,
              startDate: args.startDate as string,
              endDate: args.endDate as string,
            });
            break;

          case 'create_epic':
            result = await this.youtrackClient.createEpic({
              projectId: this.resolveProjectId(args.projectId as string),
              summary: args.summary as string,
              description: args.description as string,
              priority: args.priority as string,
              assignee: args.assignee as string,
              dueDate: args.dueDate as string,
            });
            break;

          case 'discover_project_fields':
            result = await this.youtrackClient.discoverProjectFields(args.projectId as string);
            break;

          case 'get_project_field_values':
            result = await this.youtrackClient.getProjectFieldValues(
              args.projectId as string,
              args.fieldName as string
            );
            break;

          case 'compare_project_fields':
            result = await this.youtrackClient.compareProjectFields(
              args.projectId1 as string,
              args.projectId2 as string
            );
            break;

          case 'get_project_field_schema':
            result = await this.youtrackClient.getProjectFieldSchema(args.projectId as string);
            break;

          case 'get_all_project_fields_summary':
            result = await this.youtrackClient.getAllProjectFieldsSummary();
            break;

          case 'generate_gantt_chart':
            result = await this.youtrackClient.generateGanttChart({
              projectId: args.projectId as string,
              startDate: args.startDate as string,
              endDate: args.endDate as string,
              includeCompleted: args.includeCompleted as boolean,
              includeCriticalPath: args.includeCriticalPath as boolean,
              includeResources: args.includeResources as boolean,
              hierarchicalView: args.hierarchicalView as boolean
            });
            break;

          case 'route_issue_dependencies':
            result = await this.youtrackClient.routeIssueDependencies({
              projectId: args.projectId as string,
              sourceIssueId: args.sourceIssueId as string,
              targetIssueId: args.targetIssueId as string,
              dependencyType: args.dependencyType as 'FS' | 'SS' | 'FF' | 'SF',
              lag: args.lag as number,
              constraint: args.constraint as 'hard' | 'soft'
            });
            break;

          case 'analyze_dependency_network':
            result = await this.youtrackClient.analyzeDependencyNetwork(args.projectId as string);
            break;

          case 'calculate_critical_path':
            result = await this.youtrackClient.calculateCriticalPath({
              projectId: args.projectId as string,
              targetIssueId: args.targetIssueId as string
            });
            break;

          case 'route_multiple_dependencies':
            result = await this.youtrackClient.routeMultipleDependencies({
              projectId: args.projectId as string,
              dependencies: args.dependencies as Array<{
                sourceIssueId: string;
                targetIssueId: string;
                dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
                lag?: number;
                constraint?: 'hard' | 'soft';
              }>,
              validateCircular: args.validateCircular as boolean
            });
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

  /**
   * Helper method to extract article ID from YouTrack API response
   */
  private extractArticleIdFromResponse(response: any): string {
    // Try different ways to extract the ID based on the response structure
    if (response.id) {
      return response.id;
    }
    if (response.content && response.content[0] && response.content[0].text) {
      const match = response.content[0].text.match(/Article ID: ([a-zA-Z0-9-]+)/);
      if (match) return match[1];
    }
    if (response.articleId) {
      return response.articleId;
    }
    throw new Error('Could not extract article ID from response');
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('YouTrack MCP Server started');
  }

  public async stop(): Promise<void> {
    await this.server.close();
    logger.info('YouTrack MCP Server stopped');
  }
}

// Main execution
async function main() {
  try {
    logger.info('Initializing YouTrack MCP Server...');
    const server = new YouTrackMCPServer();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    // Start the server
    logger.info('Starting MCP server...');
    await server.run();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  logger.error('Fatal error during startup:', error);
  process.exit(1);
});
