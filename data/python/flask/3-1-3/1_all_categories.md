# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`

## Category: access control

### Enforce Resource Ownership Checks Before Modifying Application Resources

**Use when**

When building state-changing operations or resource modification routes in Flask where authenticated users perform updates or deletions on records.

**Secure rules**

**Rule 1: Verify that the authenticated user matches the resource owner or author before permitting state modifications**

Query the database for the target resource and compare its owner identifier or its access against the current user in `g.user`. If the resource does not exist, raise an HTTP 404 error using `abort(404)`, and if the user does not own the resource, raise an HTTP 403 Forbidden error using `abort(403)` to prevent unauthorized access and Insecure Direct Object Reference vulnerabilities.


## Category: api contract misuse

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


## Category: authentication

### Validate user credentials during authentication

**Use when**

Handling user registration and login requests to verify presented identity credentials before creating session variables or querying the database.

**Secure rules**

**Rule 1: Validate username and password fields on the server side prior to processing authentication or registration requests.**

Check all incoming username and password inputs in your route handler to ensure they are present before proceeding with database queries or establishing authentication sessions.

```python
@bp.route('/register', methods=('GET', 'POST'))
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if not username:
            flash('Username is required.')
        elif not password:
            flash('Password is required.')
```


## Category: boundary control

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


## Category: configuration source integrity

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


## Category: cryptography

### Protect Credentials and Sensitive Data at Rest

**Use when**

When registering new users, validating user login credentials, or persisting sensitive user data in the application database.

**Secure rules**

**Rule 1: Hash user passwords securely before storage and verify submitted credentials against the stored hash.**

Use Werkzeug's `generate_password_hash` to hash user passwords before storing them in persistent storage. When authenticating users during login, use `check_password_hash` to securely verify the submitted password against the stored hash.

```python
from werkzeug.security import generate_password_hash, check_password_hash

# Storing hashed password during registration
hashed_password = generate_password_hash(password)
db.execute("INSERT INTO user (username, password) VALUES (?, ?)", (username, hashed_password))

# Validating password during login
if check_password_hash(user["password"], password):
    session["user_id"] = user["id"]
```

**Rule 2: Encrypt sensitive non-credential data before writing it to the database and decrypt it only when serving its owner.**

Secrets, tokens, and other confidential user data stored as plaintext columns are readable by anyone who obtains the database file or a backup. Encrypt them with an authenticated cipher such as `cryptography.fernet.Fernet`, key it from the environment, and persist only the ciphertext. Passwords are the exception: hash those under Rule 1 rather than encrypting them.

```python
import os
from cryptography.fernet import Fernet

cipher = Fernet(os.environ["DATA_ENCRYPTION_KEY"])

db.execute(
    "INSERT INTO note (owner_id, body) VALUES (?, ?)",
    (g.user["id"], cipher.encrypt(body.encode())),
)

row = db.execute("SELECT body FROM note WHERE id = ?", (note_id,)).fetchone()
plaintext = cipher.decrypt(row["body"]).decode()
```


## Category: csrf

### Implement Anti-CSRF Tokens and SameSite Cookie Protection

**Use when**

Developing state-changing routes and configuring session cookie policies in Flask applications to prevent cross-site request forgery.

**Secure rules**

**Rule 1: Validate anti-CSRF tokens on state-changing requests.**

Since Flask does not provide built-in form validation or CSRF protection by default, developers must manually issue a token, store it in a cookie, transmit it with form data, and verify that both values match on state-modifying requests like `POST`.

```python
@app.route('/user/delete', methods=['POST'])
def delete_user():
    token_in_cookie = request.cookies.get('csrf_token')
    token_in_form = request.form.get('csrf_token')
    if not token_in_cookie or token_in_cookie != token_in_form:
        abort(400, 'CSRF token verification failed')
    # Process user deletion safely
```

**Rule 2: Configure SameSite cookie protection for session and response cookies.**

Set `SESSION_COOKIE_SAMESITE` to `'Lax'` or `'Strict'` in the Flask configuration and pass `samesite='Lax'` when creating custom response cookies using `response.set_cookie()` to prevent browsers from sending cookies on cross-site requests.

```python
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
)

@app.route('/login', methods=['POST'])
def login():
    response = make_response(redirect('/dashboard'))
    response.set_cookie('user_session', 'token_value', secure=True, httponly=True, samesite='Lax')
    return response
```


## Category: dangerous execution

### Disable Debug Mode and Built-in Server in Production

**Use when**

Configuring deployment settings and launching the application in a production environment, or evaluating an expression supplied by a request.

**Secure rules**

**Rule 1: Avoid running the built-in development server or enabling debug mode in production to prevent arbitrary code execution vulnerabilities.**

Do not pass `--debug` or run the built-in development server in a production environment, because the interactive debugger allows arbitrary Python code execution from the browser. Instead, deploy the application using a dedicated production WSGI server.

```bash
gunicorn -w 4 'hello:app'
```

**Rule 2: Evaluate a user-supplied expression by parsing it with `ast` and allowing an explicit set of nodes, never with `eval()`.**

Stripping `__builtins__` does not make `eval()` safe: attribute traversal from any ordinary object reaches back into the interpreter, and a single `9**9**9` blocks the worker. Parse with `ast.parse(expression, mode="eval")`, accept only the node types the feature actually needs, and reject everything else.

```python
import ast
import operator

_BINOPS = {ast.Add: operator.add, ast.Sub: operator.sub,
           ast.Mult: operator.mul, ast.Div: operator.truediv}

def evaluate(expression: str) -> float:
    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return node.value
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.USub):
            return -visit(node.operand)
        if isinstance(node, ast.BinOp) and type(node.op) in _BINOPS:
            return _BINOPS[type(node.op)](visit(node.left), visit(node.right))
        raise ValueError("unsupported expression")

    return visit(ast.parse(expression, mode="eval"))
```


## Category: escape hatch

### Restrict Jinja safe filter to trusted HTML generation

**Use when**

Rendering trusted field widget calls within template macros where HTML structure must be preserved, or displaying HTML that was authored by a user and stored by the application.

**Secure rules**

**Rule 1: Apply the Jinja `|safe` filter exclusively to trusted HTML generated by WTForms field widget calls.**

Isolate the `|safe` filter to framework-managed widget rendering functions within templates, allowing automatic escaping to protect error messages and labels instead of applying it to raw user input.

```jinja
{% macro render_field(field) %}
  <dt>{{ field.label }}
  <dd>{{ field(**kwargs)|safe }}
  {% if field.errors %}
    <ul class=errors>
    {% for error in field.errors %}
      <li>{{ error }}</li>
    {% endfor %}
    </ul>
  {% endif %}
  </dd>
{% endmacro %}
```

**Rule 2: When the specification requires storing user-supplied HTML, sanitize it against an allowlist on output instead of returning the stored value raw.**

Storing HTML does not make it trusted. Pass it through an allowlist sanitizer such as `nh3.clean()` immediately before rendering, and mark only that sanitized result safe. Never apply `|safe`, `Markup()`, or a raw HTML response to a value that originated from a user.

```python
import nh3
from flask import render_template
from markupsafe import Markup

@app.route("/posts/<int:post_id>")
def show_post(post_id):
    post = get_post(post_id)
    return render_template("post.html", body=Markup(nh3.clean(post["body"])))
```


## Category: file handling

### Safely handle user-provided file names and paths during uploads and downloads

**Use when**

Handling file uploads from users or serving requested files from the filesystem.

**Secure rules**

**Rule 1: Sanitize untrusted filenames using `werkzeug.utils.secure_filename` before saving them to the filesystem.**

Always sanitize untrusted filenames using `werkzeug.utils.secure_filename` before combining them with upload paths or storing them on the filesystem to prevent directory traversal sequences from writing files outside the intended upload directory.

```python
from werkzeug.utils import secure_filename
import os

@app.route('/upload', methods=['POST'])
def upload_file():
    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
```

**Rule 2: Use `send_from_directory` instead of `send_file` when serving user-provided paths.**

Never pass user-supplied file paths directly to `send_file()`, because it treats path arguments as trusted input and does not perform path traversal containment checks. Always use `send_from_directory()` to serve user-requested files safely from within a designated base directory.

```python
from flask import send_from_directory

@app.get('/uploads/<path:filename>')
def download_file(filename):
    return send_from_directory('/var/www/uploads', filename)
```


## Category: injection

### Use Parameterized Queries to Prevent SQL Injection

**Use when**

Writing database queries with dynamic user input, or recording user-controlled values in application logs.

**Secure rules**

**Rule 1: Pass dynamic parameters separately from the SQL statement using placeholders.**

When executing SQL statements or database commands, always pass user-supplied input as parameterized arguments using placeholders such as `?` or named parameters rather than using string interpolation, formatting, or concatenation.

```python
db = get_db()
db.execute(
    'INSERT INTO post (title, body, author_id) VALUES (?, ?, ?)',
    (title, body, g.user['id'])
)
db.commit()
```

**Rule 2: Strip or escape carriage returns, line feeds, and other control characters before writing a user-controlled value to a log.**

A value containing `\r` or `\n` forges additional log lines, letting an attacker fabricate entries or hide their own activity from anything that reads the log. Neutralize control characters before the value reaches the logger, and pass it as a logging argument rather than interpolating it into the message.

```python
def log_safe(value: str) -> str:
    return value.encode("unicode_escape").decode("ascii")

app.logger.info("login failed for user=%s", log_safe(username))
```


## Category: input contract definition

### Validate form data against explicit input constraints before processing

**Use when**

Handling incoming HTTP request form data or query parameters that require structural and type validation before executing business logic.

**Secure rules**

**Rule 1: Define explicit input validation rules on form models and enforce validation checks before processing request payloads.**

Bind HTTP request data such as `request.form` or `request.args` to form validation classes and strictly execute validation methods like `form.validate()` before accessing submitted fields in your application logic or database operations.

```python
@app.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm(request.form)
    if request.method == 'POST' and form.validate():
        user = User(form.username.data, form.email.data, form.password.data)
        db_session.add(user)
        return redirect(url_for('login'))
    return render_template('register.html', form=form)
```


## Category: interface protocol hardening

### Configure Security Headers and Vary Cookie Headers on Outgoing Responses

**Use when**

Developing response processors, custom session interfaces, or after-request hooks in Flask to harden network protocol semantics and enforce browser security controls.

**Secure rules**

**Rule 1: Configure HTTP security headers on outgoing Flask responses or use an extension like Flask-Talisman.**

Set security headers such as `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, and `X-Frame-Options` on outgoing responses or via an `after_request` hook to direct the browser to enforce secure transport, restrict resource loading, and prevent MIME-type sniffing or clickjacking.

```python
@app.after_request
def set_security_headers(response):
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    return response
```

**Rule 2: Preserve the Vary Cookie header for session-dependent responses in custom session interfaces or response processors.**

Ensure the `Vary: Cookie` header is added to the HTTP response whenever session data is accessed or modified by checking `session.accessed` or `session.modified`, preventing CDNs and reverse proxies from serving session-tailored content to unauthenticated users.

```python
if session.accessed:
    response.vary.add("Cookie")
```


### Rely on Request Context Dispatching to Reject Malformed Host Headers

**Use when**

When handling incoming web requests and validating protocol headers to prevent protocol confusion and request smuggling.

**Secure rules**

**Rule 1: Allow Flask's request dispatch mechanism to validate incoming WSGI environment headers and automatically reject requests with invalid or non-printable host headers.**

Flask's request context dispatching checks incoming headers and returns a `400 Bad Request` error when HTTP `Host` headers contain invalid or non-printable characters. Applications should rely on this full request dispatch mechanism to automatically reject corrupted headers and prevent request smuggling and host header injection.

```python
@app.route('/')
def index():
    return 'Hello World!'

response = app.test_client().get('/', headers={'Host': 'xn--on-0ia.com'})
```


## Category: network boundary

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


## Category: output encoding

### Escape Untrusted Input When Rendering HTML Responses in Flask

**Use when**

Rendering manual HTML strings or dynamic user-controlled data within HTML templates and attributes.

**Secure rules**

**Rule 1: Build HTML with Jinja templates so autoescaping applies to every interpolation, never by string concatenation or an f-string.**

Pass user-controlled values into `render_template` as template variables and let Jinja escape them at render time. Assembling a response with `+`, `%`, `.format()`, or an f-string bypasses autoescaping entirely and reintroduces cross-site scripting on every value you forget to escape by hand.

```python
from flask import render_template

@app.route("/profile")
def profile():
    return render_template("profile.html", username=g.user["username"])
```

**Rule 2: Explicitly escape untrusted user input with markupsafe.escape() when a route returns an HTML fragment directly.**

Where a handler returns HTML without a template, wrap every untrusted value in `markupsafe.escape()` at the point of interpolation so the fragment cannot carry markup supplied by the caller.

```python
from flask import request
from markupsafe import escape

@app.route('/hello')
def hello():
    name = request.args.get('name', 'Flask')
    return f'Hello, {escape(name)}!'
```

**Rule 3: Use the tojson filter when embedding server-side data into JavaScript or attribute contexts.**

Use Jinja's `|tojson` filter when embedding server-side data into HTML `<script>` tags or HTML data attributes to safely serialize and escape the data, and wrap attribute values containing `tojson` in single quotes.

```html
<script>
    const userNames = {{ names|tojson }};
    renderChart(userNames, {{ axis_data|tojson }});
</script>

<div data-chart='{{ chart_data|tojson }}'></div>
```

**Rule 4: Sanitize user-authored markup before returning it as `text/html`.**

Rules 1 to 3 cover values interpolated into markup you control; autoescaping never sees a whole page a user wrote and the application serves as-is. Where the contract requires `text/html`, keep that content type — a security rule hardens a specification rather than amending it — and run the stored markup through an allowlist sanitizer: `nh3` keeps the formatting tags the feature needs and drops `<script>`, `onload`-style handler attributes, and `javascript:` URLs. Where no sanitizer is available, `markupsafe.escape` makes the page inert at the cost of showing its tags as text. Send `X-Content-Type-Options: nosniff` either way.

```python
import nh3
from flask import Response

@app.get("/pages/<slug>")
def read_page(slug):
    page = load_submitted_page(slug)   # user-authored markup
    if page is None:
        return {"message": "Not found"}, 404
    return Response(
        nh3.clean(page),               # keeps safe tags, drops scripts and handlers
        mimetype="text/html",
        headers={"X-Content-Type-Options": "nosniff"},
    )
```


## Category: resource exhaustion

### Configure request size limits and form parsing thresholds

**Use when**

Configuring Flask application settings to restrict incoming payload sizes and multipart form parsing consumption.

**Secure rules**

**Rule 1: Set global or per-request payload limits and form parsing thresholds.**

Use `MAX_CONTENT_LENGTH` globally or `Request.max_content_length` per request to restrict total request payload size. Additionally, configure `MAX_FORM_MEMORY_SIZE` and `MAX_FORM_PARTS` to control memory usage when parsing non-file multipart form fields.

```python
app.config.update(
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,
    MAX_FORM_MEMORY_SIZE=500 * 1024,
    MAX_FORM_PARTS=1000
)
```


## Category: runtime environment hardening

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


## Category: secret handling

### Configure Secure Secret Keys and Rotation Mechanisms

**Use when**

Configuring Flask application secrets and setting up secure credential management for session signing.

**Secure rules**

**Rule 1: Load cryptographic secret keys from environment variables or secure external storage rather than hardcoding them.**

Initialize `SECRET_KEY` using secure environment variables via `os.environ` to prevent hardcoded credentials from exposing session management to forgery.

```python
import os
from flask import Flask

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ["FLASK_SECRET_KEY"]
app.config["SECRET_KEY_FALLBACKS"] = [
    os.environ.get("FLASK_OLD_SECRET_KEY")
]
```


## Category: security control integrity

### Explicitly Invoke Preprocess Request During Testing

**Use when**

Testing request-dependent code using `app.test_request_context()` where tests depend on security controls or identity population configured inside `before_request` hooks.

**Secure rules**

**Rule 1: Explicitly invoke preprocess request within test request contexts to ensure security hooks are executed.**

When testing request-dependent code using `app.test_request_context()`, Flask does not automatically execute request dispatching or `before_request` hooks. When tests depend on security controls, authentication checks, or identity population configured inside `before_request` hooks, developers must explicitly call `app.preprocess_request()` inside the request context or perform full client requests using `app.test_client()` to prevent bypassing security mechanisms.

```python
def test_auth_token(app):
    with app.test_request_context("/user/2/edit", headers={"X-Auth-Token": "1"}):
        app.preprocess_request()
        assert g.user.name == "Flask"
```


## Category: session management

### Secure Flask Session Cookies and Handle Authentication State

**Use when**

Configuring session cookie security attributes, managing session lifetimes, and clearing or updating session data during user login, logout, and state modifications.

**Secure rules**

**Rule 1: Configure secure cookie flags and session lifetimes.**

Set `SESSION_COOKIE_SECURE=True`, `SESSION_COOKIE_HTTPONLY=True`, and `SESSION_COOKIE_SAMESITE='Lax'` to protect cookies against interception, script theft, and cross-site attacks. Define `PERMANENT_SESSION_LIFETIME` to bound session validity windows.

```python
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=600
)

@app.route('/login', methods=['POST'])
def login():
    session.clear()
    session['user_id'] = user.id
    session.permanent = True
```

**Rule 2: Clear session data completely on authentication changes and logout.**

Call `session.clear()` before writing authentication identifier keys during login and entirely when logging out to prevent session fixation and stale session reuse.

```python
# Secure login handling
session.clear()
session["user_id"] = user["id"]

# Secure logout handling
@bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))
```

**Rule 3: Explicitly mark session modified when updating nested mutable objects.**

Set `session.modified = True` after updating nested mutable structures such as dictionaries or lists stored inside the session, ensuring changes are properly tracked and persisted.

```python
from flask import session

# Updating top-level dictionary keys is automatically tracked
session["user_id"] = 123

# Updating nested objects requires setting session.modified = True
if "permissions" not in session:
    session["permissions"] = {}

session["permissions"]["is_admin"] = True
session.modified = True
```
