# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: configuration source integrity

## configuration source integrity

### Verify OkHttp dependency artifacts using published PGP signing keys

**Use when**

Configuring build tools and dependency verification metadata for OkHttp artifacts to ensure configuration and supply-chain integrity.

**Secure rules**

**Rule 1: Enforce automated dependency signature verification in build scripts against official release signing keys.**

Verify downloaded OkHttp dependency artifacts and binaries using Gradle automated dependency signature verification against Square's published signing key to prevent compromised binaries from being included in client applications.

```bash
./gradlew --write-verification-metadata pgp,sha256 help
```
