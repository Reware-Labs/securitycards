# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: authentication

## authentication

### Enforce Strict Token Lifespan and Authentication Validation

**Use when**

When handling account recovery tokens, session authentication logins, and user verification workflows.

**Secure rules**

**Rule 1: Configure strict expiration durations for password reset tokens.**

Set `PASSWORD_RESET_TIMEOUT` in settings to enforce an appropriate lifespan for generated recovery tokens and reduce the window of exposure for token misuse.

```python
PASSWORD_RESET_TIMEOUT = 86400
```

**Rule 2: Pass the user instance returned by authenticate() to login() or alogin()**

Explicitly pass authenticated user objects to `login()` and `alogin()` rather than relying on implicit fallbacks to avoid logic bugs and unintended session mutations.

```python
from django.contrib.auth import authenticate, login

user = authenticate(request, username=username, password=password)
if user is not None:
    login(request, user)
```


### Verify Passwords and Configure Hashing Parameters

**Use when**

When managing user passwords, verifying credentials, or configuring password hashing algorithms in authentication workflows.

**Secure rules**

**Rule 1: Verify passwords securely using supported password hashing mechanisms and handle legacy hash upgrades**

Always use library-supported password-hashing verifiers and pass a setter callback to `check_password` or `acheck_password` to automatically upgrade legacy password hashes upon successful authentication.

```python
def login_user(user, raw_password):
    def password_setter(raw_password):
        user.set_password(raw_password)
        user.save(update_fields=['password'])

    if check_password(raw_password, user.password, setter=password_setter):
        return user
    return None
```

**Rule 2: Configure strong password hashers to prevent password truncation and dictionary attacks.**

Configure secure password hashers such as `BCryptSHA256PasswordHasher` or `ScryptPasswordHasher` in `PASSWORD_HASHERS` to ensure passwords are fully evaluated and protected against hardware-accelerated cracking.

```python
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.ScryptPasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
]
```
