# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: secret handling

## secret handling

### Configure Secure Secret Keys and Rotation Mechanisms

**Use when**

Configuring Flask application secrets and setting up secure credential management for session signing.

**Secure rules**

**Rule 1: Load cryptographic secret keys from environment variables or secure external storage rather than hardcoding them.**

Initialize `SECRET_KEY` using secure environment variables via `os.environ` to prevent hardcoded credentials from exposing session management to forgery.

```python
import os
from flask import Flask

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ["FLASK_SECRET_KEY"]
app.config["SECRET_KEY_FALLBACKS"] = [
    os.environ.get("FLASK_OLD_SECRET_KEY")
]
```
