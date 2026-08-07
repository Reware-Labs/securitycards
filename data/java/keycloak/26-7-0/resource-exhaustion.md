# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: resource exhaustion

## resource exhaustion

### Enforce maximum payload inflation size limits for SAML messages

**Use when**

Parsing incoming deflated SAML HTTP-Redirect or POST bindings in Keycloak endpoints and adapters to prevent decompression bombs.

**Secure rules**

**Rule 1: Retain bounded decompression for SAML Redirect Binding messages**

Keep Keycloak's default 128 KB inflation limit unless larger legitimate SAML messages require a carefully selected higher bound. For the Keycloak server, configure the limit with the SAML login-protocol provider option; the `org.keycloak.adapters.saml.maxInflatingSize` system property applies specifically to the SAML Galleon feature pack on WildFly or EAP.

```bash
bin/kc.sh start --spi-login-protocol--saml--max-inflating-size=524288
```
