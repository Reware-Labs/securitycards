# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: cryptography

## cryptography

### Configure Secure Cryptographic Primitives and Algorithms for SAML and JWT

**Use when**

Configuring cryptographic signature verification, message signing, and encryption for SAML 2.0 components and OAuth 2.0 JWT tokens.

**Secure rules**

**Rule 1: Enforce strict SHA-256 or stronger algorithms for SAML message signing and digest creation.**

Ensure OpenSAML is initialized via `OpenSamlInitializationService.initialize()` before constructing or signing SAML 2.0 objects, and configure `SignatureSigningParameters` with explicit SHA-256 signature and digest algorithms to prevent signature forgery.

```java
OpenSamlInitializationService.initialize();

SignatureSigningParameters parameters = new SignatureSigningParameters();
parameters.setSigningCredential(signingCredential);
parameters.setSignatureAlgorithm(SignatureConstants.ALGO_ID_SIGNATURE_RSA_SHA256);
parameters.setSignatureReferenceDigestMethod(SignatureConstants.ALGO_ID_DIGEST_SHA256);
parameters.setSignatureCanonicalizationAlgorithm(SignatureConstants.ALGO_ID_C14N_EXCL_OMIT_COMMENTS);
SignatureSupport.signObject(signableObject, parameters);
```

**Rule 2: Explicitly configure allowed JWS signature algorithms for JWT decoders.**

Explicitly configure the allowed JWS signature algorithms such as `RS256` or `RS512` for JWT verification through application configuration or decoder builders to prevent algorithm switching attacks.

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jws-algorithms: RS512
          jwk-set-uri: https://idp.example.org/.well-known/jwks.json
```

**Rule 3: Ensure symmetric secret keys meet minimum length requirements for HMAC signing.**

When instantiating `NimbusJwtEncoder` using `NimbusJwtEncoder.withSecretKey(secretKey)`, ensure the provided `SecretKey` meets the minimum key length requirement of 256 bits for `HS256` to prevent offline brute-force attacks.

```java
SecretKey secretKey = new javax.crypto.spec.SecretKeySpec(secretBytes, "HmacSHA256");
JwtEncoder jwtEncoder = NimbusJwtEncoder.withSecretKey(secretKey)
    .algorithm(MacAlgorithm.HS256)
    .build();
```


### Use Authenticated Encryption and Secure Password Hashing Work Factors

**Use when**

Implementing authenticated encryption for sensitive payloads or configuring adaptive password hashing and token encryption services.

**Secure rules**

**Rule 1: Construct `AesBytesEncryptor` explicitly with GCM mode and a secure random IV generator.**

Construct `AesBytesEncryptor` explicitly with `CipherAlgorithm.GCM` and a secure random IV generator to avoid static zero-filled initialization vectors and ensure ciphertext integrity.

```java
BytesKeyGenerator ivGenerator = KeyGenerators.secureRandom(16);
AesBytesEncryptor encryptor = new AesBytesEncryptor(password, salt, ivGenerator, AesBytesEncryptor.CipherAlgorithm.GCM);
```

**Rule 2: Tune adaptive password encoder work factors to achieve target verification duration.**

When configuring adaptive password encoders such as `BCryptPasswordEncoder`, tune the work factor parameters so password verification takes approximately one second on the host system to resist offline brute-force attacks.

```java
PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(12);
```

**Rule 3: Explicitly specify SHA-256 for remember-me signature calculations.**

Ensure `TokenBasedRememberMeServices` uses SHA-256 for encoding signatures rather than legacy MD5 digest algorithms by setting the matching algorithm explicitly.

```java
TokenBasedRememberMeServices rememberMeServices = new TokenBasedRememberMeServices(
    "secureSecretKey",
    userDetailsService,
    TokenBasedRememberMeServices.RememberMeTokenAlgorithm.SHA256
);
rememberMeServices.setMatchingAlgorithm(TokenBasedRememberMeServices.RememberMeTokenAlgorithm.SHA256);
```
