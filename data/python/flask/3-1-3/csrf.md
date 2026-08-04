# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: csrf

## csrf

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
