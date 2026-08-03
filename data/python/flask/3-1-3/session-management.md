# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: session management

## session management

### Secure Flask Session Cookies and Handle Authentication State

**Use when**

Configuring session cookie security attributes, managing session lifetimes, and clearing or updating session data during user login, logout, and state modifications.

**Secure rules**

**Rule 1: Configure secure cookie flags and session lifetimes.**

Set `SESSION_COOKIE_SECURE=True`, `SESSION_COOKIE_HTTPONLY=True`, and `SESSION_COOKIE_SAMESITE='Lax'` to protect cookies against interception, script theft, and cross-site attacks. Define `PERMANENT_SESSION_LIFETIME` to bound session validity windows.

```python
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=600
)

@app.route('/login', methods=['POST'])
def login():
    session.clear()
    session['user_id'] = user.id
    session.permanent = True
```

**Rule 2: Clear session data completely on authentication changes and logout.**

Call `session.clear()` before writing authentication identifier keys during login and entirely when logging out to prevent session fixation and stale session reuse.

```python
# Secure login handling
session.clear()
session["user_id"] = user["id"]

# Secure logout handling
@bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))
```

**Rule 3: Explicitly mark session modified when updating nested mutable objects.**

Set `session.modified = True` after updating nested mutable structures such as dictionaries or lists stored inside the session, ensuring changes are properly tracked and persisted.

```python
from flask import session

# Updating top-level dictionary keys is automatically tracked
session["user_id"] = 123

# Updating nested objects requires setting session.modified = True
if "permissions" not in session:
    session["permissions"] = {}

session["permissions"]["is_admin"] = True
session.modified = True
```
