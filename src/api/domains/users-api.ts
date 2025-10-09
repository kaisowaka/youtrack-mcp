/**
 * Users API Client
 * Handles user and group management operations
 */

import { BaseAPIClient, MCPResponse } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';
import { FieldSelector } from '../../utils/field-selector.js';

export interface UserCreateParams {
  login: string;
  fullName: string;
  email: string;
  password?: string;
  banned?: boolean;
}

export interface GroupCreateParams {
  name: string;
  description?: string;
  autoJoin?: boolean;
}

/**
 * Users API Client - Handles user and group operations
 */
export class UsersAPIClient extends BaseAPIClient {

  // ==================== USER OPERATIONS ====================

  /**
   * List all users with optional filtering
   */
  async listUsers(query?: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = '/users';
      const params: any = {
        fields: fields || FieldSelector.USER,
        $top: 1000
      };

      if (query) {
        params.query = query;
      }

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} users`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to list users: ${error.message}`, error);
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/users/${userId}`;
      const params = {
        fields: fields || FieldSelector.USER
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved user ${userId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get user: ${error.message}`, error);
    }
  }

  /**
   * Search users by query
   */
  async searchUsers(query: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = '/admin/users';
      const params: any = {
        fields: fields || FieldSelector.USER,
        query,
        $top: 100
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Found ${response.data?.length || 0} users matching query`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to search users: ${error.message}`, error);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = '/users/me';
      const params = {
        fields: fields || FieldSelector.extend(FieldSelector.USER, ['banned', 'online', 'ringId'])
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        'Retrieved current user profile'
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get current user: ${error.message}`, error);
    }
  }

  /**
   * Get user's saved queries
   */
  async getUserSavedQueries(userId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/users/${userId}/savedQueries`;
      const params = {
        fields: 'id,name,query,owner(login,fullName),visibleForGroup(name),visibleForUser(login,fullName)'
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} saved queries`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get saved queries: ${error.message}`, error);
    }
  }

  // ==================== GROUP OPERATIONS ====================

  /**
   * List all groups
   */
  async listGroups(fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = '/groups';
      const params = {
        fields: fields || 'id,name,description,icon,ringId',
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} groups`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to list groups: ${error.message}`, error);
    }
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/groups/${groupId}`;
      const params = {
        fields: fields || 'id,name,description,icon,ringId,autoJoin'
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved group ${groupId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get group: ${error.message}`, error);
    }
  }

  /**
   * Get group members
   */
  async getGroupMembers(groupId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/groups/${groupId}/users`;
      const params = {
        fields: fields || FieldSelector.USER,
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} group members`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get group members: ${error.message}`, error);
    }
  }

  /**
   * Add user to group
   */
  async addUserToGroup(groupId: string, userId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/groups/${groupId}/users`;
      const data = {
        users: [{ id: userId }]
      };

      await this.axios.post(endpoint, data);
      
      return ResponseFormatter.formatSuccess(
        { groupId, userId },
        `Added user ${userId} to group ${groupId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to add user to group: ${error.message}`, error);
    }
  }

  /**
   * Remove user from group
   */
  async removeUserFromGroup(groupId: string, userId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/groups/${groupId}/users/${userId}`;

      await this.axios.delete(endpoint);
      
      return ResponseFormatter.formatSuccess(
        { groupId, userId },
        `Removed user ${userId} from group ${groupId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to remove user from group: ${error.message}`, error);
    }
  }

  // ==================== TEAM OPERATIONS ====================

  /**
   * Get project team members
   */
  async getProjectTeam(projectId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/projects/${projectId}/team`;
      const params = {
        fields: fields || FieldSelector.extend(FieldSelector.USER, ['banned'])
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} team members`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get project team: ${error.message}`, error);
    }
  }

  /**
   * Add user to project team
   */
  async addUserToProjectTeam(projectId: string, userId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/projects/${projectId}/team`;
      const data = {
        users: [{ id: userId }]
      };

      await this.axios.post(endpoint, data);
      
      return ResponseFormatter.formatSuccess(
        { projectId, userId },
        `Added user ${userId} to project ${projectId} team`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to add user to project team: ${error.message}`, error);
    }
  }
}
