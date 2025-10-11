import { BaseAPIClient, MCPResponse, YouTrackConfig } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';

export interface AgileBoard {
  id: string;
  name: string;
  projects?: Array<{
    id: string;
    name: string;
    shortName: string;
  }>;
  sprints?: Sprint[];
  columns?: BoardColumn[];
  currentSprint?: Sprint;
}

export interface Sprint {
  id: string;
  name: string;
  start?: number; // timestamp
  finish?: number; // timestamp
  archived?: boolean;
  goal?: string;
  issues?: Array<{
    id: string;
    summary: string;
    state?: string;
    priority?: string;
  }>;
}

export interface BoardColumn {
  id: string;
  name: string;
  presentation: {
    color?: string;
  };
  isResolved?: boolean;
  ordinal?: number;
}

export interface SprintParams {
  boardId: string;
  name: string;
  start?: string; // ISO date string
  finish?: string; // ISO date string
  goal?: string;
}

/**
 * Agile API Client - Handles agile board and sprint operations
 * Provides comprehensive sprint management and board functionality
 */
export class AgileAPIClient extends BaseAPIClient {
  
  constructor(config: YouTrackConfig) {
    super(config);
  }

  /**
   * List all agile boards with optional project filtering
   */
  async listAgileBoards(params: { 
    projectId?: string; 
    includeDetails?: boolean 
  } = {}): Promise<MCPResponse> {
    try {
      const endpoint = '/agiles';
      const queryParams: any = {
        fields: params.includeDetails 
          ? 'id,name,favorite,orphansAtTheTop,hideOrphansSwimlane,projects(id,name,shortName),sprints(id,name,archived,start,finish)'
          : 'id,name,favorite,projects(id,name,shortName)'
      };

      const response = await this.get(endpoint, queryParams);
      let boards = response.data || [];

      // Filter by project if specified
      if (params.projectId) {
        boards = boards.filter((board: any) => 
          board.projects?.some((p: any) => p.id === params.projectId)
        );
      }

      return ResponseFormatter.formatList(boards, 'agile board', {
        totalCount: boards.length
      });

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to list agile boards: ${error.message}`,
        { method: 'listAgileBoards', params }
      );
    }
  }

  /**
   * Get detailed information about a specific agile board
   */
  async getBoardDetails(params: {
    boardId: string;
    includeColumns?: boolean;
    includeSprints?: boolean;
  }): Promise<MCPResponse> {
    try {
      let fieldsParam = 'id,name,favorite,projects(id,name,shortName)';
      
      if (params.includeColumns) {
        fieldsParam += ',columns(id,name,presentation,isResolved,ordinal)';
      }
      
      if (params.includeSprints) {
        fieldsParam += ',sprints(id,name,start,finish,archived,goal)';
      }

      const board = await this.get<AgileBoard>(
        `/agiles/${params.boardId}`,
        { fields: fieldsParam }
      );

      // Enhance response with computed metrics
      const metrics = {
        totalSprints: board.data.sprints?.length || 0,
        activeSprints: board.data.sprints?.filter((s: any) => !s.archived).length || 0,
        totalColumns: board.data.columns?.length || 0,
        projectCount: board.data.projects?.length || 0
      };

      return ResponseFormatter.formatSuccess({
        board: board.data,
        metrics
      }, `Retrieved details for agile board: ${board.data.name}`);

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to get board details: ${error.message}`,
        { method: 'getBoardDetails', params }
      );
    }
  }

  /**
   * Create a new sprint in an agile board
   */
  async createSprint(params: SprintParams): Promise<MCPResponse> {
    try {
      const sprintData: any = {
        name: params.name
      };

      if (params.start) {
        sprintData.start = new Date(params.start).getTime();
      }
      
      if (params.finish) {
        sprintData.finish = new Date(params.finish).getTime();
      }
      
      if (params.goal) {
        sprintData.goal = params.goal;
      }

      const response = await this.post(
        `/agiles/${params.boardId}/sprints`,
        sprintData
      );

      return ResponseFormatter.formatCreated(
        response.data,
        'Sprint',
        `Sprint "${params.name}" created successfully in board ${params.boardId}`
      );

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to create sprint: ${error.message}`,
        { method: 'createSprint', params }
      );
    }
  }

  /**
   * Get detailed information about a specific sprint
   */
  async getSprintDetails(params: {
    boardId: string;
    sprintId: string;
  }): Promise<MCPResponse> {
    try {
      const sprint = await this.get<Sprint>(
        `/agiles/${params.boardId}/sprints/${params.sprintId}`,
        { fields: 'id,name,start,finish,archived,goal,issues(id,idReadable,summary,customFields(name,value))' }
      );

      return ResponseFormatter.formatSuccess(
        sprint.data,
        `Retrieved sprint details: ${sprint.data.name}`
      );

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to get sprint details: ${error.message}`,
        { method: 'getSprintDetails', params }
      );
    }
  }

  /**
   * Update sprint details
   */
  async updateSprint(params: {
    boardId: string;
    sprintId: string;
    name?: string;
    start?: string;
    finish?: string;
    goal?: string;
  }): Promise<MCPResponse> {
    try {
      const sprintData: any = {};

      if (params.name) sprintData.name = params.name;
      if (params.goal !== undefined) sprintData.goal = params.goal;
      
      if (params.start) {
        sprintData.start = new Date(params.start).getTime();
      }
      
      if (params.finish) {
        sprintData.finish = new Date(params.finish).getTime();
      }

      const response = await this.post(
        `/agiles/${params.boardId}/sprints/${params.sprintId}`,
        sprintData
      );

      return ResponseFormatter.formatUpdated(
        response.data,
        'Sprint',
        { ...sprintData },
        `Sprint updated successfully`
      );

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to update sprint: ${error.message}`,
        { method: 'updateSprint', params }
      );
    }
  }

  /**
   * Archive a sprint
   */
  async archiveSprint(params: {
    boardId: string;
    sprintId: string;
  }): Promise<MCPResponse> {
    try {
      const response = await this.post(
        `/agiles/${params.boardId}/sprints/${params.sprintId}`,
        { archived: true }
      );

      return ResponseFormatter.formatSuccess(
        response.data,
        `Sprint archived successfully`
      );

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to archive sprint: ${error.message}`,
        { method: 'archiveSprint', params }
      );
    }
  }

  /**
   * Delete a sprint
   */
  async deleteSprint(params: {
    boardId: string;
    sprintId: string;
  }): Promise<MCPResponse> {
    try {
      await this.delete(`/agiles/${params.boardId}/sprints/${params.sprintId}`);

      return ResponseFormatter.formatDeleted(
        params.sprintId,
        'Sprint'
      );

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to delete sprint: ${error.message}`,
        { method: 'deleteSprint', params }
      );
    }
  }

  /**
   * Get all issues in a sprint
   */
  async getSprintIssues(params: {
    boardId: string;
    sprintId: string;
  }): Promise<MCPResponse> {
    try {
      const sprint = await this.get<Sprint>(
        `/agiles/${params.boardId}/sprints/${params.sprintId}`,
        { 
          fields: 'id,name,issues($type,id,idReadable,summary,customFields($type,name,value($type,name,presentation)),created,updated)'
        }
      );

      const issues = sprint.data.issues || [];

      return ResponseFormatter.formatSuccess({
        issues,
        count: issues.length,
        sprint: {
          id: params.sprintId,
          name: sprint.data.name
        }
      }, `Found ${issues.length} issue${issues.length !== 1 ? 's' : ''} in sprint "${sprint.data.name}"`);

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to get sprint issues: ${error.message}`,
        { method: 'getSprintIssues', params }
      );
    }
  }

  /**
   * Assign issues to a sprint
   * Note: This is done by updating the issue's sprint custom field
   */
  async assignIssuesToSprint(params: {
    boardId: string;
    sprintId: string;
    issueIds: string[];
  }): Promise<MCPResponse> {
    try {
      // First, get the board to find the sprint sync field
      const board = await this.get<AgileBoard>(
        `/agiles/${params.boardId}`,
        { fields: 'id,name,sprintsSettings(sprintSyncField($type,id,name))' }
      );

      const sprintField = (board.data as any).sprintsSettings?.sprintSyncField;
      
      if (!sprintField) {
        return ResponseFormatter.formatError(
          'Board does not have sprint sync field configured',
          { boardId: params.boardId }
        );
      }

      // Update each issue
      const results: Array<{ issueId: string; success: boolean; error?: string }> = [];
      
      for (const issueId of params.issueIds) {
        try {
          await this.post(`/issues/${issueId}`, {
            customFields: [{
              $type: 'SingleEnumIssueCustomField',
              id: sprintField.id,
              value: { id: params.sprintId }
            }]
          });
          
          results.push({ issueId, success: true });
        } catch (error: any) {
          results.push({ 
            issueId, 
            success: false, 
            error: error.message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;

      return ResponseFormatter.formatSuccess({
        assigned: results.filter(r => r.success).map(r => r.issueId),
        failed: results.filter(r => !r.success),
        summary: {
          total: results.length,
          success: successCount,
          failed: failureCount
        }
      }, `Assigned ${successCount} of ${results.length} issues to sprint`);

    } catch (error: any) {
      return ResponseFormatter.formatError(
        `Failed to assign issues to sprint: ${error.message}`,
        { method: 'assignIssuesToSprint', params }
      );
    }
  }
}

