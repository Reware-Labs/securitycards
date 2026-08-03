# Security cards

Repository: `https://github.com/sqlalchemy/sqlalchemy#rel_2_0_51`
Category: cryptography

## cryptography

### Configure Robust Key Derivation and Encryption Parameters for Databases

**Use when**

Configuring database connection URLs with extensions like SQLCipher where encryption settings and key derivation iteration counts must be explicitly specified.

**Secure rules**

**Rule 1: Pass explicit encryption parameters and iteration counts in connection URLs to enforce strong cryptographic protection.**

When initializing database connections that support encryption, supply necessary parameters such as `kdf_iter`, `cipher`, `cipher_page_size`, and `cipher_use_hmac` through the connection URL to protect database files against offline brute-force attacks and avoid reliance on weak defaults.

```python
from sqlalchemy import create_engine

engine = create_engine(
    "sqlite+pysqlcipher://:passphrase@/encrypted.db?kdf_iter=256000&cipher_use_hmac=1"
)
```
