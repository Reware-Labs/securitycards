# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Protocol Version Restriction and Transport Security for WebSockets

**Use when**

Configuring network transport schemes and protocol versions for WebSocket communication in production environments.

**Secure rules**

**Rule 1: Require TLS encryption using the `wss://` protocol scheme for WebSocket connections.**

Unencrypted `ws://` connections transmit frames over raw TCP in plain text, exposing handshake HTTP headers, authentication tokens, and message payloads to network eavesdropping and tampering. Ensure HTTP/TLS is properly configured for the application and require clients to initiate connections using the `wss://` protocol URL scheme.

```text
wss://example.com/chat/username
```


### Secure and Isolate Management and Health Endpoints

**Use when**

Configuring management, health checks, and metrics endpoints in Quarkus to prevent unauthorized exposure.

**Secure rules**

**Rule 1: Isolate management endpoints on a separate internal network interface.**

Configure a dedicated internal network host and port for management traffic using `quarkus.management.enabled=true`, `quarkus.management.host`, and `quarkus.management.port` properties to prevent exposing sensitive internal telemetry on public application interfaces.

```properties
quarkus.management.enabled=true
quarkus.management.host=127.0.0.1
quarkus.management.port=9002
```

**Rule 2: Enforce authentication and role-based access policies on management endpoints.**

Explicitly enable authentication on the management interface using `quarkus.management.auth.enabled=true` and define path-based permissions and role policies to restrict operational routes.

```properties
quarkus.management.enabled=true
quarkus.management.auth.enabled=true
quarkus.management.auth.basic=true
quarkus.management.auth.policy.management-policy.roles-allowed=management
quarkus.management.auth.permission.health.paths=/q/health/*
quarkus.management.auth.permission.health.policy=management-policy
```

**Rule 3: Enable TLS encryption on the dedicated management interface.**

Configure HTTPS on the management server using `quarkus.management.tls-configuration-name` to ensure management traffic and HTTP Basic Auth credentials are encrypted in transit.

```properties
quarkus.management.enabled=true
quarkus.management.host=localhost
quarkus.management.port=9002
quarkus.management.tls-configuration-name=management
```

**Rule 4: Validate Host headers and reverse proxy forwarding headers for management endpoints.**

Configure explicit host header validation via `quarkus.management.host-validation.allowed-hosts` and restrict forwarding headers using `quarkus.management.proxy.proxy-address-forwarding=true` to prevent host spoofing and header injection.

```properties
quarkus.management.enabled=true
quarkus.management.host-validation.allowed-hosts=management.example.com
quarkus.management.proxy.proxy-address-forwarding=true
quarkus.management.proxy.allow-x-forwarded=true
```
