#!/usr/bin/env node
/**
 * Content Validation Utility for YouTrack MCP
 * 
 * This utility helps validate content before creating issues or articles
 * to prevent common duplication mistakes.
 */

interface ArticleContent {
  title: string;
  summary?: string;
  content: string;
}

interface IssueContent {
  summary: string;
  description?: string;
  type?: string;
  priority?: string;
}

class ContentValidator {
  validateArticle(article: ArticleContent): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check if title is duplicated in content
    if (article.content.toLowerCase().includes(article.title.toLowerCase())) {
      warnings.push(`⚠️  Title "${article.title}" appears in content. Remove it - YouTrack displays title separately.`);
    }

    // Check if summary is duplicated in content
    if (article.summary && article.content.toLowerCase().includes(article.summary.toLowerCase())) {
      warnings.push(`⚠️  Summary appears in content. Remove it - YouTrack displays summary separately.`);
    }

    // Check for markdown headers that might be duplicating the title
    const titleAsHeader = new RegExp(`^#+ *${article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'mi');
    if (titleAsHeader.test(article.content)) {
      warnings.push(`⚠️  Title appears as markdown header in content. Remove the header.`);
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  validateIssue(issue: IssueContent): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check if summary is duplicated in description
    if (issue.description && issue.description.toLowerCase().includes(issue.summary.toLowerCase())) {
      warnings.push(`⚠️  Summary "${issue.summary}" appears in description. Remove it - YouTrack displays them separately.`);
    }

    // Check for type/priority prefixes in summary
    const typePrefixPattern = /^(bug|feature|task|story|epic)[:|\s-]/i;
    const priorityPrefixPattern = /^(critical|high|normal|low|urgent)[:|\s-]/i;

    if (typePrefixPattern.test(issue.summary)) {
      warnings.push(`⚠️  Summary has type prefix. Use the separate 'type' field instead.`);
    }

    if (priorityPrefixPattern.test(issue.summary)) {
      warnings.push(`⚠️  Summary has priority prefix. Use the separate 'priority' field instead.`);
    }

    // Check for markdown headers that might be duplicating the summary
    if (issue.description) {
      const summaryAsHeader = new RegExp(`^#+ *${issue.summary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'mi');
      if (summaryAsHeader.test(issue.description)) {
        warnings.push(`⚠️  Summary appears as markdown header in description. Remove the header.`);
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  // CLI interface
  static runCLI() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help')) {
      console.log(`
YouTrack Content Validator

Usage:
  validate-content article "Title" "Summary" "Content"
  validate-content issue "Summary" "Description" 

Examples:
  validate-content article "API Guide" "REST API guide" "# API Guide\\nThis is..."
  validate-content issue "Login fails" "Steps: 1. Go to login..."

Options:
  --help    Show this help message
      `);
      return;
    }

    const validator = new ContentValidator();
    const type = args[0];

    if (type === 'article' && args.length >= 4) {
      const [, title, summary, content] = args;
      const result = validator.validateArticle({ title, summary, content });
      
      console.log('Article Validation Result:');
      console.log('========================');
      if (result.isValid) {
        console.log('✅ Content looks good! No duplication issues detected.');
      } else {
        console.log('❌ Issues found:');
        result.warnings.forEach(warning => console.log(`  ${warning}`));
      }
    } else if (type === 'issue' && args.length >= 3) {
      const [, summary, description] = args;
      const result = validator.validateIssue({ summary, description });
      
      console.log('Issue Validation Result:');
      console.log('=======================');
      if (result.isValid) {
        console.log('✅ Content looks good! No duplication issues detected.');
      } else {
        console.log('❌ Issues found:');
        result.warnings.forEach(warning => console.log(`  ${warning}`));
      }
    } else {
      console.log('❌ Invalid arguments. Use --help for usage information.');
    }
  }
}

// Run CLI if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ContentValidator.runCLI();
}

export { ContentValidator };
