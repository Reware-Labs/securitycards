# Security cards

Repository: `https://github.com/pyca/cryptography#49.0.0`
Category: input interpretation safety

## input interpretation safety

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
