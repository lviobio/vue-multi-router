# Tests

Comprehensive test suite for vue-multi-router package.

## Test Structure

```
tests/
├── unit/                        # Vitest unit tests (jsdom, no browser)
│   ├── utils/
│   │   └── test-helpers.ts      # Shared helpers (createTestManager, delay, waitFor)
│   ├── activation-strategies.test.ts
│   ├── context-manager.test.ts
│   ├── composables.test.ts
│   └── virtual-stack.test.ts
└── e2e/                         # Playwright browser tests
    ├── context-switching.spec.ts
    └── basic-navigation.spec.ts
```

## Unit Tests

#### `activation-strategies.test.ts`

Tests for the two built-in activation strategies:

- `ImmediateActivationStrategy` — `onContextReady` always returns `true`, lifecycle no-ops
- `StabilizationActivationStrategy` — debounce timer, stabilization, timer reset, dispose
- `immediateActivation()` / `stabilizationActivation()` factory helpers

#### `virtual-stack.test.ts`

Tests for `VirtualStackManager` (per-context virtual navigation stacks):

- `create`, `has`, `get`, `remove`, `clear`
- `getLocation`, `getState`
- `push`, `replace`, `navigate`
- `setPosition`, `ensureEntriesUpTo`
- `addListener`, `notifyListeners`
- `isHistoryEnabled`

#### `context-manager.test.ts`

Tests for `MultiRouterManagerInstance`:

- `has` — before/after registration
- `setActive` — throws for unknown key, returns modified flag, reactive ref
- `unregister` — removes context, falls back to previous context when active is removed
- Auto-activation via `immediateActivation` strategy

#### `composables.test.ts`

Component-level tests via `@vue/test-utils`:

- `useMultiRouter` — throws without provider, exposes manager/refs/helpers
- `useMultiRouterContext` — throws without context key, reactive `isActive`, `activate()`

### Test Utilities

#### `utils/test-helpers.ts`

- `createTestHistory(location?)` — creates a `createMemoryHistory()` at the given path
- `createTestManager(options?)` — creates a `MultiRouterManagerInstance` wired to a test history
- `delay(ms)` — Promise-based delay
- `nextTick()` — waits one event-loop tick
- `waitFor(condition, options?)` — polls until a condition becomes true

## E2E Tests

E2E tests run against two servers started by Playwright:

| Server          | Command            | URL                          |
|-----------------|--------------------|------------------------------|
| Demo playground | `npm run play`     | `http://localhost:5175/app/` |
| E2E playground  | `npm run play:e2e` | `http://localhost:5176/e2e/` |

The e2e playground (`playground-e2e/`) contains minimal, stable fixtures decoupled
from the demo UI, so tests remain green as the demo evolves.

#### `context-switching.spec.ts`

Drives `playground-e2e/src/views/ContextSwitching.vue`:

- Both panels render on load
- Clicking "Activate Panel A/B" changes `activeContextKey`
- Each panel shows its own route content independently

#### `basic-navigation.spec.ts`

Drives `playground-e2e/src/views/BasicNavigation.vue`:

- Initial load shows Page A
- Clicking the Page B link navigates within the context
- Clicking the Page A link navigates back

## Running Tests

```bash
# Run all tests (unit + e2e)
npm test

# Unit tests only
npm run test:unit

# Unit tests in watch mode
npm run test:unit -- --watch

# Unit tests with coverage
npm run test:unit -- --coverage

# E2E tests (starts servers automatically)
npm run test:e2e

# E2E with Playwright UI
npm run test:e2e:ui

# E2E headed (visible browser)
npm run test:e2e:headed

# Debug a single e2e spec
npm run test:e2e:debug -- tests/e2e/context-switching.spec.ts

# View last e2e HTML report
npm run test:e2e:report
```

## Writing New Tests

When adding unit tests:

1. Use descriptive `describe` blocks matching the module or class name
2. Name tests in the form `"does X when Y"`
3. Follow Arrange → Act → Assert
4. Use `createTestManager()` from `utils/test-helpers` for manager tests
5. Use `mount()` from `@vue/test-utils` for composable tests

When adding e2e tests:

1. Add a new fixture view under `playground-e2e/src/views/` if needed
2. Register the route in `playground-e2e/src/router.ts`
3. Add `data-testid` attributes to elements the test must locate
4. Keep fixtures minimal — no Naive UI, no complex state
