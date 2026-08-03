# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`
Category: input contract definition

## input contract definition

### Enforce Required Claims During Token Decoding

**Use when**

When validating incoming JSON Web Tokens using jwt.decode to ensure essential payload claims are present.

**Secure rules**

**Rule 1: Mandate critical claims by specifying them in the require option**

Pass a list of required claims in the `options` dictionary under the `require` key when calling `jwt.decode()` to ensure that tokens omitting necessary fields like `exp`, `iss`, or `aud` are rejected.

```python
import jwt

# Secure: enforce that essential claims exist in the token
payload = jwt.decode(
    token,
    key=public_key,
    algorithms=["RS256"],
    options={"require": ["exp", "iss", "aud"]},
    audience="https://api.example.com",
    issuer="https://auth.example.com"
)
```
