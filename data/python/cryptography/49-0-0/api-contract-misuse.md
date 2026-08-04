# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: api contract misuse

## api contract misuse

### Adhere to Strict API Contract and Buffer Size Requirements

**Use when**

When calling cryptographic primitives, encryption/decryption methods, key serialization, or integer-to-bytes conversions that require exact parameter types, correct argument counts, matching buffer sizes, and proper lifecycle calls.

**Secure rules**

**Rule 1: Provide positive byte lengths and validate output buffer dimensions when serializing integers or calling AEAD in-place methods**

Ensure that the `length` argument passed to `int.to_bytes()` is a positive integer greater than zero. When using in-place operations like `encrypt_into` or `decrypt_into`, allocate buffers matching the exact required payload and tag dimensions to prevent runtime errors.

```python
val = 123
length = 4
if length > 0:
    raw_bytes = val.to_bytes(length, byteorder="big")
```

**Rule 2: Supply matching key types and distinct key halves for cipher and KEM suites.**

When configuring cipher modes like AES-XTS or HPKE suites, supply distinct key halves and matching key types as required by the API contract. Ensure tag lengths and input block sizes conform strictly to algorithm requirements.

```python
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.hpke import Suite, KEM, KDF, AEAD
from cryptography.hazmat.primitives.asymmetric import x25519

suite = Suite(KEM.X25519, KDF.HKDF_SHA256, AEAD.AES_128_GCM)
private_key = x25519.X25519PrivateKey.generate()
public_key = private_key.public_key()

ciphertext = suite.encrypt(b"payload", public_key, info=b"app info")

try:
    plaintext = suite.decrypt(ciphertext, private_key, info=b"app info")
except InvalidTag:
    pass
```

**Rule 3: Instantiate a fresh KDF object for each derivation or verification call.**

Key Derivation Function classes enforce a single-use lifecycle state contract. Always instantiate a new KDF instance for every individual derivation or verification operation to avoid `AlreadyFinalized` exceptions.

```python
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def derive_key(password: bytes, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600_000,
    )
    return kdf.derive(password)
```

**Rule 4: Validate elliptic curve public numbers and ML-KEM payload lengths before cryptographic operations.**

Ensure that raw public numbers or untrusted ciphertext buffers are properly validated for correct length and valid curve points before passing them into cryptographic routines.

```python
from cryptography.hazmat.primitives.asymmetric import mlkem

def safe_decapsulate_768(private_key: mlkem.MLKEM768PrivateKey, ciphertext: bytes) -> bytes:
    if len(ciphertext) != 1088:
        raise ValueError("Invalid ciphertext length for ML-KEM-768")
    try:
        return private_key.decapsulate(ciphertext)
    except ValueError:
        raise ValueError("Decapsulation failed due to malformed ciphertext")
```
