# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: cryptography

## cryptography

### Hash User Passwords Securely

**Use when**

When registering new users or validating user login credentials in a web application.

**Secure rules**

**Rule 1: Hash user passwords securely before storage and verify submitted credentials against the stored hash.**

Use Werkzeug's `generate_password_hash` to hash user passwords before storing them in persistent storage. When authenticating users during login, use `check_password_hash` to securely verify the submitted password against the stored hash.

```python
from werkzeug.security import generate_password_hash, check_password_hash

# Storing hashed password during registration
hashed_password = generate_password_hash(password)
db.execute("INSERT INTO user (username, password) VALUES (?, ?)", (username, hashed_password))

# Validating password during login
if check_password_hash(user["password"], password):
    session["user_id"] = user["id"]
```
