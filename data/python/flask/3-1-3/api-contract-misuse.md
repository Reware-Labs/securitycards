# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: api contract misuse

## api contract misuse

### Configure Flask error handling and production exception behavior

**Use when**

Configuring application error handling, setting production flags, and registering custom error handlers or teardown hooks.

**Secure rules**

**Rule 1: Keep HTTP exception trapping and exception propagation disabled in production**

Ensure `TRAP_BAD_REQUEST_ERRORS`, `TRAP_HTTP_EXCEPTIONS`, and `PROPAGATE_EXCEPTIONS` remain set to `False` in production configurations so that unhandled exceptions and standard HTTP errors are properly caught by custom error handlers instead of crashing requests or surfacing internal tracebacks.

```python
app = Flask(__name__)
app.config["DEBUG"] = False
app.config["PROPAGATE_EXCEPTIONS"] = False
app.config["TRAP_BAD_REQUEST_ERRORS"] = False
app.config["TRAP_HTTP_EXCEPTIONS"] = False
```

**Rule 2: Sanitize internal server error responses and differentiate HTTP exceptions**

Explicitly differentiate `HTTPException` instances within generic error handlers to preserve original HTTP status codes and headers, and sanitize `500` error handlers to log original exceptions internally while returning obscured client responses.

```python
from flask import json, render_template
from werkzeug.exceptions import HTTPException

@app.errorhandler(500)
def handle_500(e):
    original = getattr(e, "original_exception", None)
    if original:
        app.logger.error(f"Unhandled exception: {original}")
    return render_template("500.html"), 500
```

**Rule 3: Register explicit application error handlers for HTTP codes and exception classes**

Register explicit application error handlers using Flask's `@app.errorhandler` decorator for integer HTTP status codes, Werkzeug exceptions, and standard Python exceptions to prevent internal runtime errors from leaking diagnostic information.

```python
from werkzeug.exceptions import BadRequest

@app.errorhandler(400)
@app.errorhandler(BadRequest)
def handle_bad_request(e):
    return "Invalid request", 400
```


### Decorate background tasks with request context preservation

**Use when**

Spawning background tasks, greenlets, or worker threads from within an active Flask request context where proxies like `request` and `session` must be accessed.

**Secure rules**

**Rule 1: Use @flask.copy_current_request_context to preserve active request context in spawned background tasks.**

Decorate functions dispatched to background threads or greenlets with `@flask.copy_current_request_context` so that `flask.request` and `flask.session` remain safely accessible inside the sub-task execution without raising runtime errors or leaking state across threads.

```python
@app.route('/async-task')
def async_task():
    @flask.copy_current_request_context
    def worker():
        user_ip = flask.request.remote_addr
        session_user = flask.session.get('user_id')
        return process_data(user_ip, session_user)
    g = greenlet(worker)
    return str(g.run())
```


### Secure Flask Routing and Endpoint Registration

**Use when**

Defining routes, blueprints, HTTP methods, and URL parameters in Flask applications.

**Secure rules**

**Rule 1: Explicitly specify uppercase HTTP methods or use method-specific decorators when defining routes**

When defining Flask routes using `@app.route()` or `app.add_url_rule()`, specify allowed HTTP methods as an iterable of uppercase string names or use method-specific decorators like `@app.get()` and `@app.post()`.

```python
@app.get('/items')
def get_items():
    return {'items': []}

@app.post('/items')
def create_item():
    return {'status': 'created'}, 201
```

**Rule 2: Position the route decorator as the outermost decorator on view functions**

When applying custom decorators to Flask view functions, ensure `@app.route` is always positioned as the outermost decorator so that Flask registers the wrapped function rather than the raw inner handler.

```python
@app.route('/secret_page')
@login_required
def secret_page():
    return 'Protected content'
```

**Rule 3: Use explicit URL prefixes when registering blueprints**

Always configure an explicit `url_prefix` when registering blueprints to avoid route shadowing and namespace collisions with primary application routes or static handlers.

```python
admin_bp = Blueprint('admin', __name__, static_folder='static')
app.register_blueprint(admin_bp, url_prefix='/admin')
```

**Rule 4: Specify explicit converter types in URL route path templates**

Use parameter converters such as `int`, `float`, or `uuid` in URL route path templates instead of relying on default generic string or path converters to validate parameter types before reaching view handlers.

```python
@app.route('/post/<int:post_id>')
def show_post(post_id):
    pass
```

**Rule 5: Configure trusted hosts to restrict accepted Host headers during routing**

Explicitly configure `TRUSTED_HOSTS` in Flask application settings to restrict accepted Host headers during URL adapter creation and route matching.

```python
app = Flask(__name__)
app.config['TRUSTED_HOSTS'] = ['example.com', '*.example.com']
```
