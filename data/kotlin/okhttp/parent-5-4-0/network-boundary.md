# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: network boundary

## network boundary

### Restrict insecure host TLS overrides to non-production environments

**Use when**

Configuring TLS client certificates and custom handshake settings for OkHttp during local development or test setups.

**Secure rules**

**Rule 1: Restrict insecure host TLS overrides to private development and test environments**

Use `HandshakeCertificates.Builder().addInsecureHost()` only in private development environments and only to carry test data. This configuration disables server authentication for the listed hosts, making the connection vulnerable to man-in-the-middle attacks, and is intended for testing against localhost or other development setups where a certificate authority is not available.

```kotlin
val clientCertificates = HandshakeCertificates.Builder()
    .addPlatformTrustedCertificates()
    .addInsecureHost("localhost")
    .build()

val client = OkHttpClient.Builder()
    .sslSocketFactory(clientCertificates.sslSocketFactory(), clientCertificates.trustManager)
    .build()
```
