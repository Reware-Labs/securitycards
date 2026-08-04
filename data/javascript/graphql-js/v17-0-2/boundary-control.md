# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: boundary control

## boundary control

### Enforce Schema Introspection Restrictions for Public Requests

**Use when**

When building GraphQL validation rules for unauthenticated or public requests where unauthorized callers must not be allowed to inspect the full schema structure.

**Secure rules**

**Rule 1: Restrict schema introspection by appending `NoSchemaIntrospectionCustomRule` to validation rules for public requests.**

To prevent unauthenticated callers from enumerating your schema, conditionally append `NoSchemaIntrospectionCustomRule` from `graphql` to the validation rules array whenever handling public requests.

```js
import { specifiedRules, NoSchemaIntrospectionCustomRule } from 'graphql';

const validationRules = isPublicRequest
  ? [...specifiedRules, NoSchemaIntrospectionCustomRule]
  : specifiedRules;
```
