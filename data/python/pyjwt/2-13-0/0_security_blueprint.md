# Security blueprint

Repository: `https://github.com/jpadilla/pyjwt#2.13.0`

## Security posture

When working with PyJWT, developers must assume that token security depends entirely on strict cryptographic verification, explicit algorithm restriction, and comprehensive claims validation. The library protects token integrity and payload transport by default, but it does not automatically enforce key length constraints, mandatory claims, or safe transport protocols without explicit developer configuration. Security-sensitive surfaces include key parsing, JWKS remote retrieval, signature verification, and error handling, all of which must fail closed when invalid data or exceptions occur.

## Essential implementation rules

1. **Perform Full Signature Verification After Unverified Inspection**

Always treat header fields extracted via `jwt.get_unverified_header()` or keys fetched via `PyJWKClient.get_signing_key_from_jwt()` as untrusted until cryptographic signature verification successfully completes. Ensure that `jwt.decode()` is called with the verified key and required algorithms to prevent accepting tampered tokens.

2. **Enforce Minimum Cryptographic Key Lengths**

Pass `enforce_minimum_key_length=True` in decode options to strictly reject undersized keys and ensure signing keys meet standard length requirements like at least 32 bytes for `HS256`.

3. **Validate Elliptic Curve Signature Formats**

Use `raw_to_der_signature` and `der_to_raw_signature` while supplying the matching EllipticCurve instance to strictly validate that input raw signature lengths match expected curve byte sizes.

4. **Mandate Critical Claims During Token Decoding**

Pass a list of required claims in the `options` dictionary under the `require` key when calling `jwt.decode()` to ensure that tokens omitting necessary fields like `exp`, `iss`, or `aud` are rejected.

5. **Prevent Algorithm Confusion via Dedicated Key Parsing**

Reject raw JWK-shaped JSON strings and asymmetric PEM keys as HMAC secrets to prevent algorithm confusion attacks. Use dedicated cryptographic parsing methods like `from_jwk` rather than passing raw JSON strings into secret parameters or `jwt.decode`.

6. **Restrict PyJWKClient URIs to HTTP and HTTPS**

Ensure that `PyJWKClient` is instantiated exclusively with `http` or `https` URLs. Pass only trusted HTTP(S) endpoints to prevent local file inclusion and server-side request forgery risks.

7. **Ensure Cryptography Dependency is Installed for Asymmetric Operations**

Processing asymmetric keys such as RSA, EC, or OKP requires the optional `cryptography` library. Ensure `pyjwt[crypto]` is installed in application deployment environments that handle asymmetric tokens, and handle `MissingCryptographyError` appropriately during runtime initialization.

8. **Load and Verify Non-Empty Secret Keys**

Ensure that secret keys are loaded correctly from environment variables or managed secret providers and checked to be non-empty before passing them to functions like `jwt.encode()` or `jwt.decode()`, as empty string or byte secrets raise an `InvalidKeyError`.

9. **Handle Token Validation Failures with Fail-Closed Error Boundaries**

Always wrap `jwt.decode()` calls in try-except blocks that catch `jwt.InvalidTokenError` or its specific subclasses such as `jwt.ExpiredSignatureError`. This ensures token validation failures are properly handled and requests are explicitly rejected.
