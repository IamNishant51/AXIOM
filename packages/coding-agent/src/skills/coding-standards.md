---
name: coding-standards
description: Baseline cross-project coding conventions for naming, readability, immutability, and code-quality review.
origin: axiom
---

# Coding Standards & Best Practices

Baseline coding conventions applicable across projects.

## When to Activate

- Starting a new project or module
- Reviewing code for quality and maintainability
- Refactoring existing code to follow conventions
- Enforcing naming, formatting, or structural consistency

## Code Quality Principles

### 1. Readability First
- Code is read more than written
- Clear variable and function names
- Self-documenting code preferred over comments
- Consistent formatting

### 2. KISS (Keep It Simple)
- Simplest solution that works
- Avoid over-engineering
- No premature optimization
- Easy to understand > clever code

### 3. DRY (Don't Repeat Yourself)
- Extract common logic into functions
- Create reusable components
- Share utilities across modules

### 4. YAGNI (You Aren't Gonna Need It)
- Don't build features before needed
- Start simple, refactor when needed

## Immutability Pattern (CRITICAL)

```typescript
// ✅ GOOD: Spread operator
const updatedUser = { ...user, name: 'New Name' };
const updatedArray = [...items, newItem];

// ❌ BAD: Direct mutation
user.name = 'New Name';
items.push(newItem);
```

## Error Handling

```typescript
// ✅ GOOD: Comprehensive error handling
async function fetchData(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}
```

## Type Safety

```typescript
// ✅ GOOD: Proper types
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ BAD: Using 'any'
function getUser(id: any): any {
  return { id, name: 'test' };
}
```

## File Organization

```
src/
├── core/           # Core utilities
├── components/    # React components
├── hooks/          # Custom hooks
├── lib/            # Utilities
└── types/          # TypeScript types
```

## Code Smell Detection

### Long Functions (>50 lines)
```typescript
// ❌ BAD
function processEverything() {
  // 100+ lines
}

// ✅ GOOD
function validate() { /* ... */ }
function transform() { /* ... */ }
function save() { /* ... */ }
```

### Deep Nesting
```typescript
// ❌ BAD: 5+ levels
if (user) {
  if (user.isAdmin) {
    if (market) {
      if (market.isActive) { /* ... */ }
    }
  }
}

// ✅ GOOD: Early returns
if (!user) return;
if (!user.isAdmin) return;
if (!market) return;
if (!market.isActive) return;
// Do something
```

### Magic Numbers
```typescript
// ❌ BAD
if (retry > 3) { }

// ✅ GOOD: Named constants
const MAX_RETRIES = 3;
if (retry > MAX_RETRIES) { }
```

## Comments

```typescript
// ✅ GOOD: Explain WHY
// Use exponential backoff to avoid overwhelming the API
const delay = Math.min(1000 * Math.pow(2, retry), 30000);

// ❌ BAD: Stating the obvious
// Increment counter by 1
count++;
```