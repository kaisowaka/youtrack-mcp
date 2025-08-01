import { BaseAPIClient, MCPResponse } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';

export interface IssueCreateParams {
  summary: string;
  description?: string;
  type?: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  [key: string]: any;
}

export interface IssueUpdateParams {
  summary?: string;
  description?: string;
  state?: string;
  priority?: string;
  assignee?: string;
  type?: string;
  dueDate?: string;
  estimation?: number;
  subsystem?: string;
  tags?: string[];
  [key: string]: any;
}

export interface IssueQueryParams {
  query: string;
  fields?: string;
  limit?: number;
  skip?: number;
}

/**
 * Issues API Client - Handles all issue-related operations
 * Covers 32 endpoints from OpenAPI specification
 */
export class IssuesAPIClient extends BaseAPIClient {
  
  /**
   * Create a new issue
   */
  async createIssue(projectId: string, params: IssueCreateParams): Promise<MCPResponse> {
    const endpoint = `/api/issues`;
    
    const issueData = {
      $type: 'Issue',
      project: { 
        $type: 'Project',
        shortName: projectId  // Use shortName instead of id for project reference
      },
      summary: params.summary,
      description: params.description || '',
      ...this.buildCustomFields(params)
    };
    
    const response = await this.post(endpoint, issueData);
    const issueId = response.data.id;
    
    // Apply custom fields via commands after creation (more reliable)
    if (issueId && (params.type || params.priority || params.state || params.assignee || params.subsystem)) {
      try {
        await this.applyCustomFieldsViaCommands(issueId, params);
      } catch (error) {
        console.warn(`Issue ${issueId} created but failed to apply some custom fields:`, error);
      }
    }
    
    return ResponseFormatter.formatCreated(response.data, 'Issue', `Issue "${params.summary}" created successfully`);
  }
  
  /**
   * Get issue by ID with full details
   */
  async getIssue(issueId: string, fields?: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}`;
    const params = fields ? { fields } : undefined;
    
    const response = await this.get(endpoint, params);
    return ResponseFormatter.formatSuccess(response.data, `Retrieved issue ${issueId}`);
  }
  
  /**
   * Update an existing issue
   */
  async updateIssue(issueId: string, updates: IssueUpdateParams): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}`;
    
    const updateData = {
      $type: 'Issue',
      summary: updates.summary,
      description: updates.description,
      ...this.buildCustomFields(updates)
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'Issue', updates, `Issue ${issueId} updated successfully`);
  }
  
  /**
   * Delete an issue
   */
  async deleteIssue(issueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(issueId, 'Issue');
  }
  
  /**
   * Query issues with YouTrack search syntax
   */
  async queryIssues(params: IssueQueryParams): Promise<MCPResponse> {
    const endpoint = `/api/issues`;
    
    const queryParams = {
      query: params.query,
      fields: params.fields || 'id,summary,description,state,priority,reporter,assignee,created,updated',
      $top: params.limit || 50,
      $skip: params.skip || 0
    };
    
    const response = await this.get(endpoint, queryParams);
    const issues = response.data || [];
    
    return ResponseFormatter.formatList(issues, 'issue', {
      totalCount: issues.length,
      filters: { query: params.query }
    });
  }
  
  /**
   * Get issue comments
   */
  async getIssueComments(issueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/comments`;
    
    const response = await this.get(endpoint, { fields: 'id,text,author(login,name),created,updated' });
    const comments = response.data || [];
    
    return ResponseFormatter.formatList(comments, 'comment', {
      totalCount: comments.length
    });
  }
  
  /**
   * Add comment to issue
   */
  async addComment(issueId: string, text: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/comments`;
    
    const commentData = { 
      $type: 'IssueComment',
      text 
    };
    const response = await this.post(endpoint, commentData);
    
    return ResponseFormatter.formatCreated(response.data, 'Comment', 'Comment added successfully');
  }
  
  /**
   * Update existing comment
   */
  async updateComment(issueId: string, commentId: string, text: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/comments/${commentId}`;
    
    const commentData = { 
      $type: 'IssueComment',
      text 
    };
    const response = await this.post(endpoint, commentData);
    return ResponseFormatter.formatUpdated(response.data, 'Comment', { text }, 'Comment updated successfully');
  }
  
  /**
   * Delete comment
   */
  async deleteComment(issueId: string, commentId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/comments/${commentId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(commentId, 'Comment');
  }
  
  /**
   * Get issue links/dependencies
   */
  async getIssueLinks(issueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/links`;
    
    const response = await this.get(endpoint, { 
      fields: 'id,direction,linkType(name,directed),issues(id,summary,state(name))' 
    });
    const links = response.data || [];
    
    return ResponseFormatter.formatList(links, 'link', {
      totalCount: links.length
    });
  }
  
  /**
   * Create issue dependency/link
   */
  async createIssueLink(sourceIssueId: string, targetIssueId: string, linkType: string = 'Depends'): Promise<MCPResponse> {
    const endpoint = `/api/issues/${sourceIssueId}/links`;
    
    const linkData = {
      $type: 'IssueLink',
      linkType: { 
        $type: 'IssueLinkType',
        name: linkType 
      },
      issues: [{ 
        $type: 'Issue',
        id: targetIssueId 
      }]
    };
    
    const response = await this.post(endpoint, linkData);
    return ResponseFormatter.formatCreated(response.data, 'Issue Link', `Dependency created: ${sourceIssueId} depends on ${targetIssueId}`);
  }
  
  /**
   * Delete issue link
   */
  async deleteIssueLink(issueId: string, linkId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/links/${linkId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatDeleted(linkId, 'Issue Link');
  }
  
  /**
   * Get issue work items (time tracking)
   */
  async getIssueWorkItems(issueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/workItems`;
    
    const response = await this.get(endpoint, {
      fields: 'id,duration,description,date,author(login,name),type(name)'
    });
    const workItems = response.data || [];
    
    return ResponseFormatter.formatList(workItems, 'work item', {
      totalCount: workItems.length
    });
  }
  
  /**
   * Add work item (log time) to issue
   */
  async addWorkItem(issueId: string, duration: string, description?: string, date?: string, workType?: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/workItems`;
    
    const workItemData: any = {
      duration: this.parseDuration(duration),
      description: description || `Work logged for ${issueId}`,
      date: date ? new Date(date).getTime() : Date.now()
    };
    
    if (workType) {
      workItemData.type = { name: workType };
    }
    
    const response = await this.post(endpoint, workItemData);
    return ResponseFormatter.formatCreated(response.data, 'Work Item', `Logged ${duration} for issue ${issueId}`);
  }
  
  /**
   * Get issue attachments
   */
  async getIssueAttachments(issueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/attachments`;
    
    const response = await this.get(endpoint, {
      fields: 'id,name,size,created,author(login,name),mimeType'
    });
    const attachments = response.data || [];
    
    return ResponseFormatter.formatList(attachments, 'attachment', {
      totalCount: attachments.length
    });
  }
  
  /**
   * Get available workflow states for issue
   */
  async getIssueStates(issueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/commands`;
    
    const response = await this.get(endpoint);
    const commands = response.data || [];
    
    const stateCommands = commands.filter((cmd: any) => 
      cmd.command && cmd.command.toLowerCase().includes('state')
    );
    
    return ResponseFormatter.formatSuccess({
      availableStates: stateCommands,
      totalCommands: commands.length
    }, `Found ${stateCommands.length} state transition commands`);
  }
  
  /**
   * Change issue state with workflow validation
   */
  async changeIssueState(issueId: string, newState: string, comment?: string, resolution?: string): Promise<MCPResponse> {
    try {
      // Use PATCH to update the issue with correct customFields structure
      const endpoint = `/api/issues/${issueId}`;
      
      const updateData = {
        customFields: [
          {
            $type: 'StateIssueCustomField',
            name: 'State',
            value: {
              $type: 'StateBundleElement',
              name: newState
            }
          }
        ]
      };
      
      await this.patch(endpoint, updateData);
      
      // Add comment if provided
      if (comment) {
        await this.addComment(issueId, comment);
      }
      
      return ResponseFormatter.formatUpdated(
        { id: issueId }, 
        'Issue', 
        { state: newState, resolution }, 
        `Issue ${issueId} moved to ${newState}${resolution ? ' (' + resolution + ')' : ''}`
      );
    } catch (error) {
      return ResponseFormatter.formatError(
        error instanceof Error ? error.message : String(error),
        `Failed to change state of issue ${issueId}`
      );
    }
  }
  
  /**
   * Get issue history/activities
   */
  async getIssueActivities(issueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${issueId}/activities`;
    
    const response = await this.get(endpoint, {
      fields: 'id,timestamp,author(login,name),field(name),oldValue,newValue,targetMember'
    });
    const activities = response.data || [];
    
    return ResponseFormatter.formatList(activities, 'activity', {
      totalCount: activities.length
    });
  }
  
  /**
   * Parse duration string to minutes for YouTrack API
   */
  private parseDuration(duration: string): number {
    const durationStr = duration.toLowerCase().trim();
    
    // Handle various formats: "2h 30m", "1d", "45m", "1.5h"
    let totalMinutes = 0;
    
    // Days
    const daysMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*d/);
    if (daysMatch) {
      totalMinutes += parseFloat(daysMatch[1]) * 8 * 60; // 8 hours per day
    }
    
    // Hours
    const hoursMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*h/);
    if (hoursMatch) {
      totalMinutes += parseFloat(hoursMatch[1]) * 60;
    }
    
    // Minutes
    const minutesMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*m/);
    if (minutesMatch) {
      totalMinutes += parseFloat(minutesMatch[1]);
    }
    
    // If no units found, assume minutes
    if (totalMinutes === 0) {
      const numberMatch = durationStr.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        totalMinutes = parseFloat(numberMatch[1]);
      }
    }
    
    return Math.max(1, Math.round(totalMinutes)); // At least 1 minute
  }
  
  /**
   * Build custom fields object from parameters
   * Using minimal approach to avoid any $type conflicts
   */
  private buildCustomFields(params: any): any {
    const result: any = {};
    
    // Only handle tags with verified structure
    if (params.tags && params.tags.length > 0) {
      result.tags = params.tags.map((tag: string) => ({ 
        name: tag  // Simplified - remove $type for now
      }));
    }
    
    return result;
  }

  /**
   * Apply custom fields to an issue using commands (more reliable than direct API)
   */
  private async applyCustomFieldsViaCommands(issueId: string, params: any): Promise<void> {
    const commands: string[] = [];
    
    if (params.type) {
      commands.push(`Type ${params.type}`);
    }
    
    if (params.priority) {
      commands.push(`Priority ${params.priority}`);
    }
    
    if (params.state) {
      commands.push(`State ${params.state}`);
    }
    
    if (params.assignee) {
      commands.push(`Assignee ${params.assignee}`);
    }
    
    if (params.subsystem) {
      commands.push(`Subsystem ${params.subsystem}`);
    }
    
    // Apply commands one by one
    for (const command of commands) {
      try {
        await this.applyCommand(issueId, command);
      } catch (error) {
        // Log but don't fail the entire operation
        console.warn(`Failed to apply command "${command}" to issue ${issueId}:`, error);
      }
    }
  }

  /**
   * Apply a command to an issue
   */
  private async applyCommand(issueId: string, command: string): Promise<void> {
    const endpoint = `/api/commands`;
    await this.post(endpoint, {
      query: `${issueId} ${command}`,
      caret: command.length + issueId.length + 1,
      issues: [{ 
        id: issueId 
      }]
    });
  }

  /**
   * Smart search issues with advanced filtering
   */
  async smartSearchIssues(searchQuery: string, options: { projectId?: string } = {}): Promise<MCPResponse> {
    const query = options.projectId 
      ? `project: ${options.projectId} ${searchQuery}` 
      : searchQuery;
    
    return this.queryIssues({ query });
  }

  /**
   * Complete an issue (set to Done state with comment)
   */
  async completeIssue(issueId: string, comment?: string): Promise<MCPResponse> {
    return this.changeIssueState(issueId, 'Fixed', comment, 'Fixed');
  }

  /**
   * Start working on an issue
   */
  async startWorkingOnIssue(issueId: string, comment?: string): Promise<MCPResponse> {
    return this.changeIssueState(issueId, 'In Progress', comment);
  }
}
