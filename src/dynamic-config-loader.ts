import { logger } from './logger.js';
import axios, { AxiosInstance } from 'axios';

/**
 * Dynamic configuration loader that fetches custom field values from YouTrack
 * This allows the MCP server to provide accurate examples based on the actual
 * YouTrack instance configuration instead of hardcoded generic values
 */

export interface FieldValue {
  name: string;
  description?: string;
  archived?: boolean;
  ordinal?: number;
}

export interface FieldBundle {
  fieldName: string;
  values: FieldValue[];
}

export interface DynamicConfig {
  states: string[];
  priorities: string[];
  types: string[];
  resolutions: string[];
  projectShortNames: string[];
}

export class DynamicConfigLoader {
  private axios: AxiosInstance;
  private config: DynamicConfig | null = null;

  constructor(baseURL: string, token: string) {
    // Ensure baseURL ends with /api
    let normalizedURL = baseURL;
    if (!normalizedURL.endsWith('/api')) {
      normalizedURL = normalizedURL.replace(/\/$/, '') + '/api';
    }

    this.axios = axios.create({
      baseURL: normalizedURL,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Load dynamic configuration from YouTrack on startup
   */
  async loadConfiguration(): Promise<DynamicConfig> {
    logger.info('Loading dynamic configuration from YouTrack...');

    try {
      const [states, priorities, types, resolutions, projects] = await Promise.all([
        this.fetchFieldValues('State'),
        this.fetchFieldValues('Priority'),
        this.fetchFieldValues('Type'),
        this.fetchFieldValues('Resolution'),
        this.fetchProjects()
      ]);

      this.config = {
        states,
        priorities,
        types,
        resolutions,
        projectShortNames: projects
      };

      logger.info('Dynamic configuration loaded successfully', {
        states: states.length,
        priorities: priorities.length,
        types: types.length,
        resolutions: resolutions.length,
        projects: projects.length
      });

      return this.config;
    } catch (error) {
      logger.warn('Failed to load dynamic configuration, using defaults', error);
      // Return safe defaults if fetching fails
      return this.getDefaultConfig();
    }
  }

  /**
   * Fetch custom field values for a specific field (State, Priority, Type, etc.)
   */
  private async fetchFieldValues(fieldName: string): Promise<string[]> {
    try {
      // First, get the custom field to find its bundle
      const fieldsResponse = await this.axios.get('/admin/customFieldSettings/customFields', {
        params: {
          fields: 'id,name,fieldType(valueType),bundles(id)',
          query: fieldName
        }
      });

      const fields = fieldsResponse.data || [];
      const field = fields.find((f: any) => f.name === fieldName);

      if (!field || !field.bundles || field.bundles.length === 0) {
        logger.warn(`Field ${fieldName} not found or has no bundles`);
        return [];
      }

      // Get the bundle values
      const bundleId = field.bundles[0].id;
      const bundleType = field.fieldType?.valueType || 'enum';
      
      const valuesResponse = await this.axios.get(
        `/admin/customFieldSettings/bundles/${bundleType}/${bundleId}/values`,
        {
          params: {
            fields: 'name,description,archived,ordinal',
            $top: 100
          }
        }
      );

      const values = valuesResponse.data || [];
      
      // Filter out archived values and sort by ordinal
      return values
        .filter((v: any) => !v.archived)
        .sort((a: any, b: any) => (a.ordinal || 0) - (b.ordinal || 0))
        .map((v: any) => v.name);

    } catch (error) {
      logger.warn(`Failed to fetch ${fieldName} values`, error);
      return [];
    }
  }

  /**
   * Fetch list of project short names
   */
  private async fetchProjects(): Promise<string[]> {
    try {
      const response = await this.axios.get('/admin/projects', {
        params: {
          fields: 'shortName,archived',
          $top: 50
        }
      });

      const projects = response.data || [];
      return projects
        .filter((p: any) => !p.archived)
        .map((p: any) => p.shortName);

    } catch (error) {
      logger.warn('Failed to fetch projects', error);
      return [];
    }
  }

  /**
   * Get the loaded configuration
   */
  getConfig(): DynamicConfig {
    return this.config || this.getDefaultConfig();
  }

  /**
   * Get default/fallback configuration
   */
  private getDefaultConfig(): DynamicConfig {
    return {
      states: ['Open', 'In Progress', 'Resolved', 'Closed'],
      priorities: ['Critical', 'High', 'Normal', 'Low'],
      types: ['Bug', 'Feature', 'Task', 'Epic'],
      resolutions: ['Fixed', 'Won\'t fix', 'Duplicate', 'Incomplete'],
      projectShortNames: []
    };
  }

  /**
   * Fetch project-specific field values (e.g., for State, Priority)
   * This gets the actual values available in a specific project's workflow
   */
  async fetchProjectFieldValues(projectId: string, fieldName: string): Promise<string[]> {
    try {
      const response = await this.axios.get(`/admin/projects/${projectId}`, {
        params: {
          fields: `customFields(field(name),bundle(values(name,archived)))`
        }
      });

      const customFields = response.data.customFields || [];
      const field = customFields.find((f: any) => f.field?.name === fieldName);

      if (!field || !field.bundle || !field.bundle.values) {
        logger.warn(`Field ${fieldName} not found in project ${projectId}`);
        return [];
      }

      // Filter out archived values and extract names
      return field.bundle.values
        .filter((v: any) => !v.archived)
        .map((v: any) => v.name);

    } catch (error) {
      logger.warn(`Failed to fetch ${fieldName} values for project ${projectId}`, error);
      return [];
    }
  }

  /**
   * Generate query examples based on loaded configuration
   */
  getQueryExamples(): string {
    const config = this.getConfig();
    const examples: string[] = [];

    // State example
    if (config.states.length > 0) {
      examples.push(`"state: ${config.states[0]}" - All ${config.states[0].toLowerCase()} issues`);
    }

    // Project example (use first project if available, otherwise generic)
    const projectExample = config.projectShortNames.length > 0 
      ? config.projectShortNames[0] 
      : 'PROJECT-1';
    examples.push(`"project: ${projectExample} assignee: me" - My issues in project`);

    // Priority example
    if (config.priorities.length > 0) {
      const highPriority = config.priorities[0]; // Usually Critical or High
      examples.push(`"priority: ${highPriority} created: >2025-01-01" - ${highPriority} priority recent issues`);
    }

    // State exclusion example
    if (config.states.length > 1) {
      const resolvedState = config.states.find(s => s.toLowerCase().includes('resolve')) || config.states[config.states.length - 1];
      examples.push(`"#bug -state: ${resolvedState}" - Open bugs (full-text search)`);
    }

    return examples.join('\n• ');
  }

  /**
   * Get type example string
   */
  getTypeExample(): string {
    const config = this.getConfig();
    if (config.types.length === 0) {
      return 'Bug, Feature, Task, etc.';
    }
    return config.types.join(', ');
  }

  /**
   * Get state example string
   */
  getStateExample(): string {
    const config = this.getConfig();
    if (config.states.length === 0) {
      return 'Open, In Progress, Resolved, etc.';
    }
    return config.states.join(', ');
  }

  /**
   * Get priority example string
   */
  getPriorityExample(): string {
    const config = this.getConfig();
    if (config.priorities.length === 0) {
      return 'Critical, High, Normal, Low';
    }
    return config.priorities.join(', ');
  }
}
