# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: network boundary

## network boundary

### Restrict PyJWKClient URI parameters to http and https protocols

**Use when**

Instantiating `PyJWKClient` to fetch remote JSON Web Key Sets for token verification.

**Secure rules**

**Rule 1: Restrict JWKS URIs to http and https schemes**

Ensure that `PyJWKClient` is instantiated exclusively with `http` or `https` URLs. Pass only trusted HTTP(S) endpoints to prevent local file inclusion and server-side request forgery risks.

```python
from jwt import PyJWKClient

jwks_client = PyJWKClient("https://auth.example.com/.well-known/jwks.json")
signing_key = jwks_client.get_signing_key_from_jwt(token)
```
