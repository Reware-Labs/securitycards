# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: cryptography

## cryptography

### Configure RSA Message Signing and Verify Task Integrity

**Use when**

Configuring Celery message serialization, task signing, and public-key signature verification using RSA certificates and private keys.

**Secure rules**

**Rule 1: Use PEM-formatted RSA certificates and private keys for cryptographic message verification and signing.**

Ensure that private keys and certificates supplied to `celery.security.key.PrivateKey` and `celery.security.certificate.Certificate` are valid, uncorrupted RSA keys in PEM format. Non-RSA keys or unsupported formats will cause initialization to fail or raise errors.

```python
from celery.security.key import PrivateKey

with open('/path/to/private_key.pem', 'rb') as f:
    pem_data = f.read()

private_key = PrivateKey(pem_data, password=b'key_passphrase')
```

**Rule 2: Configure the SHA-256 digest for signed Celery messages**

When using Celery's `auth` serializer for message signing, configure `security_digest` as `sha256`. Use the public configuration setting rather than calling the internal `get_digest_algorithm()` utility directly.

```python
from celery import Celery

app = Celery()
app.conf.update(
    security_key="/etc/ssl/private/worker.key",
    security_certificate="/etc/ssl/certs/worker.pem",
    security_cert_store="/etc/ssl/certs/*.pem",
    security_digest="sha256",
    task_serializer="auth",
    event_serializer="auth",
    accept_content=["auth"],
)
app.setup_security()
```
