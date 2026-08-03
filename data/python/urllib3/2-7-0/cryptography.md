# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: cryptography

## cryptography

### Verify Server Certificate Fingerprints Securely with SHA-256

**Use when**

When pinning server certificates to validate peer identity and prevent timing side-channel attacks.

**Secure rules**

**Rule 1: Use SHA-256 hashes and constant-time comparison when validating certificate fingerprints.**

Supply a 64-character SHA-256 hex string rather than legacy hashes when calling `assert_fingerprint()` to ensure constant-time digest comparison.

```python
from urllib3.util.ssl_ import assert_fingerprint

cert_bytes = ssl_socket.getpeercert(binary_form=True)
sha256_fingerprint = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
assert_fingerprint(cert_bytes, sha256_fingerprint)
```
