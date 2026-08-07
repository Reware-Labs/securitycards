# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: network boundary

## network boundary

### Enforce Strict TLS Transport Security and Trusted Proxy Configuration

**Use when**

Configuring transport security, reverse proxy headers, and trusted proxy addresses for Keycloak realms, administration, and inter-node communication.

**Secure rules**

**Rule 1: Enforce HTTPS transport requirements for Keycloak realms and administrative connections.**

Set the `sslRequired` directive on Keycloak realms to `external` or `all` to enforce HTTPS for all incoming requests. Ensure administrative CLI and REST API connections strictly target `https:` endpoints.

```yaml
apiVersion: k8s.keycloak.org/v2alpha1
kind: KeycloakRealmImport
metadata:
  name: example-realm-import
spec:
  realm:
    realm: token-test
    sslRequired: external
```

**Rule 2: Configure trusted proxy addresses and proxy headers securely.**

Specify trusted reverse proxy IP addresses using `proxy-trusted-addresses` and ensure reverse proxies overwrite incoming forwarding headers before requests reach Keycloak.

```properties
proxy-trusted-addresses=10.0.0.1,10.0.0.2
```
