# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: input contract definition

## input contract definition

### Enforce Strict Parameter Types and Length Limits on Request Parameters and Attributes

**Use when**

When defining parameterized scopes, configuring user profile attributes, or setting OIDC token endpoint request parameter constraints in Keycloak.

**Secure rules**

**Rule 1: Define explicit parameter types and strict regular expressions for all parameterized scope definitions.**

When defining parameterized scopes in client settings, select a concrete built-in parameter type or set a custom parameter type with a strict regular expression to enforce request-time parameter validation before issuing tokens.

**Rule 2: Configure upper bounds on incoming OIDC standard request parameter lengths.**

Set parameter length restrictions in `conf/keycloak.conf` or via command-line arguments such as `req-params-default-max-size` and `spi-login-protocol-openid-connect-req-params-max-size-login-hint` to prevent excessive memory pressure or input interpretation behavior.

```bash
req-params-default-max-size=4000
spi-login-protocol-openid-connect-req-params-max-size-login-hint=255
```

**Rule 3: Disable unmanaged attributes and enforce strict length validations on managed user profile attributes.**

In the Keycloak Admin Console, disable unmanaged attributes or restrict them to administrators, and configure strict length restrictions using the validator configuration JSON for user profile attributes.

```json
{
  "name": "customAttribute",
  "validations": {
    "length": {
      "max": 255
    }
  }
}
```
