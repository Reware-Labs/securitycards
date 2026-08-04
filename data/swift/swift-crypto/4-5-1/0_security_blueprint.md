# Security blueprint

Repository: `https://github.com/apple/swift-crypto#4.5.1`

## Security posture

When working with Apple CryptoKit, developers must assume a strict security model focused on confidentiality, data integrity, and deterministic cryptographic safety. The library protects sensitive payloads by default using authenticated encryption primitives and secure memory containers, but it does not protect against improper parameter selection, nonce reuse, or insecure downstream secret management. Security-sensitive surfaces include key derivation, hybrid public-key encryption endpoints, and low-level ASN.1 or cryptographic input boundaries, all of which should fail closed when parameters, byte lengths, or authentication tags are invalid.

## Essential implementation rules

1. **Configure Identical Ciphersuites and Authenticated Modes for HPKE**

Bind shared session metadata into a consistent info object and supply identical configuration settings, ciphersuites, and modes to both sender and recipient endpoints. Initialize `HPKE.Recipient` using authenticated modes and provide the sender's public key via the `authenticatedBy` parameter, while avoiding AEAD property introspection or decryption on export-only ciphersuites.

2. **Manage Hash Lifecycles and Domain-Separated Signatures**

Discard streaming hash function instances immediately after calling `finalize()` and initialize a new hash function instance for subsequent operations. Provide explicit context parameters when signing or verifying messages across specific domain boundaries using post-quantum MLDSA or standard signature APIs to prevent signature reuse and replay attacks.

3. **Validate Sealed Box Parameters and Handle Authentication Errors**

Handle authentication and decryption errors thrown by `ChaChaPoly.open` and `AES.GCM.open` explicitly, verifying that authentication tags are exactly 16 bytes and combined data meets required byte lengths before trusting decrypted payloads.

4. **Restrict Directory Paths and Avoid Unsupported CRL Flags**

Supply explicit, trusted certificate directory paths and file-type constants to lookup functions rather than relying on `SSL_CERT_DIR` or environment variable fallbacks. Avoid setting unsupported extended or delta CRL verification flags in verification parameters to prevent unconditional verification failures.

5. **Enforce Strong Work Factors and Memory Limits for Password Hashing**

When deriving keys with PBKDF2, specify secure hash functions like `.sha256` and enforce at least 210,000 iterations without bypassing thresholds. When using Scrypt, supply unique cryptographic salts alongside adequate cost parameters and explicit memory bounds to prevent uncontrolled resource exhaustion.

6. **Derive Symmetric Keys Using Cryptographic Key Derivation Functions**

Never use a `SharedSecret` directly as an encryption or MAC key; always derive a `SymmetricKey` using functions like `hkdfDerivedSymmetricKey` or `x963DerivedSymmetricKey`. Pass non-empty, unique salts and protocol-distinct `info` values to HKDF to prevent cross-context key reuse.

7. **Ensure Nonce Uniqueness and Cryptographic Key Randomness**

Omit explicit nonce parameters or use parameterless initializers such as `AES.GCM.Nonce()` to let CryptoKit automatically generate secure, random nonces for every encryption operation. Explicitly set `compactRepresentable` to `false` when instantiating P-256 private keys for FIPS-compliant environments.

8. **Use Authenticated Encryption and Keyed Message Authentication**

Wrap data in AEAD sealed boxes created by `AES.GCM` or `ChaChaPoly` when both confidentiality and tamper-resistance are required, and use keyed message authentication codes like HMAC instead of plain hash functions across untrusted boundaries.

9. **Strictly Validate ASN.1 Structures and Input Byte Lengths**

Catch ASN.1 parsing and GeneralizedTime initialization errors explicitly to ensure malformed timestamps and structures are safely rejected. Validate all incoming raw key representations, nonces, and tag byte lengths against strict sizing requirements before initialization to prevent runtime exceptions.

10. **Safely Handle Secret Material and Zeroize Memory**

Store sensitive derived shared secrets and keys within native CryptoKit containers backed by `SecureBytes` to leverage automated memory zeroization. Immediately zeroize passphrase memory and temporary key buffers after initializing encrypted keys or completing cryptographic tasks.
