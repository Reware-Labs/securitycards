# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: runtime environment hardening

## runtime environment hardening

### Deploy Flask Applications Using a Dedicated Production WSGI Server

**Use when**

Deploying the Flask application to a live production environment rather than running it locally for development.

**Secure rules**

**Rule 1: Avoid running the Flask built-in development server or CLI command in production environments.**

Do not deploy Flask applications using the CLI development server `flask run` in production because the Werkzeug development server lacks concurrency management, resource boundaries, and request-handling safety mechanisms required for live environments. Instead, use a dedicated production WSGI server such as Gunicorn.

```bash
# Production deployment command (e.g., Gunicorn):
gunicorn -w 4 'myapp:create_app()'
```
