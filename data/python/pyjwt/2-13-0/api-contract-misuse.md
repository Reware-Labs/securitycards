# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: api contract misuse

## api contract misuse

### Verify Token Signatures After Inspecting Headers or Fetching Keys

**Use when**

Calling `jwt.get_unverified_header()` or `PyJWKClient.get_signing_key_from_jwt()` to inspect header metadata or retrieve a signing key before processing a JSON Web Token.

**Secure rules**

**Rule 1: Perform full signature verification using jwt.decode after retrieving keys or inspecting unverified headers.**

Always treat header fields extracted via `jwt.get_unverified_header()` or keys fetched via `PyJWKClient.get_signing_key_from_jwt()` as untrusted until cryptographic signature verification successfully completes. Ensure that `jwt.decode()` is called with the verified key and required algorithms to prevent accepting tampered tokens.

```python
import jwt
from jwt.jwks_client import PyJWKClient

jwks_client = PyJWKClient("https://auth.example.com/.well-known/jwks.json")
signing_key = jwks_client.get_signing_key_from_jwt(token)

payload = jwt.decode(
    token,
    key=signing_key.key,
    algorithms=["RS256"]
)
```
