# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: secret handling

## secret handling

### Externalize Secrets for Opaque Token Introspection and OAuth2 Clients

**Use when**

Configuring OAuth2 clients, resources, or token introspection in Spring Security applications where credentials and client secrets are required.

**Secure rules**

**Rule 1: Omit client secrets for public OAuth 2.0 clients and use PKCE**

For clients running in environments that cannot maintain credential confidentiality, such as native or browser-based applications, do not configure a client secret. Configure the authorization-code client with `client-authentication-method: none`; Spring Security then applies PKCE to the authorization request.

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: okta-client-id
            client-authentication-method: none
            authorization-grant-type: authorization_code
            redirect-uri: "{baseUrl}/authorized/okta"
        provider:
          okta:
            authorization-uri: https://dev-1234.oktapreview.com/oauth2/v1/authorize
            token-uri: https://dev-1234.oktapreview.com/oauth2/v1/token
```
