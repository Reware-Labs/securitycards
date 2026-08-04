# Security blueprint

Repository: `https://github.com/react/react#v19.2.7`

## Security posture

Developers working within this repository must assume that client-facing boundaries, serialization layers, and build configurations are security-sensitive and require strict validation. While the framework handles basic DOM rendering and component lifecycles, developers must explicitly protect against injection attacks, insecure deserialization, unsafe prop spreading, and resource exhaustion. Any malformed input, version mismatch, or unvalidated configuration must fail closed immediately to maintain application integrity and supply chain security.

## Essential implementation rules

1. **Control Source Map Generation in Build and Test Toolchains**

Disable source maps in production builds unless a scoped debug session explicitly requires them to avoid shipping unobfuscated source code. Keep inline source maps turned off by default in test runners like Jest unless explicitly enabled via flags.

2. **Enforce Multi-Factor Authentication and Package Version Integrity**

Require multi-factor authentication and explicit registry URLs during package publication. Verify that all package manifests share a single canonical version and satisfy declared dependency and peer-version ranges before cutting releases, failing the build on any mismatch.

3. **Filter and Validate Component Props Before Spreading**

Build an explicit allow-list of attribute names or validate data and aria attributes before spreading untrusted objects onto native JSX elements to prevent unexpected props or injection issues.

4. **Avoid Dynamic Code Execution in Configurations**

Parse dynamic configuration strings and compiler overrides using safe structured serialization formats like `JSON.parse` instead of executing code via `eval()` or `new Function()`. Safely process template AST nodes by whitelisting specific types without dynamic code evaluation.

5. **Validate All Arguments in Server Actions**

Inspect and validate types, lengths, and expected values of all arguments received inside Server Actions on the server prior to processing business logic or mutating state, rejecting malformed inputs early.

6. **Cache Promises Passed to the use Hook**

Cache asynchronous promises by every input parameter that defines the request using a bounded cache to prevent rendering denial of service and infinite re-render loops.

7. **Persist and Validate Safe Playground State**

Store only non-sensitive editor data in browser storage and URL hashes. At startup, decode the persisted payload, require a string-typed source field, sanitize optional fields, and fall back to default configurations when absent.

8. **Enforce Explicit npm Dist-Tags**

Require an approved dist-tag such as `latest`, `canary`, `experimental`, `beta`, or `rc` when publishing packages, and fail fast on unknown or misspelled tags to prevent accidental promotion of pre-release builds.
