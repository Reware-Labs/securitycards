# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: cryptography

## cryptography

### Enforce Strong Signature Algorithms and Authenticated Encryption for SAML and OIDC

**Use when**

Configuring cryptographic signature algorithms, document encryption, and token verification settings for SAML and OIDC protocols.

**Secure rules**

**Rule 1: Enforce strong signature algorithms such as RSA-SHA256 instead of deprecated SHA-1 variants when signing SAML messages.**

Always explicitly configure signature algorithms to use `RSA_SHA256` or stronger digest variants when building signed SAML documents and client representations to prevent cryptographic signature forgery.

```java
BaseSAML2BindingBuilder builder = new BaseSAML2BindingBuilder()
    .signatureAlgorithm(SignatureAlgorithm.RSA_SHA256)
    .signWith(keyName, keyPair, cert)
    .signDocument();
```

**Rule 2: Use authenticated encryption algorithms like AES-GCM for SAML document encryption.**

Configure SAML encryption directly using authenticated encryption algorithms such as `XMLCipher.AES_256_GCM` rather than legacy or unauthenticated encryption modes to ensure message confidentiality and integrity.

```java
BaseSAML2BindingBuilder builder = new BaseSAML2BindingBuilder()
    .encryptionAlgorithm(org.apache.xml.security.encryption.XMLCipher.AES_256_GCM)
    .encrypt(recipientPublicKey);
```

**Rule 3: Require signed and encrypted UserInfo responses for sensitive OIDC claims.**

Configure OIDC client representation settings to enforce JWS signing and JWE encryption algorithms for UserInfo responses containing sensitive personally identifiable information.

```java
ClientResource clientResource = realm.clients().get(clientUuid);
ClientRepresentation clientRep = clientResource.toRepresentation();

OIDCAdvancedConfigWrapper config = OIDCAdvancedConfigWrapper.fromClientRepresentation(clientRep);
config.setUserInfoSignedResponseAlg("PS256");
config.setUserInfoEncryptedResponseAlg("RSA-OAEP-256");
config.setUserInfoEncryptedResponseEnc("A256GCM");
config.setUseJwksUrl(true);
config.setJwksUrl("https://client.example.com/jwks.json");

clientResource.update(clientRep);
```

**Rule 4: Enforce strict signature verification by disallowing the 'none' algorithm on client JWT decoding.**

When decoding client JWTs using TokenManager, explicitly set `allowNoneAlgorithm` to `false` to prevent unsigned tokens from bypassing cryptographic verification.

```java
MyTokenRepresentation token = tokenManager.decodeClientJWT(
    jwtString,
    clientModel,
    (jose, client) -> {
        // Perform required header/claim assertions
    },
    MyTokenRepresentation.class,
    false // Do not allow 'none' algorithm
);
```


### Maintain Robust Password Hashing Policies

**Use when**

Configuring realm password hashing algorithms and iteration counts to protect stored credentials against offline brute-force attacks.

**Secure rules**

**Rule 1: Maintain OWASP-aligned password hashing algorithms and iteration counts.**

Use `pbkdf2-sha512` as the default password hashing algorithm with strong iteration counts and avoid lowering iteration counts or using weaker digest algorithms in realm password policies.
