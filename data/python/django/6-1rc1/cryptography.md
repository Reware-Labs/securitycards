# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: cryptography

## cryptography

### Secure Password Hashing and Work Factor Configuration

**Use when**

Configuring password storage and handling user credentials securely in Django applications.

**Secure rules**

**Rule 1: Always hash user passwords using Django's authentication creation APIs rather than setting plaintext values directly.**

Do not assign plaintext strings directly to the user model's password attribute. Instead, use `User.objects.create_user()` for user creation or `user.set_password()` when modifying passwords to ensure credentials are stored securely with cryptographic hashing.

```python
from django.contrib.auth.models import User

user = User.objects.create_user("john", "john@example.com", "raw_password")
user.set_password("new_raw_password")
user.save()
```

**Rule 2: List robust hashers such as Argon2PasswordHasher at the start of PASSWORD_HASHERS**

List robust hashers such as `Argon2PasswordHasher` or configured `PBKDF2PasswordHasher` subclasses at the beginning of `PASSWORD_HASHERS`. Maintain secondary hashers in the list to ensure legacy user hashes can be verified and automatically upgraded upon successful login.

```python
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]
```


### Sign and Verify Payload Data Using Cryptographic Signatures and Salts

**Use when**

Signing and verifying sensitive data, cookies, and tokens to ensure integrity and authenticity.

**Secure rules**

**Rule 1: Namespace cryptographic signatures using unique salt values and enforce expiration on time-sensitive payloads**

Supply a unique `salt` parameter when instantiating TimestampSigner for time-sensitive payloads to prevent cross-context replay attacks. Always enforce a strict `max_age` during signature verification via `unsign()` or `request.get_signed_cookie()` to reject expired tokens and tampered payloads.

```python
from datetime import timedelta
from django.core.signing import TimestampSigner, SignatureExpired, BadSignature

signer = TimestampSigner(salt="password-reset")

try:
    user_id = signer.unsign(token, max_age=timedelta(minutes=15))
except (SignatureExpired, BadSignature):
    pass
```
