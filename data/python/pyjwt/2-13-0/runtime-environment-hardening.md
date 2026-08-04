# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: runtime environment hardening

## runtime environment hardening

### Ensure Cryptography Dependency is Installed for Asymmetric JWK Processing

**Use when**

Configuring the production runtime and deployment environment to support asymmetric token verification via `PyJWK` or `PyJWKSet`.

**Secure rules**

**Rule 1: Verify that the optional cryptography package is installed in the deployment environment when handling asymmetric tokens.**

Processing asymmetric keys such as RSA, EC, or OKP requires the optional `cryptography` library. Ensure `pyjwt[crypto]` is installed in application deployment environments that handle asymmetric tokens, and handle `MissingCryptographyError` appropriately during runtime initialization to prevent unhandled exceptions.

```python
# Install dependency via: pip install 'pyjwt[crypto]'
from jwt import PyJWKSet
from jwt.exceptions import MissingCryptographyError

try:
    jwk_set = PyJWKSet.from_dict(jwk_data)
except MissingCryptographyError as e:
    raise SystemExit("cryptography package is required for JWK verification") from e
```
