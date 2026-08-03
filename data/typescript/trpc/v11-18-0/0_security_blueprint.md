# Security blueprint

Repository: `https://github.com/trpc/trpc#v11.18.0`

## Security posture

The tRPC repository relies on a robust schema-driven procedure and client link architecture where request validation, context creation, and authorization boundaries are enforced explicitly by the developer. While input parsing and serialization frameworks provide robust foundations, default configurations do not automatically enforce CORS restrictions, production error suppression, or fine-grained authorization checks. Developers must treat all transport adapters, client links, file upload streams, and context creation routines as security-sensitive surfaces that fail closed.

## Essential implementation rules

1. **Validate Organization Membership and Authorization within Procedure Middleware**

Chain base procedures and middleware to verify organization membership, role assignment, or resource ownership against validated inputs, and throw a `TRPCError` with code `FORBIDDEN` on failure.

2. **Ensure tRPC Client Links End with a Valid Terminating Link**

Configure client links arrays by always appending a valid terminating link such as `httpBatchLink`, `httpLink`, or `wsLink`, and ensure all branches in `splitLink` include terminating links.

3. **Throw Explicit TRPCError Instances and Sanitize Error Responses**

Throw explicit `TRPCError` instances with structured error codes like `UNAUTHORIZED` or `NOT_FOUND` instead of generic errors, sanitize error messages to prevent leakage, and map caller errors securely using `getHTTPStatusCodeFromError`.

4. **Disable Development Stack Traces and Configure Production Runtime Environments**

Explicitly configure `isDev: false` or tie initialization settings to `NODE_ENV === 'production'` during router creation to prevent stack traces from leaking in client error payloads.

5. **Extract and Cryptographically Verify Caller Credentials in Context Setup**

Parse authorization headers or connection parameters within `createContext` and `connectionParams` to perform cryptographic verification on every request and WebSocket connection.

6. **Configure Identical Data Transformers Consistently Across Boundaries**

Define a shared data transformer instance, such as `superjson` or custom `devalue` parse and stringify wrappers, and supply it identically to both `initTRPC.create` on the server and client links.

7. **Secure File Upload Handling and Input Validation in Procedures**

Use non-batched `httpLink` and mutation procedures for `FormData` uploads, parse binary streams with `octetInputParser`, validate file inputs explicitly, and prevent global body parsers from intercepting multipart streams.

8. **Define Runtime Input Validation Schemas Using Zod**

Always specify explicit runtime input schemas using `.input()` with validation libraries like Zod on every query, mutation, and subscription procedure to ensure client data is thoroughly parsed and rejected if malformed.

9. **Validate Base Path Prefixes and Export Both HTTP Methods for Handlers**

Verify incoming request URLs against expected `basePath` prefixes in standalone handlers, align endpoint paths in `fetchRequestHandler`, and explicitly export both `GET` and `POST` request methods.

10. **Configure Explicit CORS Policies and Response Security Headers**

Provide strict CORS options with trusted origins rather than wildcards on adapters, set dynamic cache control response headers using `responseMeta`, and use standard `streamHeader: 'accept'` headers for cross-origin streams.

11. **Configure Batch Limits, Keep-Alive Heartbeats, and Abort Signals**

Set explicit `maxURLLength` limits on batch links, enable `keepAlive` ping/pong options in WebSocket handlers, and pass `opts.signal` to subscription event iterators to prevent resource exhaustion.

12. **Avoid Exposing Authentication Tokens in URL Query Parameters**

Never pass sensitive authentication tokens or credentials in URL query parameters or connection parameters for subscriptions; use header-based authentication via event source options or HTTP-only cookies instead.

13. **Properly Manage Session Cookies, SSR Header Forwarding, and Link Types**

Enable `withCredentials` for cross-domain SSE subscriptions, explicitly forward `cookie` headers during Server-Side Rendering (SSR), and use `httpBatchLink` instead of streaming links when procedures need to set or modify session cookies.
