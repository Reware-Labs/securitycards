# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: csrf

## csrf

### Configure CSRF prevention and token verification in Quarkus REST

**Use when**

Building web forms or REST endpoints in Quarkus that handle state-changing browser requests using ambient credentials and require anti-CSRF token protection.

**Secure rules**

**Rule 1: Configure a strong token signature key for REST CSRF protection**

Add `quarkus.rest-csrf.token-signature-key` to your `application.properties` with a secure secret that is at least 32 characters long to generate and verify HMAC signatures for CSRF tokens.

```properties
quarkus.rest-csrf.token-signature-key=AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow
```

**Rule 2: Inject CSRF tokens into Qute templates and HTML forms**

Include the hidden CSRF token input field inside your Qute HTML templates so that the server filter can verify the submitted value against the CSRF cookie on state-changing requests.

```html
<form action="/service/csrfTokenForm" method="post">
    <input type="hidden" name="{inject:csrf.parameterName}" value="{inject:csrf.token}" />
    <p>Your Name: <input type="text" name="name" /></p>
    <p><input type="submit" name="submit"/></p>
</form>
```

**Rule 3: Restrict CSRF verification paths and content types safely**

Scope CSRF verification to specific form paths using `quarkus.rest-csrf.create-token-path` and set `quarkus.rest-csrf.require-form-url-encoded=false` if header-based token verification is required for non-form payloads.

```properties
# Limit CSRF verification to specific endpoint paths
quarkus.rest-csrf.create-token-path=/service/user

# Allow non-form content types on the token path when using header tokens
quarkus.rest-csrf.require-form-url-encoded=false
```
