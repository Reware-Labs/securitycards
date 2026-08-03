# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: network boundary

## network boundary

### Enable TLS Certificate Validation and Hostname Verification for Outbound REST Clients

**Use when**

Configuring outbound REST client connections, OIDC integration, and Keycloak policy enforcer endpoints that communicate across network trust boundaries.

**Secure rules**

**Rule 1: Enforce strict TLS certificate validation and hostname verification for all outgoing REST client and authentication connections**

Ensure that `trust-all` is not set to true and hostname verification is not disabled in production configurations. Configure valid truststores and explicit TLS configurations to prevent interception and man-in-the-middle attacks.

```properties
quarkus.rest-client.extensions-api.tls-configuration-name=production-tls
quarkus.oidc.tls.verification=required
quarkus.oidc.tls.trust-store-file=certs/truststore.p12
quarkus.oidc.tls.trust-store-password=changeit
```
