# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: security control integrity

## security control integrity

### Handle Verification and Authentication Errors Explicitly to Fail Closed

**Use when**

Implementing error handling for cryptographic verification functions such as token verification or AEAD decryption where failures must fail closed.

**Secure rules**

**Rule 1: Catch authentication and verification exceptions explicitly and fail closed when verification fails.**

When validating tokens or decrypting payloads using primitives that raise verification errors, explicitly wrap the calls in `try...except` blocks capturing exceptions such as `InvalidToken` or `InvalidTag`. Treat these caught exceptions as authentication or verification failures to prevent invalid states from bypassing security checks.

```python
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305

try:
    plaintext = chacha.decrypt(nonce, ciphertext, associated_data)
except InvalidTag:
    raise ValueError("Data authentication failed")
```

**Rule 2: Handle verification errors during X.509 certificate chain validation to ensure proper control flow.**

Always wrap certificate validation operations in explicit error handling catching `VerificationError` to securely reject untrusted or malformed chains without crashing or bypassing verification paths.

```python
import datetime
from cryptography import x509
from cryptography.x509.verification import PolicyBuilder, Store, VerificationError

def verify_peer_server_certificate(trusted_certs, untrusted_intermediates, leaf_cert, expected_hostname):
    store = Store(trusted_certs)
    builder = (
        PolicyBuilder()
        .store(store)
        .time(datetime.datetime.now(datetime.timezone.utc))
        .max_chain_depth(5)
    )
    verifier = builder.build_server_verifier(x509.DNSName(expected_hostname))
    try:
        verified_chain = verifier.verify(leaf_cert, untrusted_intermediates)
        return verified_chain
    except VerificationError:
        raise SecurityError('TLS peer certificate verification failed')
```
