# Security blueprint

Repository: `https://github.com/fastify/fastify#v5.9.0`

## Security posture

Fastify v5.9.0 supplies secure defaults for parsing, routing, and schema compilation, but application security still depends on explicit schemas, lifecycle hooks, encapsulation, and deployment settings. Treat request data as untrusted until the appropriate validation stage, establish framework-wide controls before startup, and use documented scoped APIs for route-specific behavior. Keep low-level response, parser, proxy, and protocol escape hatches narrowly controlled because they can bypass normal safeguards.

## Essential implementation rules

1. **Define Complete, Static Input Contracts**

Define complete JSON schemas for request bodies, query strings, parameters, headers, and accepted media types. Never construct schemas from untrusted input because `Ajv` and `fast-json-stringify` compile them into executable functions; use TypeBox or equivalent definitions to keep runtime validation aligned with static types.

2. **Apply Security at the Correct Lifecycle Stage**

Place authentication and body-dependent checks in `preValidation`, after parsing but before schema validation and the handler. Use scoped `onRequest` hooks for earlier route gating, and always stop asynchronous hooks by returning a sent reply or throwing an error.

3. **Enforce Access Boundaries with Routing and Encapsulation**

Keep authorization hooks and decorators in the same `fastify.register` context as the routes they protect. Add explicit host or tenant constraints where routing selects a security boundary, and require route-level opt-in before plugins attach sensitive behavior.

4. **Protect Credentials, Sessions, and Request Authenticity**

Use maintained Fastify plugins for CSRF protection and secure cookie sessions, with strong keys and production-appropriate cookie settings. Store passwords as `bcrypt` hashes rather than plaintext or a fast digest, resolve any encryption key once at startup instead of minting one per request, and keep stored secrets out of logs, error bodies, and collection responses. Preserve original request bytes when cryptographic webhook verification requires them, and do not treat decorator-based local authentication state as production-ready.

5. **Bound Payload, Parser, and Connection Work**

Set explicit `bodyLimit`, `maxParamLength`, connection timeouts, socket reuse limits, and HTTP/2 session timeouts. Apply limits to custom content-type parsers and transformed streams, keep Ajv `allErrors` disabled, avoid asynchronous database work during validation, and retain safe-regex routing defaults.

6. **Handle Parsed Input Without Prototype Hazards**

Keep supported prototype-poisoning actions at their safe defaults, preferably rejecting `__proto__` and `constructor` keys when downstream code may merge objects. Avoid `Object.assign` on parsed attacker-controlled values, and access route parameters without assuming inherited prototype properties exist.

7. **Preserve Response and Output Safety**

Prefer Fastify reply methods and serializers over `reply.raw` or `reply.hijack()`, and fully manage the response after hijacking. Encode redirect targets and header values, set explicit stream media types when required, and never register forbidden trailer fields such as `authorization` or `set-cookie`. Escape untrusted values when a route composes an HTML body itself rather than returning serialized JSON, and strip newline and control characters from request data before writing it to a log.

8. **Respect Framework State and Compilation Contracts**

Initialize mutable request-scoped state inside lifecycle hooks rather than as shared Request or Reply decorations, and never assign to read-only lifecycle properties such as `reply.sent`. Register validator compilers, serializer compilers, and constraint strategies before routes are compiled or the server starts.

9. **Harden Runtime, TLS, and Network Trust**

Bind `listen` to only the interfaces that should be reachable, scope `trustProxy` to known upstream addresses, and keep Node.js insecure HTTP parsing disabled on a supported runtime. Prefer production TLS termination at a trusted reverse proxy, or pass keys and certificates through Fastify's documented `https` option.

10. **Fail Closed in Custom Validation and Routing**

Propagate every custom constraint derivation error to its callback so routing cannot fall through to another handler. When `attachValidation` is enabled, explicitly inspect and handle validation failures, throw real `Error` instances from custom error handlers, and fully reconstruct schemas before recompiling modified validation rules.

11. **Confine File Paths and Archive Members**

Resolve any request-supplied file name or path segment against a fixed storage root and confirm the result stays inside it before opening, since joining a raw value still leaves the root when it contains `..`. Apply the same containment check to every entry read out of an uploaded archive, and reject rather than clamp so a traversal attempt does not silently reach a neighbouring file.

12. **Keep Untrusted Input Out of Shells and Evaluators**

Invoke external programs with `execFile` or `spawn` and an argument array rather than a concatenated `exec` string, leave `shell` disabled, and reject argument values beginning with a dash so they cannot be read as options. Never pass request data to `eval`, `new Function`, or `node:vm`; parse submitted expressions with a restricted grammar and bound the length and nesting depth they may reach.
