# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: security control integrity

## security control integrity

### Configure Throttled Commit Strategy and Unprocessed Record Max Age for Kafka Streams

**Use when**

Configuring incoming Kafka messaging consumers in Quarkus to protect against resource exhaustion caused by unacknowledged records.

**Secure rules**

**Rule 1: Maintain a positive max age threshold for throttled offset commits to prevent unbounded memory accumulation.**

When using the `throttled` commit strategy in the Kafka connector, ensure `throttled.unprocessed-record-max-age.ms` remains set to a positive value such as `60000`. Never disable this health check by setting the value to less than or equal to zero, as unacknowledged poison pill records could otherwise stall offset commits indefinitely and lead to application resource exhaustion.

```properties
mp.messaging.incoming.prices.throttled.unprocessed-record-max-age.ms=60000
```


### Maintain Consistent State and Fail Closed When Access Tokens and Role Sources Depend on Preservation

**Use when**

Configuring OIDC tenant authorization and token state manager strategies where role validation or UserInfo lookups depend on retained access tokens.

**Secure rules**

**Rule 1: Ensure the token state manager strategy retains access tokens when token-based role sources or UserInfo requirements are enabled.**

When configuring OIDC tenant authorization with `quarkus.oidc.roles.source` set to `accesstoken` or `userinfo`, you must configure `quarkus.oidc.token-state-manager.strategy` to retain all tokens (such as `keep-all-tokens`). Discarding tokens prevents subsequent authorization checks and security control enforcement from functioning correctly.

```properties
quarkus.oidc.roles.source=accesstoken
quarkus.oidc.token-state-manager.strategy=keep-all-tokens
```
