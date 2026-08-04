# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: cryptography

## cryptography

### Configure TLS transport security, certificate pinning, and custom trust stores securely

**Use when**

Configuring transport layer security, validating server certificates, or setting up custom certificate authorities and pinning on `OkHttpClient`.

**Secure rules**

**Rule 1: Enforce public key pinning using `CertificatePinner` to prevent man-in-the-middle attacks.**

Configure `OkHttpClient` with a `CertificatePinner` to enforce SHA-256 public key pinning against specific target hostnames. Handle any resulting `SSLPeerUnverifiedException` errors securely without bypassing verification.

```kotlin
val certificatePinner = CertificatePinner.Builder()
  .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
  .build()

val client = okHttpClient.newBuilder()
  .certificatePinner(certificatePinner)
  .build()
```

**Rule 2: Configure both custom `SSLSocketFactory` and `X509TrustManager` on `OkHttpClient.Builder`.**

Pass both the custom `SSLSocketFactory` and the corresponding `X509TrustManager` to `OkHttpClient.Builder.sslSocketFactory()` to ensure correct certificate chain validation and trust verification.

```java
X509TrustManager trustManager = trustManagerForCertificates(trustedCertificatesInputStream());
SSLContext sslContext = SSLContext.getInstance("TLS");
sslContext.init(null, new TrustManager[] { trustManager }, null);

OkHttpClient client = new OkHttpClient.Builder()
    .sslSocketFactory(sslContext.getSocketFactory(), trustManager)
    .build();
```

**Rule 3: Load platform trusted root certificate authorities explicitly when initializing `HandshakeCertificates`.**

Call `.addPlatformTrustedCertificates()` on `HandshakeCertificates.Builder()` to include standard system default root certificate authorities into the trust manager for public TLS validation.

```kotlin
val handshakeCertificates = HandshakeCertificates.Builder()
  .addPlatformTrustedCertificates()
  .addTrustedCertificate(customPrivateRootCert)
  .build()

val client = OkHttpClient.Builder()
  .sslSocketFactory(handshakeCertificates.sslSocketFactory(), handshakeCertificates.trustManager)
  .build()
```

**Rule 4: Select robust public key algorithms for generated certificates.**

Use robust public key algorithms such as `ecdsa256()` or `rsa2048()` when creating runtime or test certificates via `HeldCertificate.Builder`, avoiding legacy or weak key lengths and hashing algorithms.

```kotlin
val heldCertificate = HeldCertificate.Builder()
  .commonName("localhost")
  .addSubjectAlternativeName("127.0.0.1")
  .ecdsa256()
  .build()
```

**Rule 5: Explicitly configure cryptographic settings including `SSLSocketFactory`, `HostnameVerifier`, and `ConnectionSpecs` on `OkHttpClient`.**

Rely on explicit client configuration for `OkHttpClient` rather than relying on URLs alone to ensure specific TLS versions, trusted certificate authorities, and hostname verification logic are enforced.

```java
OkHttpClient client = new OkHttpClient.Builder()
    .sslSocketFactory(sslSocketFactory, trustManager)
    .hostnameVerifier(hostnameVerifier)
    .connectionSpecs(Collections.singletonList(ConnectionSpec.MODERN_TLS))
    .build();
```
