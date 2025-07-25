/**
 * Dynamic Project Field Manager
 * Automatically discovers and caches project-specific custom fields
 */

import { AxiosInstance } from 'axios';
import { logger } from './logger.js';
import { SimpleCache } from './cache.js';

export interface ProjectCustomFieldDefinition {
  field: {
    id: string;
    name: string;
    localizedName?: string;
    fieldType: {
      id: string;
      valueType: string;
      localizedName?: string;
    };
  };
  bundle?: {
    id: string;
    isUpdateable?: boolean;
    values?: Array<{
      id: string;
      name: string;
      description?: string;
      ordinal?: number;
      color?: {
        id: string;
        background: string;
        foreground: string;
      };
    }>;
  };
  canBeEmpty: boolean;
  emptyFieldText?: string;
  isPublic?: boolean;
  hasRunningJob?: boolean;
  defaultValues?: Array<{
    id: string;
    name: string;
    presentation?: string;
  }>;
}

export interface ProjectFieldsInfo {
  projectId: string;
  projectName: string;
  projectShortName: string;
  fields: ProjectCustomFieldDefinition[];
  fieldsByName: Map<string, ProjectCustomFieldDefinition>;
  fieldsByType: Map<string, ProjectCustomFieldDefinition[]>;
  lastUpdated: number;
}

export class ProjectFieldManager {
  private cache: SimpleCache;
  private api: AxiosInstance;
  private projectFieldsCache: Map<string, ProjectFieldsInfo> = new Map();
  private fieldDiscoveryInProgress: Map<string, Promise<ProjectFieldsInfo>> = new Map();

  constructor(api: AxiosInstance, cache: SimpleCache) {
    this.api = api;
    this.cache = cache;
  }

  /**
   * Dynamically discover all custom fields for a project
   */
  async discoverProjectFields(projectId: string): Promise<ProjectFieldsInfo> {
    // Check if discovery is already in progress for this project
    const inProgress = this.fieldDiscoveryInProgress.get(projectId);
    if (inProgress) {
      return inProgress;
    }

    // Check cache first
    const cached = this.projectFieldsCache.get(projectId);
    if (cached && (Date.now() - cached.lastUpdated) < 300000) { // 5 minutes
      return cached;
    }

    // Start discovery process
    const discoveryPromise = this._performFieldDiscovery(projectId);
    this.fieldDiscoveryInProgress.set(projectId, discoveryPromise);

    try {
      const result = await discoveryPromise;
      this.fieldDiscoveryInProgress.delete(projectId);
      return result;
    } catch (error) {
      this.fieldDiscoveryInProgress.delete(projectId);
      throw error;
    }
  }

  private async _performFieldDiscovery(projectId: string): Promise<ProjectFieldsInfo> {
    try {
      logger.info(`🔍 Discovering custom fields for project: ${projectId}`);

      // Get project info first
      const projectResponse = await this.api.get(`/admin/projects/${projectId}`, {
        params: {
          fields: 'id,name,shortName'
        }
      });
      const project = projectResponse.data;

      // Get all custom fields for the project
      const fieldsResponse = await this.api.get(`/admin/projects/${projectId}/customFields`, {
        params: {
          fields: [
            'field(id,name,localizedName,fieldType(id,valueType,localizedName))',
            'bundle(id,isUpdateable,values(id,name,description,ordinal,color(id,background,foreground)))',
            'canBeEmpty',
            'emptyFieldText',
            'isPublic',
            'hasRunningJob',
            'defaultValues(id,name,presentation)'
          ].join(',')
        }
      });

      const fields = fieldsResponse.data as ProjectCustomFieldDefinition[];

      // Create field lookup maps
      const fieldsByName = new Map<string, ProjectCustomFieldDefinition>();
      const fieldsByType = new Map<string, ProjectCustomFieldDefinition[]>();

      fields.forEach(field => {
        // Index by name (case-insensitive)
        fieldsByName.set(field.field.name.toLowerCase(), field);
        
        // Index by field type
        const fieldType = field.field.fieldType.valueType;
        if (!fieldsByType.has(fieldType)) {
          fieldsByType.set(fieldType, []);
        }
        fieldsByType.get(fieldType)!.push(field);
      });

      const projectFieldsInfo: ProjectFieldsInfo = {
        projectId,
        projectName: project.name,
        projectShortName: project.shortName,
        fields,
        fieldsByName,
        fieldsByType,
        lastUpdated: Date.now()
      };

      // Cache the results
      this.projectFieldsCache.set(projectId, projectFieldsInfo);
      
      logger.info(`✅ Discovered ${fields.length} custom fields for project ${project.shortName}:`, {
        fields: fields.map(f => `${f.field.name} (${f.field.fieldType.valueType})`),
        fieldTypes: Array.from(fieldsByType.keys())
      });

      return projectFieldsInfo;

    } catch (error) {
      logger.error(`❌ Failed to discover fields for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get field definition by name for a specific project
   */
  async getFieldByName(projectId: string, fieldName: string): Promise<ProjectCustomFieldDefinition | null> {
    const projectFields = await this.discoverProjectFields(projectId);
    return projectFields.fieldsByName.get(fieldName.toLowerCase()) || null;
  }

  /**
   * Get all fields of a specific type for a project
   */
  async getFieldsByType(projectId: string, fieldType: string): Promise<ProjectCustomFieldDefinition[]> {
    const projectFields = await this.discoverProjectFields(projectId);
    return projectFields.fieldsByType.get(fieldType) || [];
  }

  /**
   * Get available values for an enum/bundle field
   */
  async getFieldValues(projectId: string, fieldName: string): Promise<Array<{id: string, name: string}>> {
    const field = await this.getFieldByName(projectId, fieldName);
    if (!field || !field.bundle?.values) {
      return [];
    }
    return field.bundle.values.map(v => ({ id: v.id, name: v.name }));
  }

  /**
   * Get field schema for dynamic form generation
   */
  async getProjectFieldSchema(projectId: string): Promise<{
    required: ProjectCustomFieldDefinition[];
    optional: ProjectCustomFieldDefinition[];
    byCategory: Record<string, ProjectCustomFieldDefinition[]>;
  }> {
    const projectFields = await this.discoverProjectFields(projectId);
    
    const required = projectFields.fields.filter(f => !f.canBeEmpty);
    const optional = projectFields.fields.filter(f => f.canBeEmpty);
    
    // Group by common categories
    const byCategory: Record<string, ProjectCustomFieldDefinition[]> = {
      workflow: [],
      assignment: [],
      planning: [],
      tracking: [],
      versioning: [],
      other: []
    };

    projectFields.fields.forEach(field => {
      const name = field.field.name.toLowerCase();
      if (name.includes('state') || name.includes('status') || name.includes('priority')) {
        byCategory.workflow.push(field);
      } else if (name.includes('assignee') || name.includes('reporter')) {
        byCategory.assignment.push(field);
      } else if (name.includes('sprint') || name.includes('iteration') || name.includes('story') || name.includes('estimation')) {
        byCategory.planning.push(field);
      } else if (name.includes('time') || name.includes('spent') || name.includes('estimation')) {
        byCategory.tracking.push(field);
      } else if (name.includes('version') || name.includes('build') || name.includes('fix')) {
        byCategory.versioning.push(field);
      } else {
        byCategory.other.push(field);
      }
    });

    return { required, optional, byCategory };
  }

  /**
   * Compare field configurations between projects
   */
  async compareProjectFields(projectId1: string, projectId2: string): Promise<{
    common: string[];
    onlyInProject1: string[];
    onlyInProject2: string[];
    different: Array<{
      fieldName: string;
      project1Type: string;
      project2Type: string;
    }>;
  }> {
    const [fields1, fields2] = await Promise.all([
      this.discoverProjectFields(projectId1),
      this.discoverProjectFields(projectId2)
    ]);

    const names1 = new Set(fields1.fields.map(f => f.field.name));
    const names2 = new Set(fields2.fields.map(f => f.field.name));

    const common = Array.from(names1).filter(name => names2.has(name));
    const onlyInProject1 = Array.from(names1).filter(name => !names2.has(name));
    const onlyInProject2 = Array.from(names2).filter(name => !names1.has(name));

    const different: Array<{fieldName: string, project1Type: string, project2Type: string}> = [];
    common.forEach(fieldName => {
      const field1 = fields1.fieldsByName.get(fieldName.toLowerCase());
      const field2 = fields2.fieldsByName.get(fieldName.toLowerCase());
      
      if (field1 && field2 && field1.field.fieldType.valueType !== field2.field.fieldType.valueType) {
        different.push({
          fieldName,
          project1Type: field1.field.fieldType.valueType,
          project2Type: field2.field.fieldType.valueType
        });
      }
    });

    return { common, onlyInProject1, onlyInProject2, different };
  }

  /**
   * Get all discovered projects and their field counts
   */
  getProjectFieldsSummary(): Array<{
    projectId: string;
    projectName: string;
    projectShortName: string;
    fieldCount: number;
    lastUpdated: string;
  }> {
    return Array.from(this.projectFieldsCache.values()).map(info => ({
      projectId: info.projectId,
      projectName: info.projectName,
      projectShortName: info.projectShortName,
      fieldCount: info.fields.length,
      lastUpdated: new Date(info.lastUpdated).toISOString()
    }));
  }

  /**
   * Clear cache for a specific project (force refresh)
   */
  clearProjectCache(projectId: string): void {
    this.projectFieldsCache.delete(projectId);
    logger.info(`🗑️ Cleared field cache for project: ${projectId}`);
  }

  /**
   * Clear all cached project fields
   */
  clearAllCache(): void {
    this.projectFieldsCache.clear();
    logger.info('🗑️ Cleared all project field caches');
  }
}
