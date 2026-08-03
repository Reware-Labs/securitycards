# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: boundary control

## boundary control

### Implement Secure WSGI Middleware and Context Isolation in Flask

**Use when**

Developing or configuring custom WSGI middleware, reverse proxy integrations, and application context routing boundaries in Flask applications.

**Secure rules**

**Rule 1: Isolate distinct application components at the WSGI layer using Werkzeug DispatcherMiddleware**

Wrap distinct application components like public frontends and administrative backends with `DispatcherMiddleware` to ensure each maintains an isolated configuration and route handling within the same process.

```python
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from frontend_app import application as frontend
from backend_app import application as backend

application = DispatcherMiddleware(frontend, {
    '/backend': backend
})
```

**Rule 2: Unwrap thread-local proxies before passing request data across background boundaries**

Call `_get_current_object()` on proxy objects like `request`, `g`, or `current_app` to retrieve the underlying instance before passing context across thread or worker boundaries.

```python
app_obj = current_app._get_current_object()
my_signal.send(app_obj)
```

**Rule 3: Validate host header input when dynamically dispatching requests in custom WSGI middleware**

Strictly validate and sanitize `HTTP_HOST` headers when writing custom WSGI middleware for dynamic dispatching, and return explicit WSGI exception applications like `NotFound()` for unmatched domain boundaries.

```python
from werkzeug.exceptions import NotFound

class SubdomainDispatcher:
    def __init__(self, domain, create_app):
        self.domain = domain.lower()
        self.create_app = create_app

    def get_application(self, host):
        host = host.split(':')[0].lower()
        if not host.endswith(f".{self.domain}") and host != self.domain:
            return NotFound()
        subdomain = host[:-len(self.domain)].rstrip('.')
        app = self.create_app(subdomain)
        return app if app is not None else NotFound()
```

**Rule 4: Reassign app.wsgi_app when integrating custom WSGI middleware and align path configurations**

Reassign `app.wsgi_app` rather than replacing the main Flask application object, and ensure path modifications in the WSGI environment align with Flask configurations like `APPLICATION_ROOT`.

```python
class PrefixPathMiddleware:
    def __init__(self, app, prefix):
        self.app = app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        environ["SCRIPT_NAME"] = self.prefix
        return self.app(environ, start_response)

app = flask.Flask(__name__)
app.wsgi_app = PrefixPathMiddleware(app.wsgi_app, "/bar")
app.config.update(APPLICATION_ROOT="/bar")
```

**Rule 5: Wrap application with trusted WSGI middleware such as ProxyFix to parse reverse proxy headers securely**

Wrap `app.wsgi_app` with Werkzeug's `ProxyFix` during application setup when the application is deployed behind a trusted reverse proxy. Configure only the forwarded headers required by your deployment, and set each option to the correct number of trusted proxies.

```python
from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)

# Use when the deployment only needs the original client IP address
# and request scheme (HTTP/HTTPS).
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# Use when the reverse proxy also forwards the original host and URL
# prefix (for example, when the application is served under a custom
# domain or a path such as "/app").
app.wsgi_app = ProxyFix(
    app.wsgi_app,
    x_for=1,
    x_proto=1,
    x_host=1,
    x_prefix=1,
)
```

**Rule 6: Write defensive teardown callbacks to guarantee resource cleanup**

Ensure `teardown_request` middleware callbacks handle missing context state gracefully and execute without raising unhandled exceptions.

```python
@app.teardown_request
def cleanup_resources(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()
```
