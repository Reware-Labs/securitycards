# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: network boundary

## network boundary

### Configure Trusted Proxy Headers for OAuth 2.0 Redirect URIs

**Use when**

Deploying Spring Security applications behind a reverse proxy or load balancer to ensure that OAuth 2.0 redirect URIs resolve accurately using trusted network configuration.

**Secure rules**

**Rule 1: Configure reverse proxy header processing so that Spring Security correctly resolves the secure external scheme, host, and port for OAuth 2.0 redirect URIs.**

Ensure your reverse proxy forwards standard headers correctly and configure your application infrastructure to honor them. Set up redirect URIs consistently using `{baseUrl}/login/oauth2/code/{registrationId}` to prevent credential and authorization code exposure over unencrypted channels.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
```
