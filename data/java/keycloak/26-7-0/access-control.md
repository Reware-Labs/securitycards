# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: access control

## access control

### Enforce Least Privilege and Scoped Authorization Policies for Administrative Operations

**Use when**

When developers and administrators are configuring permissions, assigning roles, or managing client access to ensure users and services only have access to required resources.

**Secure rules**

**Rule 1: Assign explicit fine-grained management permissions and roles instead of full administrative privileges.**

Scope management roles down to minimal required functions and restrict broad permissions like `manage-realm` to prevent unrestricted control over realm settings.

```json
"groups": [
  {
    "name": "DUA",
    "clientRoles": {
      "realm-management": ["query-groups", "query-clients", "query-users"]
    }
  }
]
```

**Rule 2: Enable policy enforcement mode to enforcing for client authorization settings.**

Ensure that `policyEnforcementMode` is explicitly configured to `ENFORCING` on authorization-enabled clients so that requests to protected resources are denied by default unless an authorization policy explicitly grants access.

```json
{
  "clientId": "test-app-authz",
  "authorizationSettings": {
    "allowRemoteResourceManagement": true,
    "policyEnforcementMode": "ENFORCING",
    "resources": [...]
  }
}
```


### Restrict Token Exchange and Client Scope Authorization Boundaries

**Use when**

When implementing OAuth2 token exchanges, configuring token grant requests, or assigning client scopes to prevent cross-client privilege escalation.

**Secure rules**

**Rule 1: Restrict token exchange execution exclusively to authorized confidential clients and target roles.**

Configure fine-grained admin authorization policies on target clients to explicitly whitelist which client IDs are permitted to invoke token exchange and enforce explicit client policy representations.

```java
ClientPolicyRepresentation exchangePolicyRep = new ClientPolicyRepresentation();
exchangePolicyRep.setName("allowed-exchangers");
exchangePolicyRep.addClient(authorizedClient.getId());
Policy policy = management.authz().getStoreFactory().getPolicyStore().create(server, exchangePolicyRep);
management.clients().exchangeToPermission(samlTargetClient).addAssociatedPolicy(policy);
```

**Rule 2: Disable full scope allowed on clients to limit token scope mappings.**

Set `fullScopeAllowed` to `false` on client configurations to ensure access tokens are limited strictly to explicitly assigned realm and client roles.

```json
{
  "clientId": "test-app-scope",
  "enabled": true,
  "fullScopeAllowed": false,
  "redirectUris": [
    "https://app.example.com/auth/callback"
  ]
}
```
