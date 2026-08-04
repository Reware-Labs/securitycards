# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: network boundary

## network boundary

### Configure Trusted Proxy Settings and Remote Address Verification

**Use when**

Configuring network trust boundaries and verifying remote IP addresses or proxy configurations in Flask applications.

**Secure rules**

**Rule 1: Explicitly override REMOTE_ADDR when testing or simulating proxy and IP access restrictions.**

When writing security tests for IP-based access controls, rate limiters, or trusted proxy rules, explicitly pass custom `environ_base` dictionaries or request environment variables to simulate untrusted remote IP addresses instead of relying on the default localhost `REMOTE_ADDR` setting.

```python
def test_admin_blocked_for_external_ip(client):
    response = client.get(
        "/admin",
        environ_base={"REMOTE_ADDR": "203.0.113.195"}
    )
    assert response.status_code == 403
```
