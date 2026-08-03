# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: configuration source integrity

## configuration source integrity

### Respect environment variable precedence when loading configuration files

**Use when**

When loading configuration and environment variables via `load_dotenv()` in Flask applications.

**Secure rules**

**Rule 1: Rely on process environment variables for critical runtime configuration and ensure environment variable precedence is respected.**

When loading configuration files using `load_dotenv()`, existing process variables in `os.environ` take priority and are not overwritten by `.env` or `.flaskenv` files. Ensure sensitive production credentials are supplied through process environment variables rather than source-controlled configuration files.

```python
from flask.cli import load_dotenv

# load_dotenv loads .env and .flaskenv without replacing existing os.environ variables
load_dotenv()
```
