import { AxiosInstance } from 'axios';
import { logger } from './logger.js';
import { SimpleCache } from './cache.js';

export interface CustomFieldValue {
  $type?: string;
  name: string;
  id?: string;
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
      const response = await this.api.get(`/admin/projects/${projectId}/customFields`, {
        params: {
          fields: 'field(id,name,fieldType(id,valueType)),bundle(id,values(id,name,description)),canBeEmpty,defaultValues(id,name)'
        }
      });

      const customFields = response.data as CustomFieldDefinition[];
      
      // Cache the results
      this.cache.set(cacheKey, customFields);
      this.customFieldsCache.set(projectId, customFields);
      
      logger.debug(`Loaded ${customFields.length} custom fields for project ${projectId}`);
      return customFields;

    } catch (error) {
      logger.error(`Failed to get custom fields for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Convert field name and value to YouTrack custom field format
   */
  convertToCustomFields(projectId: string, fieldMappings: Record<string, any>): CustomFieldValue[] {
    const customFields: CustomFieldValue[] = [];
    const projectFields = this.customFieldsCache.get(projectId) || [];

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
            $type: 'StateMachineIssueCustomField',
            name: fieldDef.field.name,
            value: {
              $type: 'StateBundleElement',
              id: stateValue.id,
              name: stateValue.name
            }
          };
        } else {
          // Default to simple field
          customFieldValue = {
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
