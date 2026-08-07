# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: cryptography

## cryptography

### Protect Credentials and Sensitive Data at Rest

**Use when**

When registering new users, validating user login credentials, or persisting sensitive user data in the application database.

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

**Rule 2: Encrypt sensitive non-credential data before writing it to the database and decrypt it only when serving its owner.**

Secrets, tokens, and other confidential user data stored as plaintext columns are readable by anyone who obtains the database file or a backup. Encrypt them with an authenticated cipher such as `cryptography.fernet.Fernet`, key it from the environment, and persist only the ciphertext. Passwords are the exception: hash those under Rule 1 rather than encrypting them.

```python
import os
from cryptography.fernet import Fernet

cipher = Fernet(os.environ["DATA_ENCRYPTION_KEY"])

db.execute(
    "INSERT INTO note (owner_id, body) VALUES (?, ?)",
    (g.user["id"], cipher.encrypt(body.encode())),
)

row = db.execute("SELECT body FROM note WHERE id = ?", (note_id,)).fetchone()
plaintext = cipher.decrypt(row["body"]).decode()
```
