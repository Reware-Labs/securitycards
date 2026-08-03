# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: runtime environment hardening

## runtime environment hardening

### Disable Debug Mode and Use Production WSGI/ASGI Servers

**Use when**

Preparing Django applications for production deployment and configuring runtime settings.

**Secure rules**

**Rule 1: Set DEBUG to False and avoid using the development server in production.**

Ensure that `DEBUG = False` is configured in production settings to prevent leaking sensitive system information, local variables, and tracebacks. Never use `runserver` in production environments; instead, deploy the application using a production-grade WSGI or ASGI server like Gunicorn.

```python
# settings.py
DEBUG = False

# Run via production WSGI server
gunicorn myproject.wsgi:application --bind 127.0.0.1:8000
```
