import { BaseAPIClient, MCPResponse } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';

export interface ProjectCreateParams {
  name: string;
  shortName: string;
  description?: string;
  lead?: string;
  startingNumber?: number;
  template?: string;
}

export interface UserCreateParams {
  login: string;
  fullName: string;
  email: string;
  password?: string;
  groups?: string[];
  banned?: boolean;
}

export interface GroupCreateParams {
  name: string;
  description?: string;
  autoJoin?: boolean;
  teamForProject?: string;
}

export interface CustomFieldParams {
  name: string;
  type: 'string' | 'integer' | 'float' | 'date' | 'period' | 'user' | 'group' | 'enum' | 'state' | 'build' | 'version';
  isPrivate?: boolean;
  defaultValues?: string[];
  canBeEmpty?: boolean;
  emptyFieldText?: string;
}

/**
 * Admin API Client - Handles administrative operations
 * Covers user management, system configuration, and advanced operations
 */
export class AdminAPIClient extends BaseAPIClient {

  // ==================== PROJECT ADMINISTRATION ====================

  /**
   * Create a new project
   */
  async createProject(params: ProjectCreateParams): Promise<MCPResponse> {
    const endpoint = '/api/admin/projects';
    
    const projectData = {
      name: params.name,
      shortName: params.shortName,
      description: params.description || '',
      leader: params.lead ? { login: params.lead } : undefined,
      startingNumber: params.startingNumber || 1,
      template: params.template ? { name: params.template } : undefined
    };

    const response = await this.post(endpoint, projectData);
    return ResponseFormatter.formatCreated(response.data, 'Project', `Project "${params.name}" (${params.shortName}) created successfully`);
  }

  /**
   * Get all projects with administrative details
   */
  async getAllProjects(includeArchived: boolean = false): Promise<MCPResponse> {
    const endpoint = '/api/admin/projects';
    const params = {
      fields: 'id,name,shortName,description,archived,leader(login,name),createdBy(login),created,issues,customFields(field(name))',
      archived: includeArchived
    };

    const response = await this.get(endpoint, params);
    const projects = response.data || [];

    return ResponseFormatter.formatList(projects, 'project', {
      totalCount: projects.length,
      filters: { includeArchived }
    });
  }

  /**
   * Update project settings
   */
  async updateProject(projectId: string, updates: Partial<ProjectCreateParams>): Promise<MCPResponse> {
    const endpoint = `/api/admin/projects/${projectId}`;
    
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.lead) updateData.leader = { login: updates.lead };

    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'Project', updates, `Project ${projectId} updated successfully`);
  }

  /**
   * Delete/archive project
   */
  async deleteProject(projectId: string, archive: boolean = true): Promise<MCPResponse> {
    if (archive) {
      const endpoint = `/api/admin/projects/${projectId}`;
      const response = await this.post(endpoint, { archived: true });
      return ResponseFormatter.formatUpdated(response.data, 'Project', { archived: true }, `Project ${projectId} archived successfully`);
    } else {
      const endpoint = `/api/admin/projects/${projectId}`;
      await this.delete(endpoint);
      return ResponseFormatter.formatDeleted(projectId, 'Project');
    }
  }

  // ==================== USER MANAGEMENT ====================

  /**
   * Create new user account
   */
  async createUser(params: UserCreateParams): Promise<MCPResponse> {
    const endpoint = '/api/admin/users';
    
    const userData = {
      login: params.login,
      fullName: params.fullName,
      email: params.email,
      password: params.password,
      banned: params.banned || false,
      groups: params.groups?.map(group => ({ name: group })) || []
    };

    const response = await this.post(endpoint, userData);
    return ResponseFormatter.formatCreated(response.data, 'User', `User "${params.login}" created successfully`);
  }

  /**
   * Get all users with administrative details
   */
  async getAllUsers(query?: string, limit: number = 100): Promise<MCPResponse> {
    const endpoint = '/api/users';
    const params: any = { $top: limit };
    
    if (query) {
      params.query = query;
    }

    try {
      const response = await this.axios.get(endpoint, { params });
      return ResponseFormatter.formatSuccess(response.data, 
        `Found ${response.data?.length || 0} users`, {
        source: endpoint
      });
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get users: ${error.message}`, error, { 
        source: endpoint 
      });
    }
  }

  /**
   * Search users by query string
   */
  async searchUsers(query: string, limit: number = 100): Promise<MCPResponse> {
    return this.getAllUsers(query, limit);
  }

  /**
   * Update user account
   */
  async updateUser(userId: string, updates: Partial<UserCreateParams>): Promise<MCPResponse> {
    const endpoint = `/api/admin/users/${userId}`;
    
    const updateData: any = {};
    if (updates.fullName) updateData.fullName = updates.fullName;
    if (updates.email) updateData.email = updates.email;
    if (updates.banned !== undefined) updateData.banned = updates.banned;
    if (updates.groups) updateData.groups = updates.groups.map(group => ({ name: group }));

    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'User', updates, `User ${userId} updated successfully`);
  }

  /**
   * Ban/unban user
   */
  async banUser(userId: string, banned: boolean = true, reason?: string): Promise<MCPResponse> {
    const endpoint = `/api/admin/users/${userId}`;
    
    const updateData = {
      banned,
      banReason: reason
    };

    const response = await this.post(endpoint, updateData);
    const action = banned ? 'banned' : 'unbanned';
    return ResponseFormatter.formatUpdated(response.data, 'User', { banned }, `User ${userId} ${action} successfully`);
  }

  // ==================== GROUP MANAGEMENT ====================

  /**
   * Create user group
   */
  async createGroup(params: GroupCreateParams): Promise<MCPResponse> {
    const endpoint = '/api/admin/groups';
    
    const groupData = {
      name: params.name,
      description: params.description || '',
      autoJoin: params.autoJoin || false,
      teamForProject: params.teamForProject ? { shortName: params.teamForProject } : undefined
    };

    const response = await this.post(endpoint, groupData);
    return ResponseFormatter.formatCreated(response.data, 'Group', `Group "${params.name}" created successfully`);
  }

  /**
   * Get all user groups
   */
  async getAllGroups(): Promise<MCPResponse> {
    const endpoint = '/api/admin/groups';
    const params = {
      fields: 'id,name,description,autoJoin,userCount,teamForProject(shortName,name)'
    };

    const response = await this.get(endpoint, params);
    const groups = response.data || [];

    return ResponseFormatter.formatList(groups, 'group', {
      totalCount: groups.length
    });
  }

  /**
   * Add user to group
   */
  async addUserToGroup(groupId: string, userId: string): Promise<MCPResponse> {
    const endpoint = `/api/admin/groups/${groupId}/users`;
    
    const userData = { id: userId };
    await this.post(endpoint, userData);
    
    return ResponseFormatter.formatSuccess({
      groupId,
      userId,
      action: 'added'
    }, `User ${userId} added to group ${groupId}`);
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(groupId: string, userId: string): Promise<MCPResponse> {
    const endpoint = `/api/admin/groups/${groupId}/users/${userId}`;
    
    await this.delete(endpoint);
    return ResponseFormatter.formatSuccess({
      groupId,
      userId,
      action: 'removed'
    }, `User ${userId} removed from group ${groupId}`);
  }

  // ==================== CUSTOM FIELDS MANAGEMENT ====================

  /**
   * Create custom field
   */
  async createCustomField(params: CustomFieldParams): Promise<MCPResponse> {
    const endpoint = '/api/admin/customFieldSettings/customFields';
    
    const fieldData = {
      name: params.name,
      fieldType: { id: params.type },
      isPrivate: params.isPrivate || false,
      defaultValues: params.defaultValues || [],
      canBeEmpty: params.canBeEmpty !== false,
      emptyFieldText: params.emptyFieldText || null
    };

    const response = await this.post(endpoint, fieldData);
    return ResponseFormatter.formatCreated(response.data, 'Custom Field', `Custom field "${params.name}" created successfully`);
  }

  /**
   * Get all custom fields
   */
  async getAllCustomFields(): Promise<MCPResponse> {
    const endpoint = '/api/admin/customFieldSettings/customFields';
    const params = {
      fields: 'id,name,fieldType(presentation),isPrivate,canBeEmpty,emptyFieldText,defaultValues'
    };

    const response = await this.get(endpoint, params);
    const fields = response.data || [];

    return ResponseFormatter.formatList(fields, 'custom field', {
      totalCount: fields.length
    });
  }

  /**
   * Update custom field settings
   */
  async updateCustomField(fieldId: string, updates: Partial<CustomFieldParams>): Promise<MCPResponse> {
    const endpoint = `/api/admin/customFieldSettings/customFields/${fieldId}`;
    
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.isPrivate !== undefined) updateData.isPrivate = updates.isPrivate;
    if (updates.canBeEmpty !== undefined) updateData.canBeEmpty = updates.canBeEmpty;
    if (updates.emptyFieldText !== undefined) updateData.emptyFieldText = updates.emptyFieldText;

    const response = await this.post(endpoint, updateData);
    return ResponseFormatter.formatUpdated(response.data, 'Custom Field', updates, `Custom field ${fieldId} updated successfully`);
  }

  // ==================== SYSTEM CONFIGURATION ====================

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<MCPResponse> {
    const endpoint = '/api/admin/globalSettings';
    const params = {
      fields: 'id,name,value,description,defaultValue,type'
    };

    const response = await this.get(endpoint, params);
    const settings = response.data || [];

    return ResponseFormatter.formatList(settings, 'system setting', {
      totalCount: settings.length
    });
  }

  /**
   * Update system setting
   */
  async updateSystemSetting(settingId: string, value: any): Promise<MCPResponse> {
    const endpoint = `/api/admin/globalSettings/${settingId}`;
    
    const updateData = { value };
    const response = await this.post(endpoint, updateData);
    
    return ResponseFormatter.formatUpdated(response.data, 'System Setting', { value }, `System setting ${settingId} updated successfully`);
  }

  // ==================== BACKUP & MAINTENANCE ====================

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<MCPResponse> {
    const endpoint = '/api/admin/health';
    
    const response = await this.get(endpoint);
    const healthData = response.data || {};

    return ResponseFormatter.formatSuccess({
      ...healthData,
      timestamp: new Date().toISOString()
    }, 'System health status retrieved');
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<MCPResponse> {
    const endpoint = '/api/admin/database/stats';
    
    const response = await this.get(endpoint);
    const stats = response.data || {};

    return ResponseFormatter.formatAnalytics(
      stats,
      {
        totalSize: stats.totalSize || 'Unknown',
        tableCount: stats.tables?.length || 0,
        indexCount: stats.indexes?.length || 0
      },
      'Database Statistics'
    );
  }

  /**
   * Trigger system backup
   */
  async triggerBackup(includeAttachments: boolean = true): Promise<MCPResponse> {
    const endpoint = '/api/admin/backup';
    
    const backupData = {
      includeAttachments,
      timestamp: Date.now()
    };

    const response = await this.post(endpoint, backupData);
    return ResponseFormatter.formatSuccess(response.data, 'System backup initiated successfully');
  }

  // ==================== LICENSE & USAGE ====================

  /**
   * Get license information
   */
  async getLicenseInfo(): Promise<MCPResponse> {
    const endpoint = '/api/admin/license';
    
    const response = await this.get(endpoint);
    const license = response.data || {};

    return ResponseFormatter.formatSuccess({
      ...license,
      retrieved: new Date().toISOString()
    }, 'License information retrieved');
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(period: 'day' | 'week' | 'month' = 'month'): Promise<MCPResponse> {
    const endpoint = '/api/admin/telemetry/usage';
    const params = { period };

    const response = await this.get(endpoint, params);
    const usage = response.data || {};

    return ResponseFormatter.formatAnalytics(
      usage,
      {
        period,
        activeUsers: usage.activeUsers || 0,
        totalIssues: usage.totalIssues || 0,
        totalProjects: usage.totalProjects || 0
      },
      'Usage Statistics'
    );
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get time tracking report
   */
  async getTimeTrackingReport(
    startDate?: string, 
    endDate?: string, 
    groupBy: string = 'user',
    projectId?: string, 
    userId?: string
  ): Promise<MCPResponse> {
    const endpoint = '/api/reports/timeTracking';
    const params: any = { groupBy };
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (projectId) params.project = projectId;
    if (userId) params.author = userId;

    try {
      const response = await this.axios.get(endpoint, { params });
      return ResponseFormatter.formatAnalytics(
        response.data,
        { reportType: 'time_tracking', period: `${startDate} to ${endDate}` },
        'Time Tracking Report'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to generate time tracking report: ${error.message}`, error);
    }
  }

  /**
   * Generate Gantt chart data
   */
  async generateGanttChart(projectId: string): Promise<MCPResponse> {
    try {
      // First get project shortName
      const projectEndpoint = `/api/admin/projects/${projectId}`;
      const projectParams = { fields: 'id,shortName,name' };
      const projectResponse = await this.axios.get(projectEndpoint, { params: projectParams });
      
      if (!projectResponse.data) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const shortName = projectResponse.data.shortName;
      
      const endpoint = `/api/issues`;
      const params: any = {
        query: `project: ${shortName}`,
        fields: 'id,summary,created,resolved,customFields(name,value)',
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      const issues = response.data || [];

      // Process issues into Gantt chart format
      const ganttData = issues.map((issue: any) => ({
        id: issue.id,
        name: issue.summary,
        start: issue.created,
        end: issue.resolved || new Date().toISOString(),
        duration: issue.resolved ? 
          new Date(issue.resolved).getTime() - new Date(issue.created).getTime() : 
          Date.now() - new Date(issue.created).getTime(),
        status: issue.resolved ? 'completed' : 'in-progress'
      }));

      return ResponseFormatter.formatAnalytics(
        ganttData,
        { 
          reportType: 'gantt',
          projectId,
          totalTasks: ganttData.length,
          completedTasks: ganttData.filter((task: any) => task.status === 'completed').length
        },
        'Gantt Chart Data'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to generate Gantt chart: ${error.message}`, error);
    }
  }

  /**
   * Get critical path analysis
   */
  async getCriticalPath(projectId: string): Promise<MCPResponse> {
    try {
      // First get project shortName
      const projectEndpoint = `/api/admin/projects/${projectId}`;
      const projectParams = { fields: 'id,shortName,name' };
      const projectResponse = await this.axios.get(projectEndpoint, { params: projectParams });
      
      if (!projectResponse.data) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const shortName = projectResponse.data.shortName;
      
      // Simplified critical path - would need dependency information for full implementation
      const endpoint = `/api/issues`;
      const params = {
        query: `project: ${shortName} -state: Resolved`,
        fields: 'id,summary,priority,created,customFields(name,value)',
        $top: 100
      };

      const response = await this.axios.get(endpoint, { params });
      const issues = response.data || [];

      // Simple critical path based on priority and age
      const criticalPath = issues
        .map((issue: any) => ({
          id: issue.id,
          summary: issue.summary,
          priority: issue.priority?.name || 'Normal',
          age: Math.floor((Date.now() - new Date(issue.created).getTime()) / (1000 * 60 * 60 * 24)),
          criticality: this.calculateCriticality(issue)
        }))
        .sort((a: any, b: any) => b.criticality - a.criticality)
        .slice(0, 20);

      return ResponseFormatter.formatAnalytics(
        criticalPath,
        { reportType: 'critical_path', projectId, issueCount: criticalPath.length },
        'Critical Path Analysis'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to analyze critical path: ${error.message}`, error);
    }
  }

  /**
   * Get resource allocation report
   */
  async getResourceAllocation(projectId: string): Promise<MCPResponse> {
    try {
      // First get project shortName
      const projectEndpoint = `/api/admin/projects/${projectId}`;
      const projectParams = { fields: 'id,shortName,name' };
      const projectResponse = await this.axios.get(projectEndpoint, { params: projectParams });
      
      if (!projectResponse.data) {
        throw new Error(`Project ${projectId} not found`);
      }
      
      const shortName = projectResponse.data.shortName;
      
      const endpoint = `/api/issues`;
      const params: any = {
        query: `project: ${shortName}`,
        fields: 'id,summary,assignee,customFields(name,value)',
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      const issues = response.data || [];

      // Group by assignee
      const allocation: any = {};
      issues.forEach((issue: any) => {
        const assignee = issue.assignee?.login || 'Unassigned';
        if (!allocation[assignee]) {
          allocation[assignee] = {
            assignee,
            totalIssues: 0,
            openIssues: 0,
            resolvedIssues: 0,
            workload: 0
          };
        }
        allocation[assignee].totalIssues++;
        // Add more detailed analysis based on issue state and time tracking
      });

      return ResponseFormatter.formatAnalytics(
        Object.values(allocation),
        { reportType: 'resource_allocation', projectId },
        'Resource Allocation Report'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to generate resource allocation report: ${error.message}`, error);
    }
  }

  /**
   * Get milestone progress
   */
  async getMilestoneProgress(milestoneId: string): Promise<MCPResponse> {
    // Implementation would depend on how milestones are defined in YouTrack
    try {
      return ResponseFormatter.formatAnalytics(
        { milestoneId, progress: 'Not implemented - requires milestone configuration' },
        { reportType: 'milestone_progress' },
        'Milestone Progress (Placeholder)'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get milestone progress: ${error.message}`, error);
    }
  }

  /**
   * Bulk update issues
   */
  async bulkUpdateIssues(issueIds: string[], updates: any): Promise<MCPResponse> {
    if (!issueIds || issueIds.length === 0) {
      return ResponseFormatter.formatError('No issue IDs provided for bulk update');
    }

    const results: any[] = [];
  const errors: any[] = [];

    for (const issueId of issueIds) {
      try {
        const endpoint = `/api/issues/${issueId}`;
        await this.axios.post(endpoint, updates);
        results.push({ issueId, status: 'updated' });
      } catch (error: any) {
        errors.push({ issueId, error: error.message });
      }
    }

    return ResponseFormatter.formatSuccess({
      updated: results,
      errors,
      summary: {
        total: issueIds.length,
        successful: results.length,
        failed: errors.length
      }
    }, `Bulk update completed: ${results.length}/${issueIds.length} issues updated`);
  }

  /**
   * Create issue dependency
   */
  async createIssueDependency(sourceIssueId: string, targetIssueId: string): Promise<MCPResponse> {
    const endpoint = `/api/issues/${sourceIssueId}/links`;
    const linkData = {
      issues: [{ id: targetIssueId }],
      linkType: { name: 'depends' }
    };

    try {
      const response = await this.axios.post(endpoint, linkData);
      return ResponseFormatter.formatSuccess(response.data, 
        `Created dependency: ${sourceIssueId} depends on ${targetIssueId}`);
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to create issue dependency: ${error.message}`, error);
    }
  }

  /**
   * Calculate issue criticality score (helper method)
   */
  private calculateCriticality(issue: any): number {
    let score = 0;
    
    // Priority weighting
    const priority = issue.priority?.name?.toLowerCase() || 'normal';
    if (priority.includes('critical')) score += 100;
    else if (priority.includes('high')) score += 75;
    else if (priority.includes('major')) score += 50;
    else if (priority.includes('medium') || priority.includes('normal')) score += 25;
    
    // Age weighting (older issues get higher scores)
    const age = Math.floor((Date.now() - new Date(issue.created).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.min(age, 365) / 10; // Cap at 1 year
    
    return score;
  }
}
