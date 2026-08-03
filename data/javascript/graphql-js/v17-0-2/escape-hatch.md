# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: escape hatch

## escape hatch

### Restrict unconstrained JSON scalars with explicit runtime validation

**Use when**

Defining custom scalars like `GraphQLScalarType` that accept arbitrary or unconstrained JSON payloads.

**Secure rules**

**Rule 1: Validate input values explicitly within custom scalar definitions to prevent raw, unconstrained payloads from bypassing type-checking safeguards.**

Implement `coerceInputValue` inside the `GraphQLScalarType` configuration to inspect incoming values at runtime and throw an appropriate error when structural or type expectations are violated.

```typescript
import { GraphQLScalarType } from 'graphql';

const ValidatedJSON = new GraphQLScalarType({
  name: 'ValidatedJSON',
  coerceInputValue(value) {
    if (typeof value !== 'object' || value === null) {
      throw new TypeError('Expected non-null JSON object');
    }
    return value;
  },
});
```
