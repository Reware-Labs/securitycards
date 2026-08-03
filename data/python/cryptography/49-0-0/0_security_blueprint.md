# Security blueprint

Repository: `https://github.com/pyca/cryptography#49.0.0`

## Security posture

Developers working with this cryptographic library must assume responsibility for strict API contracts, key lifecycle management, and secure parameter selection across all sensitive boundaries. The library provides robust cryptographic primitives and AEAD wrappers by default, but it does not protect against nonce reuse, weak random sources, insecure asymmetric parameters, or timing side-channel leaks. All verification failures, parsing exceptions, and authentication errors must fail closed to prevent invalid states from bypassing security controls.

## Essential implementation rules

1. **Adhere to strict API contract and buffer size requirements**

Provide positive byte lengths when calling `int.to_bytes()` and allocate exact payload and tag dimensions for in-place operations like `encrypt_into` or `decrypt_into`. Supply matching key types, distinct key halves for cipher suites, and ensure elliptic curve public numbers and ML-KEM payload lengths are validated prior to execution.

2. **Authenticate passwords and verify credentials securely**

Use `verify_phc_encoded()` or `verify()` to authenticate passwords against Argon2id digests, and explicitly catch `cryptography.exceptions.InvalidKey` to handle invalid credentials or malformed hash strings securely.

3. **Generate cryptographic keys with secure random generators**

Use cryptographically secure functions such as `os.urandom` or primitive-specific methods like `AESGCM.generate_key()` to create high-entropy keys, nonces, and salts. Avoid predictable, sequential, or hardcoded values.

4. **Hash passwords and derive keys using memory-hard KDFs**

Derive cryptographic keys and store passwords using memory-hard functions such as `Argon2id`, `PBKDF2HMAC`, or `Scrypt` paired with a unique random salt of at least 16 bytes and sufficiently high iteration counts. Explicitly encode passwords and salts to byte sequences using UTF-8.

5. **Use authenticated encryption with unique nonces**

Always prefer authenticated encryption recipes such as `Fernet` or AEAD primitives like `AESGCM` and `ChaCha20Poly1305`. Ensure every nonce or initialization vector is unique for a given secret key and generated using a cryptographically secure random source.

6. **Select strong asymmetric key sizes and robust padding mechanisms**

Generate RSA keys of at least 2048 bits with public exponent `65537`. Use `padding.PSS` combined with secure hash algorithms like `SHA256` for digital signatures and `padding.OAEP` for asymmetric encryption.

7. **Perform constant-time verification for signatures and MACs**

Use built-in verification methods such as `verify()` on HMAC or KDF instances to compare derived secrets and authentication codes. Avoid manual comparisons using standard equality operators to prevent timing side-channel attacks.

8. **Prevent bypassing RSA private key validation during deserialization**

Always keep RSA private key validation enabled by leaving `unsafe_skip_rsa_key_validation=False` when loading PEM private keys to ensure OpenSSL thoroughly checks key structures and mathematical relationships.

9. **Validate cryptographic input parameters, ranges, and structures**

Enforce strict parameter bounds, power-of-2 constraints for Scrypt/Argon2, length limits of 255 bytes for ML-DSA context strings, 32-byte key lengths for Ed25519, and matching digest byte lengths for OCSP identifiers.

10. **Catch parsing exceptions when decoding untrusted keys and payloads**

Wrap deserialization functions for keys, certificates, CRLs, OCSP requests, and signatures in `try...except` blocks capturing `ValueError`, `TypeError`, or `UnsupportedAlgorithm` to safely reject malformed structures.

11. **Pass immutable bytes-like objects to prevent concurrent mutation**

Pass immutable `bytes` objects rather than mutable buffers like `bytearray` to cryptographic APIs to prevent memory corruption and data races from concurrent thread modifications.

12. **Enforce input size limits on AEAD and Fernet payloads**

Restrict individual AEAD encryption and decryption payload sizes below two gigabytes to prevent `OverflowError` exceptions. Use Fernet exclusively for small payloads like tokens or cookies rather than large files to avoid memory exhaustion.

13. **Encrypt private keys and symmetric secrets during storage**

When serializing private keys using `private_bytes()`, always supply a secure encryption algorithm such as `serialization.BestAvailableEncryption` with a strong, non-empty passphrase. Avoid exporting unencrypted keys into persistent storage.

14. **Handle verification and authentication errors explicitly to fail closed**

Explicitly wrap token verification, AEAD decryption, and X.509 certificate chain validation calls in `try...except` blocks capturing exceptions such as `InvalidToken`, `InvalidTag`, or `VerificationError`. Treat these as failures to fail closed.

15. **Specify an explicit ttl parameter during Fernet token decryption**

Pass an explicit `ttl` parameter in seconds to `Fernet.decrypt()` whenever tokens represent time-sensitive session data to prevent intercepted tokens from remaining valid indefinitely.
