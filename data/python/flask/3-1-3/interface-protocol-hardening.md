# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: interface protocol hardening

## interface protocol hardening

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
