# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: api contract misuse

## api contract misuse

### Supply Matched Credential Body Types to Specific Credential Signers

**Use when**

Developing credential issuance workflows where verifiable credentials must be signed using specific credential body objects and signers.

**Secure rules**

**Rule 1: Pass correctly formatted credential body objects to the corresponding signer API.**

Ensure that you pass correctly formatted `SdJwtCredentialBody` objects to `SdJwtCredentialSigner`. Passing mismatched credential structures like Linked Data `LDCredentialBody` objects into the SD-JWT signer triggers a `CredentialSignerException` and can lead to validation failures or unhashed disclosures.

```java
SdJwtCredentialBody body = new SdJwtCredentialBuilder()
        .buildCredentialBody(verifiableCredential, credentialBuildConfig);

SdJwtCredentialSigner signer = new SdJwtCredentialSigner(session);
String signedSdJwt = signer.signCredential(body, credentialBuildConfig);
```
