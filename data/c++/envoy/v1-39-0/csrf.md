# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: csrf

## csrf

### Configure SameSite Attributes and Expiration for OAuth2 State Cookies

**Use when**

Configuring OAuth2 authentication filters and cookies in Envoy to protect against cross-site request forgery and authorization state fixation attacks.

**Secure rules**

**Rule 1: Configure explicit SameSite restrictions and short expiration windows for OAuth2 cookies and CSRF state tokens.**

Set explicit `same_site` attributes such as `STRICT` for bearer, HMAC, and ID token cookies, and define short expiration windows for CSRF state tokens and PKCE code verifiers using `csrf_token_expires_in` and `code_verifier_token_expires_in`.

```yaml
csrf_token_expires_in:
  seconds: 300
code_verifier_token_expires_in:
  seconds: 300
cookie_configs:
  bearer_token_cookie_config:
    same_site: STRICT
  oauth_hmac_cookie_config:
    same_site: STRICT
  id_token_cookie_config:
    same_site: STRICT
```
