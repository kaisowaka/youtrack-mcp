/**
 * Custom Fields API Client
 * Handles custom field management and configuration
 */

import { BaseAPIClient, MCPResponse } from '../base/base-client.js';
import { ResponseFormatter } from '../base/response-formatter.js';

export interface CustomFieldCreateParams {
  name: string;
  fieldType: string;
  isPublic?: boolean;
  ordinal?: number;
}

export interface BundleCreateParams {
  name: string;
  values?: Array<{ name: string; description?: string }>;
}

/**
 * Custom Fields API Client - Handles custom field operations
 */
export class CustomFieldsAPIClient extends BaseAPIClient {

  // ==================== CUSTOM FIELD OPERATIONS ====================

  /**
   * List all custom fields
   */
  async listCustomFields(fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = '/admin/customFieldSettings/customFields';
      const params = {
        fields: fields || 'id,name,fieldType(id,presentation),ordinal,isPublic,hasRunningJob,isUpdateable,instances(project(id,name,shortName))',
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} custom fields`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to list custom fields: ${error.message}`, error);
    }
  }

  /**
   * Get custom field by ID
   */
  async getCustomField(fieldId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/customFieldSettings/customFields/${fieldId}`;
      const params = {
        fields: fields || 'id,name,fieldType(id,presentation),ordinal,isPublic,hasRunningJob,isUpdateable,instances(project(id,name,shortName))'
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved custom field ${fieldId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get custom field: ${error.message}`, error);
    }
  }

  /**
   * Create a new custom field
   */
  async createCustomField(params: CustomFieldCreateParams): Promise<MCPResponse> {
    try {
      const endpoint = '/admin/customFieldSettings/customFields';
      const data = {
        name: params.name,
        fieldType: { id: params.fieldType },
        isPublic: params.isPublic ?? true,
        ordinal: params.ordinal
      };

      const response = await this.axios.post(endpoint, data, {
        params: {
          fields: 'id,name,fieldType(id,presentation),ordinal,isPublic'
        }
      });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Created custom field: ${params.name}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to create custom field: ${error.message}`, error);
    }
  }

  /**
   * Update custom field
   */
  async updateCustomField(fieldId: string, updates: Partial<CustomFieldCreateParams>): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/customFieldSettings/customFields/${fieldId}`;
      const data: any = {};

      if (updates.name) data.name = updates.name;
      if (updates.isPublic !== undefined) data.isPublic = updates.isPublic;
      if (updates.ordinal !== undefined) data.ordinal = updates.ordinal;

      const response = await this.axios.post(endpoint, data, {
        params: {
          fields: 'id,name,fieldType(id,presentation),ordinal,isPublic'
        }
      });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Updated custom field ${fieldId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to update custom field: ${error.message}`, error);
    }
  }

  /**
   * Delete custom field
   */
  async deleteCustomField(fieldId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/customFieldSettings/customFields/${fieldId}`;

      await this.axios.delete(endpoint);
      
      return ResponseFormatter.formatSuccess(
        { fieldId },
        `Deleted custom field ${fieldId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to delete custom field: ${error.message}`, error);
    }
  }

  // ==================== FIELD TYPE OPERATIONS ====================

  /**
   * List all available field types
   */
  async listFieldTypes(fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = '/admin/customFieldSettings/types';
      const params = {
        fields: fields || 'id,presentation,isMultiValue,isBundleType',
        $top: 100
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} field types`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to list field types: ${error.message}`, error);
    }
  }

  // ==================== BUNDLE OPERATIONS ====================

  /**
   * List all enum bundles
   */
  async listEnumBundles(fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = '/admin/customFieldSettings/bundles/enum';
      const params = {
        fields: fields || 'id,name,values(id,name,description,ordinal,archived)',
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} enum bundles`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to list enum bundles: ${error.message}`, error);
    }
  }

  /**
   * Get enum bundle by ID
   */
  async getEnumBundle(bundleId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/customFieldSettings/bundles/enum/${bundleId}`;
      const params = {
        fields: fields || 'id,name,values(id,name,description,ordinal,archived)'
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved enum bundle ${bundleId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get enum bundle: ${error.message}`, error);
    }
  }

  /**
   * Create a new enum bundle
   */
  async createEnumBundle(params: BundleCreateParams): Promise<MCPResponse> {
    try {
      const endpoint = '/admin/customFieldSettings/bundles/enum';
      const data: any = {
        name: params.name
      };

      if (params.values && params.values.length > 0) {
        data.values = params.values.map((v, index) => ({
          name: v.name,
          description: v.description,
          ordinal: index
        }));
      }

      const response = await this.axios.post(endpoint, data, {
        params: {
          fields: 'id,name,values(id,name,description,ordinal)'
        }
      });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Created enum bundle: ${params.name}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to create enum bundle: ${error.message}`, error);
    }
  }

  /**
   * Add value to enum bundle
   */
  async addEnumBundleValue(bundleId: string, name: string, description?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/customFieldSettings/bundles/enum/${bundleId}/values`;
      const data = {
        name,
        description
      };

      const response = await this.axios.post(endpoint, data, {
        params: {
          fields: 'id,name,description,ordinal,archived'
        }
      });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Added value "${name}" to bundle ${bundleId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to add bundle value: ${error.message}`, error);
    }
  }

  // ==================== PROJECT CUSTOM FIELD OPERATIONS ====================

  /**
   * Get project custom fields
   */
  async getProjectCustomFields(projectId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/projects/${projectId}/customFields`;
      const params = {
        fields: fields || 'field(id,name,fieldType(id,presentation)),canBeEmpty,emptyFieldText,ordinal,isPublic',
        $top: 1000
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} project custom fields`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get project custom fields: ${error.message}`, error);
    }
  }

  /**
   * Add custom field to project
   */
  async addCustomFieldToProject(
    projectId: string, 
    fieldId: string, 
    options?: { canBeEmpty?: boolean; emptyFieldText?: string }
  ): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/projects/${projectId}/customFields`;
      const data: any = {
        field: { id: fieldId }
      };

      if (options?.canBeEmpty !== undefined) data.canBeEmpty = options.canBeEmpty;
      if (options?.emptyFieldText) data.emptyFieldText = options.emptyFieldText;

      const response = await this.axios.post(endpoint, data, {
        params: {
          fields: 'field(id,name,fieldType(id,presentation)),canBeEmpty,emptyFieldText,ordinal'
        }
      });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Added custom field ${fieldId} to project ${projectId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to add custom field to project: ${error.message}`, error);
    }
  }

  /**
   * Remove custom field from project
   */
  async removeCustomFieldFromProject(projectId: string, fieldId: string): Promise<MCPResponse> {
    try {
      const endpoint = `/admin/projects/${projectId}/customFields/${fieldId}`;

      await this.axios.delete(endpoint);
      
      return ResponseFormatter.formatSuccess(
        { projectId, fieldId },
        `Removed custom field ${fieldId} from project ${projectId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to remove custom field from project: ${error.message}`, error);
    }
  }

  // ==================== ISSUE CUSTOM FIELD OPERATIONS ====================

  /**
   * Get issue custom fields
   */
  async getIssueCustomFields(issueId: string, fields?: string): Promise<MCPResponse> {
    try {
      const endpoint = `/issues/${issueId}/customFields`;
      const params = {
        fields: fields || 'id,name,value(id,name,presentation,$type),projectCustomField(field(name,fieldType(presentation)))',
        $top: 100
      };

      const response = await this.axios.get(endpoint, { params });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Retrieved ${response.data?.length || 0} custom fields for issue ${issueId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to get issue custom fields: ${error.message}`, error);
    }
  }

  /**
   * Update issue custom field value
   */
  async updateIssueCustomFieldValue(issueId: string, fieldId: string, value: any): Promise<MCPResponse> {
    try {
      const endpoint = `/issues/${issueId}/customFields/${fieldId}`;
      const data = { value };

      const response = await this.axios.post(endpoint, data, {
        params: {
          fields: 'id,name,value(id,name,presentation,$type)'
        }
      });
      
      return ResponseFormatter.formatSuccess(
        response.data,
        `Updated custom field ${fieldId} for issue ${issueId}`
      );
    } catch (error: any) {
      return ResponseFormatter.formatError(`Failed to update issue custom field: ${error.message}`, error);
    }
  }
}
