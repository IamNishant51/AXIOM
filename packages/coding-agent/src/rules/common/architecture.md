# Architecture Rules

## File Organization

### File Size
- **Typical: 200-400 lines**
- **Maximum: 800 lines**
- If a file exceeds 800 lines, split it

### Directory Structure
Organize by **feature/domain**, not by type:
```
✅ GOOD:
src/features/
├── users/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── orders/

❌ BAD:
src/
├── components/
├── hooks/
├── services/
└── types/
```

## Immutability (CRITICAL)

**Always create new objects, never mutate existing ones.**

```typescript
// ✅ GOOD: Spread operator
const updatedUser = { ...user, name: 'New Name' };
const updatedArray = [...items, newItem];

// ❌ BAD: Direct mutation
user.name = 'New Name';
items.push(newItem);
```

## Error Handling

1. **Handle errors at every level**
2. **User-friendly messages in UI code**
3. **Detailed logging server-side**
4. **Never silently swallow errors**

```typescript
// ✅ GOOD
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Failed to fetch:', error);
  throw new UserFriendlyError('Failed to load data. Please try again.');
}

// ❌ BAD
try {
  return await fetchData();
} catch (e) {
  // Nothing
}
```

## Input Validation

1. **Validate at system boundaries**
2. **Fail fast with clear messages**
3. **Never trust external data**

```typescript
// ✅ GOOD
function createUser(input: unknown) {
  const validated = UserSchema.parse(input);
  return createUserInternal(validated);
}
```

## Dependency Rules

1. **High cohesion, low coupling**
2. **Depend on abstractions, not concretions**
3. **No circular dependencies**
4. **Layered architecture**: UI → Services → Data

```
UI Layer
  ↓
Service Layer
  ↓
Data Layer
```

## Code Organization Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | One reason to change |
| **Open/Closed** | Open for extension, closed for modification |
| **Liskov Substitution** | Subtypes must be substitutable |
| **Interface Segregation** | Many specific interfaces > one general |
| **Dependency Inversion** | Depend on abstractions |

## Performance Rules

1. **Avoid last 20% of context window**
2. **Lazy load heavy components**
3. **Memoize expensive computations**
4. **Use pagination for large lists**

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` | `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types | PascalCase | `User.types.ts` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Private | Prefix with `_` | `_privateMethod` |