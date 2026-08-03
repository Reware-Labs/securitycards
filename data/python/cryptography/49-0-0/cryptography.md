# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: cryptography

## cryptography

### Generate Cryptographic Keys with Secure Random Generators

**Use when**

Generating secure cryptographic keys, salts, and nonces for encryption, MACs, or key derivation.

**Secure rules**

**Rule 1: Generate cryptographic keys with the library's cryptographically secure random generator.**

Use cryptographically secure functions like `os.urandom` or key generation methods provided by primitives to generate high-entropy keys, nonces, and salts. Avoid predictable or sequential values.

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)
aesgcm = AESGCM(key)
nonce = os.urandom(12)
ciphertext = aesgcm.encrypt(nonce, b"secret message", None)
```


### Hash Passwords and Derive Keys Securely

**Use when**

Deriving cryptographic keys from passwords or hashing passwords for secure storage.

**Secure rules**

**Rule 1: Derive cryptographic keys and store passwords using memory-hard KDFs with secure random salts.**

When deriving keys or hashing passwords, use modern key derivation functions such as `Argon2id`, `PBKDF2HMAC`, or `Scrypt` paired with a unique cryptographically random salt of at least 16 bytes. Ensure iteration counts and memory parameters are sufficiently high to resist brute-force attacks.

```python
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

salt = os.urandom(16)
kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    iterations=1_200_000,
)
key = kdf.derive(b"user_password")
```


### Use Authenticated Encryption with Unique Nonces

**Use when**

Encrypting sensitive data and payloads using symmetric ciphers or AEAD primitives.

**Secure rules**

**Rule 1: Use authenticated encryption with a unique nonce for every encryption operation.**

Always prefer authenticated encryption recipes such as `Fernet` or AEAD primitives like `AESGCM` and `ChaCha20Poly1305` to provide confidentiality and integrity. Ensure that every nonce or initialization vector is unique for a given secret key and generated using a cryptographically secure random source such as `os.urandom`.

```python
import os
from cryptography.fernet import Fernet

key = Fernet.generate_key()
f = Fernet(key)
token = f.encrypt(b"a secret message")
plaintext = f.decrypt(token)
```


### Use Strong Asymmetric Key Sizes and Padding

**Use when**

Generating asymmetric key pairs and performing public-key encryption or digital signatures.

**Secure rules**

**Rule 1: Select secure key sizes and robust padding mechanisms for asymmetric operations.**

When generating RSA keys, select a key size of at least 2048 bits and set the public exponent to `65537`. Use `padding.PSS` for signatures and `padding.OAEP` for encryption, combined with secure hash algorithms like `SHA256`.

```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)
signature = private_key.sign(
    message,
    padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH
    ),
    hashes.SHA256()
)
```


### Verify Signatures and MACs Using Constant-Time Methods

**Use when**

Verifying digital signatures, message authentication codes (MACs), or derived key values.

**Secure rules**

**Rule 1: Perform constant-time verification using library verification methods rather than standard equality operators**

Always use built-in verification methods such as `verify()` on HMAC instances to check authentication codes, or `.verify()` on KDF instances to compare derived secrets (KDFs raise `InvalidKey`, not `InvalidSignature`, on mismatch). Avoid manual comparisons with standard equality operators to prevent timing side-channel attacks.

```python
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, hmac

h = hmac.HMAC(key, hashes.SHA256())
h.update(b"message to authenticate")
try:
    h.verify(signature_to_check)
except InvalidSignature:
    pass
```
