# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Strict Parameter, Framing, and Method Constraints on Protocol Endpoints

**Use when**

Developing or configuring client integrations and protocol endpoints in Keycloak to prevent parameter pollution, cross-interface abuse, and request smuggling.

**Secure rules**

**Rule 1: Reject duplicate access token submission mechanisms and conflicting request framing parameters on endpoint requests.**

When querying protocol endpoints such as UserInfo, ensure access tokens are transmitted through exactly one transport mechanism, such as the `Authorization` header, and avoid combining multiple submission methods or duplicating parameters to prevent HTTP Parameter Pollution and request confusion.

```http
GET /realms/demo/protocol/openid-connect/userinfo HTTP/1.1
Host: keycloak.example.com
Authorization: Bearer <access_token>
```
