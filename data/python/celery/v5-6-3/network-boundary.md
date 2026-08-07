# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: network boundary

## network boundary

### Configure SSL and HTTPS for Message Broker and Backend Connections

**Use when**

Configuring transport and result backend connections in Celery across network boundaries to prevent interception and unauthorized access.

**Secure rules**

**Rule 1: Enforce SSL encryption and certificate verification for message broker communications.**

Isolate the message broker from untrusted network access using network firewalls, enable broker access control lists, and encrypt broker communication by configuring `broker_use_ssl` with required certificate verification.

```python
import ssl

app.conf.update(
    broker_use_ssl={
        'keyfile': '/etc/ssl/private/client.key',
        'certfile': '/etc/ssl/certs/client.pem',
        'ca_certs': '/etc/ssl/certs/ca.pem',
        'cert_reqs': ssl.CERT_REQUIRED
    }
)
```
