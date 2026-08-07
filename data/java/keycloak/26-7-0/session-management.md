# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: session management

## session management

### Manage session timeouts and revocation in Keycloak applications

**Use when**

Developing or configuring Keycloak realms, clients, and custom providers to enforce strict session lifespans, validate active session state, and perform session revocation.

**Secure rules**

**Rule 1: Configure explicit session idle and max lifespan bounds in realm settings**

Explicitly define `ssoSessionIdleTimeout` and `ssoSessionMaxLifespan` parameters in realm configuration files or models to cap session longevity and prevent unbonded session reuse.

```json
{
  "realm": "my-realm",
  "ssoSessionIdleTimeout": 1800,
  "ssoSessionMaxLifespan": 36000,
  "offlineSessionIdleTimeout": 2592000,
  "offlineSessionMaxLifespan": 5184000
}
```

**Rule 2: Validate active session status using Keycloak session validation utilities**

Use `AuthenticationManager.isSessionValid(realm, userSession)` to verify active session status before processing requests in custom providers or endpoints.

```java
if (!AuthenticationManager.isSessionValid(realm, userSession)) {
    return Response.status(Response.Status.UNAUTHORIZED).build();
}
```

**Rule 3: Trigger backchannel logout to invalidate sessions programmatically**

Use `AuthenticationManager.backchannelLogout` to perform complete session teardown, expiring identity cookies and notifying federated clients.

```java
AuthenticationManager.backchannelLogout(
    session,
    realm,
    userSession,
    uriInfo,
    clientConnection,
    requestHeaders,
    true
);
```

**Rule 4: Configure refresh token reuse limits to prevent replay attacks**

Set the maximum refresh token reuse count on the realm model to a low threshold or zero to revoke tokens immediately upon rotation.

```java
realm.setRefreshTokenMaxReuse(0);
```
