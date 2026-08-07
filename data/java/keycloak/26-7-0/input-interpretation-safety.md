# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: input interpretation safety

## input interpretation safety

### Register Authorization Detail Parsers for OID4VC Rich Authorization Requests

**Use when**

When implementing OAuth 2.0 or OID4VC credential issuance workflows requiring parsing and validation of Rich Authorization Requests.

**Secure rules**

**Rule 1: Register the dedicated authorization detail parser for OID4VC requests.**

Register `OID4VCAuthorizationDetailsParser` with `AuthorizationDetailsParser` under the `openid_credential` type to ensure incoming authorization detail objects are correctly parsed and validated during OID4VC credential issuance.

```java
AuthorizationDetailsParser.registerParser(
    OID4VCConstants.OPENID_CREDENTIAL,
    new OID4VCAuthorizationDetailsParser()
);
```
