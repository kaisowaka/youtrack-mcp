import { AxiosInstance } from 'axios';
import { logger } from './logger.js';
import { SimpleCache } from './cache.js';

export interface CustomFieldValue {
  id: string;
  $type?: string;
  name: string;
  value?: any;
}

export interface BundleValue {
  id: string;
  name: string;
  description?: string;
}

export interface CustomFieldDefinition {
  field: {
    id: string;
    name: string;
    fieldType: {
      id: string;
      valueType: string;
    };
  };
  bundle?: {
    id: string;
    values?: BundleValue[];
  };
  canBeEmpty: boolean;
  defaultValues?: CustomFieldValue[];
}

export class CustomFieldsManager {
  private cache: SimpleCache;
  private api: AxiosInstance;
  private customFieldsCache: Map<string, CustomFieldDefinition[]> = new Map();

  constructor(api: AxiosInstance, cache: SimpleCache) {
    this.api = api;
    this.cache = cache;
  }

  /**
   * Get project custom fields with caching
   */
  async getProjectCustomFields(projectId: string): Promise<CustomFieldDefinition[]> {
    const cacheKey = `custom-fields-${projectId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Array.isArray(cached)) {
      const customFields = cached as CustomFieldDefinition[];
      this.customFieldsCache.set(projectId, customFields);
      return customFields;
    }

    try {
      // Try the admin endpoint first
      let response;
      try {
        response = await this.api.get(`/admin/projects/${projectId}/customFields`, {
          params: {
            fields: 'field(id,name,fieldType(id,valueType)),bundle(id,values(id,name,description)),canBeEmpty,defaultValues(id,name)'
          }
        });
      } catch (adminError) {
        // If admin endpoint fails, try the projects endpoint
        logger.warn(`Admin endpoint failed for project ${projectId}, trying projects endpoint`);
        try {
          response = await this.api.get(`/projects/${projectId}/customFields`, {
            params: {
              fields: 'field(id,name,fieldType(id,valueType)),bundle(id,values(id,name,description)),canBeEmpty,defaultValues(id,name)'
            }
          });
        } catch (projectError) {
          // If both fail, try to get project info to validate it exists
          logger.warn(`Both custom field endpoints failed for project ${projectId}, checking if project exists`);
          try {
            await this.api.get(`/projects/${projectId}`, {
              params: { fields: 'id,name,shortName' }
            });
            logger.info(`Project ${projectId} exists but has no accessible custom fields`);
            return [];
          } catch (projectCheckError) {
            throw new Error(`Project '${projectId}' not found or not accessible. Please verify the project ID/shortName.`);
          }
        }
      }

      const customFields = response.data as CustomFieldDefinition[];
      
      // Cache the results
      this.cache.set(cacheKey, customFields);
      this.customFieldsCache.set(projectId, customFields);
      
      logger.debug(`Loaded ${customFields.length} custom fields for project ${projectId}`);
      return customFields;

    } catch (error) {
      logger.error(`Failed to get custom fields for project ${projectId}:`, error);
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  }

  /**
   * Convert field name and value to YouTrack custom field format
   */
  async convertToCustomFields(projectId: string, fieldMappings: Record<string, any>): Promise<CustomFieldValue[]> {
    const customFields: CustomFieldValue[] = [];
    
    // Ensure we have the project fields loaded
    const projectFields = await this.getProjectCustomFields(projectId);

    for (const [fieldName, value] of Object.entries(fieldMappings)) {
      if (value === undefined || value === null) continue;

      // Find the custom field definition
      const fieldDef = projectFields.find((f: CustomFieldDefinition) => 
        f.field.name.toLowerCase() === fieldName.toLowerCase() ||
        f.field.name.toLowerCase().includes(fieldName.toLowerCase())
      );

      if (!fieldDef) {
        logger.warn(`Custom field not found for: ${fieldName}`, { 
          projectId, 
          availableFields: projectFields.map((f: CustomFieldDefinition) => f.field.name) 
        });
        continue;
      }

      // Convert based on field type
      const fieldType = fieldDef.field.fieldType?.valueType || '';
      logger.debug(`Converting field ${fieldName} of type ${fieldType} with value:`, value);

      try {
        let customFieldValue: CustomFieldValue;

        // Handle different field types
        if (fieldType.includes('enum') || fieldType === 'enum[1]' || fieldType === 'enum[*]') {
          // Enum field - find the matching bundle value
          const bundleValue = fieldDef.bundle?.values?.find((v: BundleValue) => 
            v.name.toLowerCase() === value.toString().toLowerCase()
          );
          
          if (!bundleValue) {
            logger.warn(`Bundle value not found for ${fieldName}:`, { 
              value, 
              availableValues: fieldDef.bundle?.values?.map((v: BundleValue) => v.name) 
            });
            continue;
          }

          customFieldValue = {
            id: fieldDef.field.id,
            $type: 'SingleEnumIssueCustomField',
            name: fieldDef.field.name,
            value: {
              $type: 'EnumBundleElement',
              id: bundleValue.id,
              name: bundleValue.name
            }
          };
        } else if (fieldType.includes('state') || fieldType === 'state[1]') {
          // State field
          const stateValue = fieldDef.bundle?.values?.find((v: BundleValue) => 
            v.name.toLowerCase() === value.toString().toLowerCase()
          );
          
          if (!stateValue) {
            logger.warn(`State value not found for ${fieldName}:`, { 
              value, 
              availableValues: fieldDef.bundle?.values?.map((v: BundleValue) => v.name) 
            });
            continue;
          }

          customFieldValue = {
            id: fieldDef.field.id,
            $type: 'StateIssueCustomField',
            name: fieldDef.field.name,
            value: {
              $type: 'StateBundleElement',
              id: stateValue.id,
              name: stateValue.name
            }
          };
        } else if (fieldType.includes('user') || fieldType === 'user[1]' || fieldName.toLowerCase() === 'assignee') {
          // User field (like assignee)
          customFieldValue = {
            id: fieldDef.field.id,
            $type: 'SingleUserIssueCustomField',
            name: fieldDef.field.name,
            value: typeof value === 'string' ? {
              $type: 'User',
              login: value
            } : value
          };
        } else {
          // Default to simple field
          customFieldValue = {
            id: fieldDef.field.id,
            $type: 'SimpleIssueCustomField',
            name: fieldDef.field.name,
            value: value.toString()
          };
        }

        customFields.push(customFieldValue);
        logger.debug(`Successfully converted field ${fieldName}:`, customFieldValue);

      } catch (error) {
        logger.error(`Error converting field ${fieldName}:`, error);
      }
    }

    return customFields;
  }

  /**
   * Validate custom fields for an issue
   */
  async validateCustomFields(projectId: string, customFields: CustomFieldValue[]): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const projectFields = await this.getProjectCustomFields(projectId);

    for (const field of customFields) {
      const fieldDef = projectFields.find((f: CustomFieldDefinition) => f.field.name === field.name);
      
      if (!fieldDef) {
        errors.push(`Unknown custom field: ${field.name}`);
        continue;
      }

      // Check if field can be empty
      if (!fieldDef.canBeEmpty && (field.value === null || field.value === undefined || field.value === '')) {
        errors.push(`Field ${field.name} cannot be empty`);
      }

      // Additional validation can be added here
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
