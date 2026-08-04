# Security cards

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`

## Category: api contract misuse

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


## Category: cryptography

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


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: network boundary

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


## Category: runtime environment hardening

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


## Category: secret handling

### Ensure non-empty secret keys are loaded for token operations

**Use when**

When loading secret keys and configuring authentication parameters prior to token signing or verification.

**Secure rules**

**Rule 1: Verify that secret keys are populated and non-empty from secure configuration sources before signing or verifying tokens.**

In PyJWT 2.13.0, passing empty string or byte secrets such as `''` or `b''` to HMAC key preparation raises an `InvalidKeyError`. Always ensure that secret keys are loaded correctly from environment variables or managed secret providers and checked before passing them to functions like `jwt.encode()` or `jwt.decode()`.

```python
import os
import jwt

secret_key = os.getenv("JWT_SECRET_KEY")
if not secret_key:
    raise ValueError("JWT_SECRET_KEY must be configured and non-empty")

token = jwt.encode({"sub": "user_123"}, secret_key, algorithm="HS256")
```


## Category: security control integrity

### Handle Token Validation Failures and Maintain Fail-Closed Error Boundaries

**Use when**

Decoding and verifying JSON Web Tokens where validation errors must result in explicit authentication rejections rather than unhandled exceptions or bypassed controls.

**Secure rules**

**Rule 1: Wrap token decoding calls in try-except blocks catching PyJWT exception subclasses to ensure validation errors fail closed.**

Always wrap `jwt.decode()` calls in try-except blocks that catch `jwt.InvalidTokenError` or its specific subclasses such as `jwt.ExpiredSignatureError`. This ensures token validation failures are properly handled and requests are explicitly rejected.

```python
import jwt

try:
    payload = jwt.decode(token, key, algorithms=["HS256"])
except jwt.ExpiredSignatureError:
    raise UnauthorizedError("Token has expired")
except jwt.InvalidTokenError:
    raise UnauthorizedError("Invalid token")
```
