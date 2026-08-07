# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: security control integrity

## security control integrity

### Validate authentication flow binding overrides and policy evaluation modes for client configurations

**Use when**

When configuring client authentication flow overrides, defining client policies, or upgrading client configurations in Keycloak to ensure security controls remain correctly applied and do not fail open.

**Secure rules**

**Rule 1: Reference authentication flows that exist in the target realm**

When setting client authentication-flow binding overrides, use flow IDs that resolve to authentication flows in the client’s realm. Keycloak rejects client creation or updates when a non-empty override references an unresolved flow ID.

**Rule 2: Configure client policies with strict evaluation mode when all conditions associated with a policy must explicitly evaluate to true.**

By default, conditions returning 'abstain' are ignored during client policy evaluation. When defining critical client policies via JSON or Admin API, set the evaluation mode to `STRICT` so that all conditions must return 'yes' and none can be 'no' or 'abstain', preventing unauthorized requests from bypassing security rules.

```json
{
  "name": "strict-fapi-policy",
  "mode": "STRICT",
  "enabled": true,
  "conditions": [...],
  "profiles": ["fapi-1-advanced"]
}
```

**Rule 3: Bind custom security profiles and executors to active and enabled client policies.**

Client profiles defining security executors are only enforced when actively bound to an enabled client policy whose conditions match the target client. Always ensure that profiles containing security executors are linked to enabled policies matching target client conditions.

```java
ClientPoliciesBuilder policies = new ClientPoliciesBuilder().addPolicy(
    new ClientPolicyBuilder()
        .createPolicy("EnforceSecurityPolicy", "Enforces PKCE for clients", true)
        .addCondition(ClientRolesConditionFactory.PROVIDER_ID, createClientRolesConditionConfig(List.of("sample-client-role")))
        .addProfile("StrictSecurityProfile")
        .toRepresentation()
);
```
