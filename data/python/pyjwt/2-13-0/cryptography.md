# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: cryptography

## cryptography

### Enforce Minimum Key Lengths and Validate Signature Formats for Cryptographic Operations

**Use when**

Verifying cryptographic signatures and handling key parameters during token processing

**Secure rules**

**Rule 1: Enforce minimum cryptographic key lengths during token verification to prevent weak keys**

Pass `enforce_minimum_key_length=True` in decode options to strictly reject undersized keys and ensure signing keys meet standard length requirements like at least 32 bytes for `HS256`.

```python
STRONG_SECRET = b"a_very_secret_key_that_is_at_least_32_bytes_long!"
token = jwt.encode({"sub": "1234567890"}, STRONG_SECRET, algorithm="HS256")
payload = jwt.decode(
    token,
    STRONG_SECRET,
    algorithms=["HS256"],
    options={"enforce_minimum_key_length": True}
)
```

**Rule 2: Validate Elliptic Curve signature format and byte length before conversion**

Use `raw_to_der_signature` and `der_to_raw_signature` while supplying the matching EllipticCurve instance to strictly validate that input raw signature lengths match expected curve byte sizes.

```python
from cryptography.hazmat.primitives.asymmetric import ec
from jwt.utils import der_to_raw_signature, raw_to_der_signature

curve = ec.SECP256R1()
raw_sig = der_to_raw_signature(der_signature_bytes, curve)
assert len(raw_sig) == 64
der_sig = raw_to_der_signature(raw_sig, curve)
```
