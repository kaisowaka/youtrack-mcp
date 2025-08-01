import { EnhancedBaseAPIClient, MCPResponse, YouTrackConfig } from '../base/enhanced-base-client.js';
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
 * Covers 4 endpoints from OpenAPI specification (previously 0% coverage)
 */
export class AgileAPIClient extends EnhancedBaseAPIClient {
  
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
      const endpoint = '/api/agiles';
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
}
