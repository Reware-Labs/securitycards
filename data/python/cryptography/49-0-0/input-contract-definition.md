# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: input contract definition

## input contract definition

### Validate cryptographic input parameters, ranges, and structures before processing

**Use when**

When constructing cryptographic primitives, key derivation functions, certificates, and tokens that require strict input validation, parameter bounds checking, type validation, and allowed value constraints.

**Secure rules**

**Rule 1: Validate BasicConstraints path length and ca flag settings**

Set `path_length` to `None` whenever `ca` is set to `False` when constructing an `x509.BasicConstraints` extension. Setting a path length on a non-CA certificate violates certificate profile rules and raises a `ValueError`.

```python
from cryptography import x509

end_entity_bc = x509.BasicConstraints(ca=False, path_length=None)
ca_bc = x509.BasicConstraints(ca=True, path_length=1)
```

**Rule 2: Ensure valid combinations of PKCS7 options and encoding formats**

Pass valid combinations of `PKCS7Options` and `Encoding` when signing or encrypting PKCS7 data to prevent conflicting option errors and runtime `ValueError` exceptions.

```python
from cryptography.hazmat.primitives.serialization import pkcs7, Encoding
from cryptography.hazmat.primitives import hashes

builder = (
    pkcs7.PKCS7SignatureBuilder()
    .set_data(b"Hello world")
    .add_signer(signer_cert, private_key, hashes.SHA256())
)
signed_smime = builder.sign(
    Encoding.SMIME,
    [pkcs7.PKCS7Options.Text, pkcs7.PKCS7Options.DetachedSignature]
)
```

**Rule 3: Validate KDF cost parameters and handle backend restrictions**

Enforce strict parameter bounds and power-of-2 requirements for key derivation functions like Scrypt and Argon2 before derivation, and handle potential `UnsupportedAlgorithm` exceptions in restricted environments.

```python
from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
import os

try:
    salt = os.urandom(16)
    kdf = Scrypt(salt=salt, length=32, n=16384, r=8, p=1)
    key = kdf.derive(b"user_secret")
except UnsupportedAlgorithm:
    raise RuntimeError("Scrypt is not supported under the active cryptographic backend")
```

**Rule 4: Enforce length limits on domain separation context strings**

Ensure that context strings supplied to ML-DSA signing or verification functions (e.g., `MLDSA44PrivateKey.sign()`) do not exceed the maximum allowed length of 255 bytes to prevent `ValueError` exceptions.

```python
context = b"app-domain-v1"
if len(context) <= 255:
    signature = private_key.sign(data, context=context)
else:
    raise ValueError("Context string exceeds the 255-byte limit.")
```

**Rule 5: Enforce strict key lengths and serialization formats for Ed25519**

Validate raw Ed25519 key inputs to ensure they are exactly 32 bytes and match the expected serialization format options to prevent `ValueError` exceptions during key loading.

```python
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519

def load_raw_private_key(key_bytes: bytes) -> ed25519.Ed25519PrivateKey:
    if len(key_bytes) != 32:
        raise ValueError("Ed25519 private key must be exactly 32 bytes")
    return ed25519.Ed25519PrivateKey.from_private_bytes(key_bytes)
```

**Rule 6: Match hash digest lengths when constructing OCSP identifiers by hash**

Ensure that issuer name and key hashes match the exact digest byte length of the supplied algorithm and that an accepted algorithm is used when constructing OCSP requests or responses by hash.

```python
algorithm = hashes.SHA256()
builder = OCSPRequestBuilder()
builder = builder.add_certificate_by_hash(
    issuer_name_hash=issuer_name_digest_256_bytes,
    issuer_key_hash=issuer_key_digest_256_bytes,
    serial_number=cert.serial_number,
    algorithm=algorithm
)
```

**Rule 7: Select key wrap functions based on key alignment constraints**

Ensure wrapping keys are 16, 24, or 32 bytes and use `aes_key_wrap_with_padding` for keys of arbitrary or unaligned lengths to satisfy block alignment rules and avoid `ValueError` exceptions.

```python
from cryptography.hazmat.primitives.keywrap import aes_key_wrap_with_padding, aes_key_unwrap_with_padding

wrapping_key = b"0123456789abcdef0123456789abcdef"
secret_key = b"short_secret_data_30_bytes_!!"

wrapped = aes_key_wrap_with_padding(wrapping_key, secret_key)
unwrapped = aes_key_unwrap_with_padding(wrapping_key, wrapped)
```

**Rule 8: Explicitly encode passwords and salts to byte sequences**

Ensure passwords and salts passed to KDF functions are explicitly encoded to bytes using a fixed encoding scheme such as UTF-8 to prevent `TypeError` exceptions.

```python
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

salt = os.urandom(16)
password_bytes = raw_password_str.encode('utf-8')

kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    iterations=600000,
)
derived_key = kdf.derive(password_bytes)
```
