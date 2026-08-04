# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: memory safety

## memory safety

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
