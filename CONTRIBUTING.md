# Contributing to YouTrack MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/youtrack-mcp.git
   cd youtrack-mcp-ts
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes**
6. **Test your changes**
   ```bash
   npm run build
   npm test
   ```
7. **Submit a pull request**

## 🎯 Types of Contributions

We welcome various types of contributions:

### 🐛 Bug Fixes
- Fix issues with existing tools
- Improve error handling
- Resolve API integration problems

### ✨ New Features
- Add new YouTrack integration tools
- Enhance existing functionality
- Improve user experience

### 📚 Documentation
- Improve setup instructions
- Add usage examples
- Update API documentation

### 🧪 Testing
- Add test cases
- Improve test coverage
- Performance testing

### 🔧 Infrastructure
- CI/CD improvements
- Build optimizations
- Development tooling

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public functions

### File Organization
```
src/
├── index.ts           # Main MCP server entry point
├── tools.ts           # Tool definitions
├── youtrack-client.ts # YouTrack API client
├── config.ts          # Configuration management
└── utils/             # Utility functions
```

### Tool Development
When adding new tools:

1. **Add tool definition** in `src/tools.ts`:
   ```typescript
   {
     name: 'your_tool_name',
     description: 'Clear description of what the tool does',
     inputSchema: {
       type: 'object',
       properties: {
         // Define parameters
       },
       required: ['required_param']
     }
   }
   ```

2. **Implement the method** in `src/youtrack-client.ts`:
   ```typescript
   async yourToolName(params: YourParamsType): Promise<MCPResponse> {
     try {
       // Implementation
       return { content: [{ type: 'text', text: 'result' }] };
     } catch (error) {
       logError(error as Error, { method: 'yourToolName', params });
       throw new Error(`Failed to execute tool: ${getErrorMessage(error)}`);
     }
   }
   ```

3. **Add case handler** in `src/index.ts`:
   ```typescript
   case 'your_tool_name':
     result = await this.youtrackClient.yourToolName({
       param: args.param as string
     });
     break;
   ```

### Error Handling
Always include proper error handling:

```typescript
try {
  // API call
} catch (error) {
  logError(error as Error, { context: 'relevant context' });
  throw new Error(`Descriptive error message: ${getErrorMessage(error)}`);
}
```

### API Integration
- Use the existing `youtrack-client.ts` patterns
- Include proper caching where appropriate
- Add logging for API calls
- Handle YouTrack-specific errors

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testNamePattern="test-name"

# Run tests in watch mode
npm run test:watch
```

### Writing Tests
- Place tests in `src/__tests__/` directory
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

Example test structure:
```typescript
describe('YourFeature', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle valid input correctly', async () => {
    // Test implementation
  });

  it('should handle errors gracefully', async () => {
    // Error test implementation
  });
});
```

## 📝 Pull Request Guidelines

### Before Submitting
- [ ] Tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages are clear

### PR Title Format
Use clear, descriptive titles:
- `feat: add new issue state management tools`
- `fix: resolve API timeout handling`
- `docs: update setup instructions`
- `refactor: improve error handling`

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] CI checks pass

## Checklist
- [ ] Code follows project conventions
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 🔄 Development Workflow

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(tools): add issue completion workflow
fix(client): resolve API timeout handling
docs(readme): update setup instructions
```

### Code Review Process
1. Submit PR with clear description
2. Address reviewer feedback
3. Ensure CI checks pass
4. Squash commits if requested
5. Merge after approval

## 🐛 Bug Reports

### Before Reporting
- Check existing issues
- Try latest version
- Gather relevant information

### Bug Report Template
```markdown
**Describe the bug**
Clear description of the problem

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen

**Environment:**
- YouTrack MCP Version: [version]
- Node.js Version: [version]
- Operating System: [OS]
- YouTrack Instance: [version/type]

**Additional context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Alternative solutions or features considered

**Additional context**
Any other relevant information or mockups
```

## 📚 Documentation

### Documentation Standards
- Use clear, concise language
- Include code examples
- Provide step-by-step instructions
- Keep documentation up to date

### Documentation Types
- **README.md** - Main project documentation
- **API Documentation** - Tool and method descriptions
- **Workflow Guides** - User workflow documentation
- **Setup Guides** - Installation and configuration

## 🎉 Recognition

Contributors will be recognized in:
- Contributors section in README
- Release notes for significant contributions
- GitHub contributor graphs

## ❓ Getting Help

If you need help:

1. **Check documentation** - README, workflow guides
2. **Search issues** - Existing questions and answers
3. **Create an issue** - For questions or problems
4. **Join discussions** - GitHub discussions for general questions

## 📜 Code of Conduct

Please note that this project is released with a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

---

**Thank you for contributing to YouTrack MCP Server!** 🙏

Your contributions help make this project better for everyone.
