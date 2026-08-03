# Security cards

Repository: `https://github.com/graphql/graphql-js#v17.0.2`
Category: security control integrity

## security control integrity

### Validate Schemas and Preserve Default Rules During GraphQL Execution

**Use when**

When initializing GraphQL schemas, constructing custom execution pipelines, or configuring validation rules to prevent security control bypasses and unvalidated inputs.

**Secure rules**

**Rule 1: Run schema validation explicitly and preserve default specification rules to maintain runtime integrity.**

Always run schema validation checks such as `assertValidSchema()` or `validateSchema()` when constructing or extending GraphQL schemas, and ensure that standard validation rules like `specifiedRules` are preserved when adding custom constraints to prevent malformed schemas and bypasses.

```javascript
import { assertValidSchema, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      health: { type: GraphQLString },
    },
  }),
});

assertValidSchema(schema);
```

**Rule 2: Check execution error arrays and validate documents prior to custom pipeline execution.**

Explicitly inspect the `result.errors` array on execution results to handle partial execution failures and authorization errors rather than relying solely on successful promises, and execute document validation before invoking low-level execution helpers.

```javascript
import { execute, parse } from 'graphql';

const result = await execute({
  schema,
  document: parse('query { sensitiveData }'),
  contextValue,
});

if (result.errors && result.errors.length > 0) {
  console.error('Execution errors occurred:', result.errors);
}
```
