# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: boundary control

## boundary control

### Specify Explicit Application Identifiers During mDNS Service Discovery

**Use when**

Performing mDNS VM Service discovery on local networks where multiple active processes or services are present.

**Secure rules**

**Rule 1: Always supply an explicit application bundle or process identifier when querying for mDNS attach targets to prevent attaching to an unintended local service.**

When discovering VM service instances, pass the explicit application identifier to ensure the discovery operation fails safely instead of attaching to an arbitrary local binary.

```dart
final MDnsVmServiceDiscoveryResult? result = await portDiscovery.queryForAttach(
  applicationId: 'com.example.targetApp',
);
```
