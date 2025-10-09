import { sanitizeDescription, sanitizeComment, unescapeMarkdown } from '../utils/text-sanitizer.js';

describe('Text Sanitizer', () => {
  describe('unescapeMarkdown', () => {
    it('should unescape backticks in code blocks', () => {
      const input = '\\`\\`\\`typescript\\nconst x = 1;\\n\\`\\`\\`';
      const expected = '```typescript\nconst x = 1;\n```';
      expect(unescapeMarkdown(input)).toBe(expected);
    });

    it('should unescape inline code', () => {
      const input = 'Use \\`const\\` keyword';
      const expected = 'Use `const` keyword';
      expect(unescapeMarkdown(input)).toBe(expected);
    });

    it('should unescape markdown special characters', () => {
      const input = '\\* Bold \\* and \\_italic\\_ and \\[link\\]';
      const expected = '* Bold * and _italic_ and [link]';
      expect(unescapeMarkdown(input)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(unescapeMarkdown('')).toBe('');
    });

    it('should handle undefined', () => {
      expect(unescapeMarkdown(undefined)).toBe('');
    });
  });

  describe('sanitizeDescription', () => {
    it('should unescape markdown and normalize line endings', () => {
      const input = '# Title\\r\\n\\r\\n\\`\\`\\`js\\r\\ncode\\r\\n\\`\\`\\`';
      const result = sanitizeDescription(input);
      expect(result).toContain('```js\ncode\n```');
      expect(result).not.toContain('\\r\\n');
    });

    it('should remove excessive blank lines', () => {
      const input = 'Line 1\\n\\n\\n\\n\\nLine 2';
      const result = sanitizeDescription(input);
      expect(result).toBe('Line 1\\n\\nLine 2');
    });

    it('should trim whitespace', () => {
      const input = '  \\n  Text  \\n  ';
      const result = sanitizeDescription(input);
      expect(result).toBe('Text');
    });

    it('should handle complex markdown with escaped backticks', () => {
      const input = '## Example\n\\`\\`\\`typescript\ninterface Example {\n  name: string;\n}\n\\`\\`\\`\n\nUse \\`Example\\` interface.';

      const expected = '## Example\n```typescript\ninterface Example {\n  name: string;\n}\n```\n\nUse `Example` interface.';

      expect(sanitizeDescription(input)).toBe(expected);
    });
  });

  describe('sanitizeComment', () => {
    it('should apply same sanitization as description', () => {
      const input = 'Comment with \\`code\\` and \\`\\`\\`block\\`\\`\\`';
      const result = sanitizeComment(input);
      expect(result).toContain('`code`');
      expect(result).toContain('```block```');
    });
  });
});
