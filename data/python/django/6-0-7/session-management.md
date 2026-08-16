# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: session management

## session management

### Enforce Secure Cookie Attributes for Session Management

**Use when**

Configuring session cookies and production settings to ensure cookies are transmitted securely and protected against interception or client-side extraction.

**Secure rules**

**Rule 1: Enable boolean secure and HTTP-only session cookies**

Configure `SESSION_COOKIE_SECURE` and `SESSION_COOKIE_HTTPONLY` as boolean `True` in production settings to prevent browsers from transmitting session identifiers over unencrypted HTTP connections and to block client-side scripts from accessing them.

```python
# settings.py for production
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
```


### Rotate and Flush Sessions During Authentication and Security State Changes

**Use when**

Handling user login, logout, password updates, or authentication state transitions where session identifiers must be rotated or invalidated to prevent session fixation and reuse.

**Secure rules**

**Rule 1: Cycle session keys upon authentication state changes**

Call `request.session.cycle_key()` whenever a user logs in or when their privilege level changes to generate a new session key while maintaining the session payload and mitigating session fixation attacks.

```python
def login_view(request):
    # Perform user authentication checks...
    request.session.cycle_key()
    request.session['user_id'] = user.id
```

**Rule 2: Flush session data completely on logout**

Use `request.session.flush()` on user logout to delete all current session data from the backend and purge the session cookie from the client, preventing session leakage and replay.

```python
def logout_view(request):
    request.session.flush()
    return HttpResponse('Logged out')
```

**Rule 3: Rotate session keys when updating user passwords**

Call update_session_auth_hash(request, user) after an authenticated user changes their password to rotate the current session key while keeping that session valid; other sessions are invalidated by the password change.

```python
from django.contrib.auth import update_session_auth_hash

def change_password_view(request):
    if form.is_valid():
        user = form.save()
        update_session_auth_hash(request, user)
```
