# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: runtime environment hardening

## runtime environment hardening

### Deploy Applications on Python Runtimes Compiled with OpenSSL 1.1.1 or Later

**Use when**

Configuring the production runtime environment and container base images for deploying applications using urllib3.

**Secure rules**

**Rule 1: Deploy applications on Python 3.10+ runtimes compiled with OpenSSL 1.1.1 or higher.**

Ensure your production environments, container base images, or server deployments run supported Python versions compiled against OpenSSL 1.1.1 or newer to avoid outdated cryptographic builds and ensure proper support for modern TLS protocol features.

```dockerfile
FROM python:3.11-slim

RUN pip install 'urllib3>=2.0.0'
```
