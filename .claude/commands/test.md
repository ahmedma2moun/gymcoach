---
description: "Run tests for the Antigravity Gym project"
---
# Testing Guide

## Test Commands

- **All tests**: `npm test` (vitest)
- **Watch mode**: `npm test -- --watch`
- **Coverage**: `npm test -- --coverage`
- **Single file**: `npm test -- src/components/AdminDashboard.test.jsx`

## Test Files

| Test File | What It Covers |
|---|---|
| `src/components/AdminDashboard.test.jsx` | Admin dashboard component |

## Test Stack

- **Runner**: Vitest 4.0.15
- **Environment**: jsdom 27.3.0 (configured in `vite.config.js`)
- **Utilities**: @testing-library/react 16.3.0, @testing-library/user-event 14.6.1
- **Setup file**: `src/setupTests.js`

## Writing New Tests

```jsx
// src/components/MyComponent.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

Mock API calls with `vi.mock` or use `@testing-library/user-event` for interactions.
