/**
 * YouTrack Field Selection Utility
 * Provides comprehensive field selection for all YouTrack entities
 */

export class FieldSelector {
  /**
   * Get comprehensive field selection for Issues
   * Includes ALL possible Issue properties
   */
  static getCompleteIssueFields(): string {
    return [
      // Core identification
      'id',
      'idReadable', 
      'numberInProject',
      
      // Basic content
      'summary',
      'description',
      'wikifiedDescription',
      
      // Project and ownership
      'project(id,name,shortName,description,leader(login,fullName),archived,template)',
      'reporter(id,login,fullName,email,jabberAccountName,ringId,guest,online,banned,avatarUrl)',
      'updater(id,login,fullName,email,jabberAccountName,ringId,guest,online,banned,avatarUrl)',
      'draftOwner(id,login,fullName,email,jabberAccountName,ringId,guest,online,banned,avatarUrl)',
      
      // Status and workflow
      'isDraft',
      'resolved',
      
      // Custom fields - comprehensive
      'customFields(id,name,value(id,name,login,fullName,minutes,text,presentation,isResolved),projectCustomField(id,field(id,name,localizedName,fieldType(id,valueType,localizedName)),bundle(id,isUpdateable,values(id,name,description,ordinal,color(id,background,foreground)))))',
      
      // Temporal information
      'created',
      'updated',
      
      // Relationships
      'parent(id,direction,linkType(id,name,localizedName,sourceToTarget,targetToSource,directed,aggregation),issues(id,idReadable,summary))',
      'subtasks(id,direction,linkType(id,name,localizedName,sourceToTarget,targetToSource,directed,aggregation),issues(id,idReadable,summary))',
      'links(id,direction,linkType(id,name,localizedName,sourceToTarget,targetToSource,directed,aggregation),issues(id,idReadable,summary,project(shortName)))',
      'externalIssue(id,name,url,key)',
      
      // Social features
      'tags(id,name,query,color(id,background,foreground),untagOnResolve,owner(login,fullName),updateableBy(id,name),visibleFor(id,name))',
      'votes',
      'voters(id,hasVote,original(id,idReadable),duplicate(id,idReadable))',
      'watchers(id,hasStar,issueWatchers(id,login,fullName),duplicateWatchers(id,login,fullName))',
      
      // Comments and communication
      'comments(id,text,textPreview,wikifiedText,created,updated,author(id,login,fullName,avatarUrl),parent(id),replies(id,text,author(login,fullName)),deleted,visibility(permittedGroups(id,name),permittedUsers(id,login,fullName)),attachments(id,name,url,size,mimeType))',
      'commentsCount',
      'pinnedComments(id,text,textPreview,wikifiedText,created,updated,author(id,login,fullName,avatarUrl),deleted)',
      
      // Attachments
      'attachments(id,name,url,size,extension,charset,mimeType,metaData,created,updated,author(id,login,fullName),comment(id),visibility(permittedGroups(id,name),permittedUsers(id,login,fullName)),removed,thumbnailURL)',
      
      // Visibility and permissions
      'visibility(permittedGroups(id,name,ringId,usersCount,icon),permittedUsers(id,login,fullName,email,ringId))'
      
    ].join(',');
  }

  /**
   * Get essential Issue fields for list views
   */
  static getEssentialIssueFields(): string {
    return [
      'id',
      'idReadable',
      'summary',
      'description',
      'project(id,name,shortName)',
      'reporter(login,fullName)',
      'created',
      'updated',
      'customFields(name,value(name,presentation))',
      'tags(name,color(background,foreground))',
      'commentsCount',
      'votes'
    ].join(',');
  }

  /**
   * Get comprehensive field selection for Projects
   */
  static getCompleteProjectFields(): string {
    return [
      'id',
      'name', 
      'shortName',
      'description',
      'leader(id,login,fullName,email)',
      'createdBy(id,login,fullName)',
      'archived',
      'template',
      'fromEmail',
      'replyToEmail',
      'team(id,name,users(id,login,fullName))',
      'issues(id,idReadable,summary)',
      'customFields(id,field(id,name,fieldType(valueType)),bundle(id,values(id,name)),canBeEmpty,emptyFieldText,isPublic,hasRunningJob)',
      'issueNumberSequence(id,next)',
      'saved',
      'securityLevel(id)',
      'plugins(id,enabled,settings)',
      'timeTrackingSettings(enabled,timeSpent(field(name),prototype(id,name)))'
    ].join(',');
  }

  /**
   * Get comprehensive field selection for Users
   */
  static getCompleteUserFields(): string {
    return [
      'id',
      'login',
      'fullName',
      'email',
      'jabberAccountName',
      'ringId',
      'guest',
      'online',
      'banned',
      'avatarUrl',
      'tags(id,name,color(background,foreground))',
      'savedQueries(id,name,query,owner(login))',
      'profiles(general(id,locale(language,country)),timeTracking(timeFormat),notifications(autoWatch,jabberNotificationsEnabled,emailNotificationsEnabled))',
      'groups(id,name,ringId)',
      'permissions(permission(key),projects(id,shortName))'
    ].join(',');
  }

  /**
   * Get comprehensive field selection for Comments
   */
  static getCompleteCommentFields(): string {
    return [
      'id',
      'text',
      'textPreview', 
      'wikifiedText',
      'created',
      'updated',
      'author(id,login,fullName,avatarUrl)',
      'issue(id,idReadable,summary)',
      'parent(id,text,author(login,fullName))',
      'replies(id,text,textPreview,author(login,fullName),created)',
      'deleted',
      'visibility(permittedGroups(id,name),permittedUsers(id,login,fullName))',
      'attachments(id,name,url,size,mimeType,created,author(login,fullName))'
    ].join(',');
  }

  /**
   * Get comprehensive field selection for Custom Fields
   */
  static getCompleteCustomFieldFields(): string {
    return [
      'id',
      'field(id,name,localizedName,fieldType(id,valueType,localizedName),instances(id,project(shortName)))',
      'bundle(id,isUpdateable,values(id,name,description,ordinal,color(id,background,foreground),localizedName))',
      'canBeEmpty',
      'emptyFieldText',
      'isPublic',
      'hasRunningJob',
      'defaultValues(id,name,presentation)',
      'parameterDefaultValues(id,name,value)'
    ].join(',');
  }

  /**
   * Build dynamic field selection based on what properties are needed
   */
  static buildCustomFieldSelection(requiredProperties: string[]): string {
    const fieldMap: Record<string, string> = {
      // Basic fields
      'id': 'id',
      'summary': 'summary', 
      'description': 'description',
      'project': 'project(id,name,shortName)',
      
      // User fields
      'reporter': 'reporter(id,login,fullName,email)',
      'assignee': 'customFields(name,value(login,fullName))',
      'updater': 'updater(id,login,fullName)',
      
      // Temporal
      'created': 'created',
      'updated': 'updated',
      'resolved': 'resolved',
      
      // Custom fields
      'customFields': 'customFields(name,value(name,presentation,id,login,fullName,minutes))',
      'state': 'customFields(name,value(name,presentation))',
      'priority': 'customFields(name,value(name,presentation))',
      'type': 'customFields(name,value(name,presentation))',
      
      // Social
      'tags': 'tags(name,color(background,foreground))',
      'comments': 'comments(id,text,author(login,fullName),created)',
      'attachments': 'attachments(id,name,url,size)',
      'votes': 'votes',
      
      // Relationships
      'links': 'links(direction,linkType(name),issues(idReadable,summary))',
      'parent': 'parent(direction,linkType(name),issues(idReadable,summary))',
      'subtasks': 'subtasks(direction,linkType(name),issues(idReadable,summary))'
    };

    const selectedFields = requiredProperties
      .map(prop => fieldMap[prop])
      .filter(Boolean);

    // Always include basic identification
    if (!selectedFields.includes('id')) {
      selectedFields.unshift('id', 'idReadable');
    }

    return selectedFields.join(',');
  }

  /**
   * Get field selection optimized for performance (minimal fields)
   */
  static getMinimalIssueFields(): string {
    return 'id,idReadable,summary,project(shortName)';
  }

  /**
   * Get field selection for search results
   */
  static getSearchResultFields(): string {
    return [
      'id',
      'idReadable', 
      'summary',
      'description',
      'project(id,shortName,name)',
      'reporter(login,fullName)',
      'created',
      'updated',
      'customFields(name,value(name,presentation))',
      'tags(name)',
      'commentsCount'
    ].join(',');
  }
}
