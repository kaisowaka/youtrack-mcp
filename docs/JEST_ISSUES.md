# Jest ES Module Configuration Issues

## Problem
Jest has compatibility issues with ES modules in this TypeScript project, causing `SyntaxError: Cannot use import statement outside a module`.

## Current Workaround ✅
We've implemented a custom test framework using `tsx` that works perfectly:
- Location: `scripts/test-unit.ts` 
- Command: `npm test` (runs the custom tests)
- Status: 10/10 tests passing

## Future Solutions (Optional)

### Option 1: Fix Jest Configuration
Try this updated `jest.config.js`:

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      useESM: true,
    }],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: [
    '**/src/__tests__/**/*.test.(ts|js)',
  ],
};
```

### Option 2: Migrate to Vitest
Vitest has better ES module support:

```bash
npm install -D vitest @vitest/ui
```

```javascript
// vite.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

### Option 3: Keep Current Solution
The custom test framework works excellently and provides:
- Simple, readable test syntax
- Full ES module support
- Clear test output
- Integration with npm scripts

## Recommendation
**Keep the current solution** - it's working perfectly and is actually simpler than Jest for this use case.

## Test Commands Available
- `npm test` - Run unit tests (custom framework)
- `npm run test:jest` - Try Jest (currently broken)
- `npm run test:connection` - Test YouTrack connection
- `npm run test:enhanced` - Test enhanced features
- `npm run test:integration` - Test MCP integration
- `npm run test:all` - Run all functional tests
