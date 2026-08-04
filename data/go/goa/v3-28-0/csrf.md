# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: csrf

## csrf

### Configure strict SameSite attributes for session cookies

**Use when**

When defining HTTP session or authentication cookies in Goa design definitions to prevent cross-site request forgery.

**Secure rules**

**Rule 1: Configure restrictive SameSite behavior for cookie attributes using CookieSameSiteValue constants.**

Explicitly apply `CookieSameSiteStrict` or `CookieSameSiteLax` to HTTP session or authentication cookies in Goa designs. Using `CookieSameSiteNone` or omitting explicit SameSite constraints increases exposure to Cross-Site Request Forgery attacks across cross-origin requests.
