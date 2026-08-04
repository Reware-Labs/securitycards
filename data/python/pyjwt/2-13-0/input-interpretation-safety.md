# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: input interpretation safety

## input interpretation safety

### Prevent Algorithm Confusion by Restricting JWK Secret Formats

**Use when**

Parsing or configuring cryptographic keys from external JSON representations during token verification.

**Secure rules**

**Rule 1: Reject raw JWK-shaped JSON strings and asymmetric PEM keys as HMAC secrets to prevent algorithm confusion attacks.**

PyJWT 2.13.0 hardens key preparation by raising an `InvalidKeyError` when a JWK-shaped JSON string is supplied directly as an HMAC secret. Developers must use dedicated cryptographic parsing methods like `from_jwk` rather than passing raw JSON strings into secret parameters or `jwt.decode`.

```python
from jwt.algorithms import HMACAlgorithm

algo = HMACAlgorithm(HMACAlgorithm.SHA256)
key = algo.from_jwk(jwk_json_string)
```
