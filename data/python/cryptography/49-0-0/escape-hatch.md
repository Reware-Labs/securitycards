# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: escape hatch

## escape hatch

### Prevent bypassing RSA private key validation during deserialization

**Use when**

Deserializing RSA private keys from user-supplied or untrusted input sources using serialization functions.

**Secure rules**

**Rule 1: Always keep RSA private key validation enabled by leaving unsafe_skip_rsa_key_validation set to False**

When loading PEM private keys, avoid setting `unsafe_skip_rsa_key_validation=True`. Leaving validation enabled ensures that OpenSSL thoroughly checks key structures and mathematical relationships, preventing malformed keys from triggering crashes, hangs, or memory safety issues.

```python
from cryptography.hazmat.primitives.serialization import load_pem_private_key

key = load_pem_private_key(
    pem_data,
    password=b"secret",
    unsafe_skip_rsa_key_validation=False
)
```
