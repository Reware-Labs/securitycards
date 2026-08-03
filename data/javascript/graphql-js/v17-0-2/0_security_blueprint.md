# Security blueprint

Repository: `https://github.com/graphql/graphql-js#v17.0.2`

## Security posture

The graphql-js library provides foundational parsing, validation, and execution capabilities for GraphQL schemas and queries, but relies entirely on the consuming application to enforce authentication, authorization, and resource governance. Developers must assume all incoming query strings, variable payloads, and custom scalar inputs are untrusted and susceptible to malformed input handling, denial-of-service, and encoding confusion. Security boundaries depend on strict schema validation, request-scoped contexts, and explicit limits on parsing and execution to ensure systems fail closed when constraints are violated.

## Essential implementation rules

1. **Validate and Sanitize Input Documents and Query Strings**

Pass all untrusted query strings through `parse()` with explicit `maxTokens` limits and validate the resulting document AST using `validate()` with standard and security-focused validation rules before execution.

2. **Enforce Strict Schema Validation and Assertions**

Run `assertValidSchema()` or `validateSchema()` upon schema initialization and preserve default specification rules to maintain structural integrity and prevent control bypasses.

3. **Attach Request-Scoped User Identity and Context**

Authenticate incoming requests and attach caller identity metadata directly to the request context object, instantiating per-request helper instances like `DataLoader` to prevent cross-user data leaks.

4. **Enforce Field-Level Access Control and Tenant Isolation**

Verify record ownership and permissions within individual field resolvers and business logic layers, and explicitly evaluate custom schema directives using `getDirectiveValues`.

5. **Mitigate Resource Exhaustion and Denial of Service**

Configure execution limits such as static operation complexity rules, max validation errors, fragment cycle rejections, and pass an `AbortSignal` via `abortSignal` to `graphql()` to handle timeouts.

6. **Restrict Schema Introspection for Public Requests**

Conditionally append `NoSchemaIntrospectionCustomRule` to the validation rules array when handling unauthenticated or public requests to prevent schema enumeration.

7. **Validate Custom Scalars and Input Objects at Runtime**

Implement explicit input validation inside custom `GraphQLScalarType` configurations using `coerceInputValue` and configure `GraphQLInputObjectType` with `isOneOf: true` for mutually exclusive inputs.

8. **Handle Scalar Encoding Divergence Safely**

Explicitly handle both `IntValue` and `StringValue` AST node kinds when processing AST literals produced by `astFromValue` for `GraphQLID` types to avoid encoding confusion.

9. **Mask Internal Errors in Production**

Implement a custom error formatting function that replaces detailed `GraphQLError` stack traces with generic error messages when running in production environments.

10. **Validate Low-Level Execution and Subscription Arguments**

Normalize and validate execution and subscription arguments using `validateExecutionArgs()` and `validateSubscriptionArgs()` before invoking low-level stream creation or incremental execution functions.
