# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: secret handling

## secret handling

### Encrypt Private Keys and Symmetric Secrets During Storage and Serialization

**Use when**

Serializing private keys, certificates, or handling sensitive secrets in storage or configuration.

**Secure rules**

**Rule 1: Protect serialized private keys using password encryption.**

When serializing private keys using `private_bytes()`, always supply a secure key serialization encryption algorithm such as `serialization.BestAvailableEncryption` with a strong, non-empty passphrase. Avoid exporting unencrypted keys or seeds into persistent storage or configuration.

```python
from cryptography.hazmat.primitives import serialization

pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.BestAvailableEncryption(b'strong_password')
)
```

**Rule 2: Generate cryptographically secure keys and passwords for secret storage.**

Ensure secret keys and symmetric credentials are generated using cryptographically secure random sources or dedicated generation methods like `generate_key()` rather than hardcoded values.

```python
from cryptography.fernet import Fernet

key = Fernet.generate_key()
f = Fernet(key)

token = f.encrypt(b"my deep dark secret")
plaintext = f.decrypt(token)
```
