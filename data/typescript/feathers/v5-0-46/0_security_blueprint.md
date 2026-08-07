# Security blueprint

Repository: `https://github.com/feathersjs/feathers#v5.0.46`

## Security posture

The Feathers framework requires developers to explicitly secure service methods, authentication flows, and data boundaries to prevent unauthorized access and injection risks. While default configurations manage basic routing and local storage token persistence, developers must enforce strict input validation, role checks, and database query scoping inside service hooks. All untrusted external inputs and authentication credentials must be verified and sanitized server-side before execution, ensuring that security-sensitive operations fail closed.

## Essential implementation rules

1. **Enforce Authentication and Authorization within Hooks**

Attach `authenticate` hooks to service methods and explicitly verify user presence and required permissions in `context.params.user` to prevent unauthorized execution. Ensure these checks occur within Feathers hooks rather than Express middleware to cover non-REST transports like WebSockets.

2. **Validate and Coerce Input Payloads and Queries**

Apply strict schema validations using `schemaHooks.validateData` and `schemaHooks.validateQuery` with `additionalProperties: false` to reject malformed payloads or unexpected parameters. Use TypeBox with type-coercion enabled on queries to guarantee correct parameter types before database operations.

3. **Scope Queries and Restrict Transport Methods**

Use schema hooks and query resolvers to bind incoming request filters directly to authenticated user or tenant identifiers. Check `context.params.provider` or restrict exposed methods via `methods` options to block unauthorized external transport access to sensitive internal functions.

4. **Secure Authentication Tokens and Credentials**

Configure JWTs with short expiration times when embedding permissions into stateless tokens, and explicitly map sensitive secrets and OAuth credentials via environment variables and node-config. Store client tokens securely using memory or local storage configuration, and avoid putting private data into JWT payloads.

5. **Hash Passwords and Sanitize Output Responses**

Always hash plain text passwords using the `passwordHash` resolver utility from `@feathersjs/authentication-local` before saving user data. Use external resolvers to return `undefined` for sensitive fields like password hashes so they are excluded from client response payloads.

6. **Prevent Injection and Handle Errors Safely**

Configure explicit disabled operators such as `$rename` or `$unset` on MongoDB and database services to prevent untrusted query parameter manipulation. Retrieve raw database errors via the exported `ERROR` symbol for server-side logging while returning sanitized error messages to remote clients.

7. **Limit Resource Consumption and File Uploads**

Protect against denial of service by configuring explicit file size limits with `multer`, setting express JSON payload limits, and defining default and maximum pagination settings under the `paginate` configuration key.

8. **Manage Real-Time Channels and Session Logout**

Dynamically manage real-time connections by joining them to anonymous channels initially and moving them to authorized channels only upon successful login events. Implement server-side token revocation tracking and call `app.logout()` to clear client credentials properly upon logout.
