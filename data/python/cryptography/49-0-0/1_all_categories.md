# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`

## Category: api contract misuse

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


## Category: authentication

### Authenticate passwords and verify credentials securely

**Use when**

Verifying user passwords or credentials using password hashing and verification verifiers.

**Secure rules**

**Rule 1: Authenticate passwords using Argon2id verification methods and handle invalid credentials securely.**

Use `verify_phc_encoded()` or `verify()` to authenticate passwords against encoded Argon2 digests, and catch `cryptography.exceptions.InvalidKey` to detect incorrect credentials or malformed hash strings.

```python
from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id

def verify_user_password(password: bytes, encoded_phc: str) -> bool:
    try:
        Argon2id.verify_phc_encoded(password, encoded_phc)
        return True
    except InvalidKey:
        return False
```


## Category: cryptography

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


## Category: escape hatch

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


## Category: input contract definition

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


## Category: input interpretation safety

### Validate and handle parsing exceptions when decoding cryptographic keys and payloads

**Use when**

When loading untrusted asymmetric keys, signatures, certificates, CRLs, OCSP requests, or encoded points from external sources.

**Secure rules**

**Rule 1: Catch parsing exceptions when decoding untrusted keys, certificates, CRLs, OCSP requests, or signatures.**

Always wrap deserialization functions like `load_pem_private_key`, `load_der_x509_crl`, `load_ssh_public_key`, `ocsp.load_der_ocsp_request`, and `decode_dss_signature` in try-except blocks catching `ValueError`, `TypeError`, or `UnsupportedAlgorithm` to safely reject malformed structures, mismatched algorithms, or invalid parameters.

```python
from cryptography.exceptions import UnsupportedAlgorithm
from cryptography.hazmat.primitives.serialization import load_pem_private_key

try:
    key = load_pem_private_key(untrusted_pem_bytes, password=password_bytes)
except ValueError:
    raise ValueError("Key material is invalid or corrupted")
except UnsupportedAlgorithm:
    raise ValueError("Key algorithm or cipher is not supported")
```

**Rule 2: Perform explicit type and bounds verification on loaded cryptographic objects and components.**

Verify that deserialized keys match the expected class instance using `isinstance()` and validate elliptic curve point prefixes and numeric bounds when constructing keys from raw components to prevent bypasses or unexpected runtime errors.

```python
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import load_pem_private_key

key = load_pem_private_key(pem_data, password=None)
if not isinstance(key, rsa.RSAPrivateKey):
    raise TypeError("Expected an RSA private key")
```


## Category: memory safety

### Prevent Concurrent Buffer Mutation During Cryptographic Operations

**Use when**

Passing data buffers to `cryptography` methods where memory safety and data integrity must be maintained against concurrent modifications.

**Secure rules**

**Rule 1: Pass immutable bytes-like objects to cryptographic APIs to prevent memory corruption and data races from concurrent buffer mutation.**

Do not pass mutable bytes-like objects such as `bytearray` or custom buffer objects to `cryptography` methods if those buffers may be mutated concurrently by other execution threads or tasks. Instead, pass immutable `bytes` objects or strictly isolate mutable buffer instances so they cannot be altered during execution.

```python
data_to_encrypt = b"confidential data"
ciphertext = cipher.encrypt(data_to_encrypt)
```


## Category: resource exhaustion

### Enforce input size limits on AEAD and Fernet payloads to prevent memory exhaustion

**Use when**

Encrypting or decrypting large data streams, files, or buffers using AEAD or Fernet primitives.

**Secure rules**

**Rule 1: Validate and restrict individual encryption and decryption payload sizes below two gigabytes when using the AEAD backend.**

Ensure input buffer sizes or break large streams into smaller framed chunks prior to calling AEAD encrypt or decrypt methods to prevent unhandled `OverflowError` exceptions and denial of service.

**Rule 2: Avoid processing extremely large files or streams using Fernet to prevent out-of-memory errors.**

Use Fernet for small payloads like tokens or cookies rather than large files, because Fernet enforces integrity verification before exposing plaintext and requires holding the complete message payload in memory at once.

```python
from cryptography.fernet import Fernet

key = Fernet.generate_key()
f = Fernet(key)

small_payload = b"user_session_token_data"
token = f.encrypt(small_payload)
data = f.decrypt(token)
```


## Category: secret handling

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


## Category: security control integrity

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


## Category: session management

### Enforce Session Token Expiration with Fernet Decryption

**Use when**

When validating time-sensitive session state or transient session tokens using Fernet symmetric encryption.

**Secure rules**

**Rule 1: Specify an explicit ttl parameter during token decryption to enforce session expiration.**

Pass an explicit `ttl` parameter in seconds to `Fernet.decrypt()` whenever tokens represent time-sensitive session data. Omitting `ttl` or setting it to `None` causes tokens to remain valid indefinitely as long as the key is recognized, allowing intercepted tokens to be replayed.

```python
from cryptography.fernet import Fernet, InvalidToken

f = Fernet(key)
try:
    data = f.decrypt(token, ttl=300)
except InvalidToken:
    pass
```
