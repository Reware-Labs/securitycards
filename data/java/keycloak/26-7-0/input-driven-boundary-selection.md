# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: input driven boundary selection

## input driven boundary selection

### Enforce Explicit URI Matching for Wildcard Resource Decision Evaluation

**Use when**

When querying decision evaluation endpoints for resources defined with wildcard URIs in Keycloak authorization requests.

**Secure rules**

**Rule 1: Enable explicit URI matching when evaluating decision requests for resources defined with wildcard URIs.**

When querying decision evaluation endpoints for resources defined with wildcard URIs such as `/rs/*`, ensure that the `matchingUri` flag is explicitly set to `true` to enable proper URI matching against wildcard patterns.

```java
AuthorizationResponse response = authorizeDecision(accessToken, true,
    new PermissionRequest("/rs/data", "ScopeD", "ScopeE"));
assertTrue((Boolean) response.getOtherClaims().getOrDefault("result", false));
```
