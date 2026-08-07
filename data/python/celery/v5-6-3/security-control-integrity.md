# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: security control integrity

## security control integrity

### Fail Closed During Certificate Store Initialization

**Use when**

When initializing certificate stores and loading security credentials for message signing or verification in Celery.

**Secure rules**

**Rule 1: Fail closed and halt initialization when certificate expiration or duplicate certificate identifiers are encountered.**

Wrap certificate store initialization in a try-except block catching `SecurityError`, ensuring that expired certificates or overlapping identifier combinations prevent startup rather than bypassing security control requirements.

```python
from celery.security.certificate import FSCertStore
from celery.exceptions import SecurityError

try:
    cert_store = FSCertStore('/etc/celery/certs/*.pem')
except SecurityError as exc:
    raise SystemExit(f'Failed to initialize certificate store: {exc}')
```
