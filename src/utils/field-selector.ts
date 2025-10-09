/**
 * Field Selector Utility
 * Optimizes API requests by selecting only required fields
 */

export class FieldSelector {
  // Minimal field set - just ID and type
  static readonly MINIMAL = 'id,$type';

  // Basic fields for list views
  static readonly BASIC = 'id,idReadable,summary,created,updated';

  // Issue detail fields
  static readonly ISSUE_DETAIL = 'id,idReadable,summary,description,created,updated,resolved,reporter(id,login,fullName),assignee(id,login,fullName)';

  // Gantt chart optimized fields
  static readonly GANTT = 'id,idReadable,summary,created,resolved,customFields(id,name,value(presentation,$type))';

  // Project fields
  static readonly PROJECT = 'id,shortName,name,description,archived';

  // User fields
  static readonly USER = 'id,login,fullName,email,avatarUrl';

  // Sprint fields
  static readonly SPRINT = 'id,name,start,finish,archived,goal';

  // Work item fields
  static readonly WORK_ITEM = 'id,date,duration(minutes),type(name),author(login,fullName)';

  // Custom field definition
  static readonly CUSTOM_FIELD = 'id,name,fieldType(id,name),localizedName';

  // Search results (minimal for performance)
  static readonly SEARCH = 'id,idReadable,summary';

  /**
   * Get field selector for specific use case
   */
  static forUseCase(useCase: 'list' | 'detail' | 'gantt' | 'search' | 'minimal'): string {
    switch (useCase) {
      case 'list':
        return this.BASIC;
      case 'detail':
        return this.ISSUE_DETAIL;
      case 'gantt':
        return this.GANTT;
      case 'search':
        return this.SEARCH;
      case 'minimal':
        return this.MINIMAL;
      default:
        return this.BASIC;
    }
  }

  /**
   * Build custom field selector
   */
  static custom(fields: string[]): string {
    return fields.join(',');
  }

  /**
   * Add fields to existing selector
   */
  static extend(base: string, additional: string[]): string {
    return `${base},${additional.join(',')}`;
  }
}
