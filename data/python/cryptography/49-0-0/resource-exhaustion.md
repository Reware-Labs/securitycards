# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: resource exhaustion

## resource exhaustion

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
