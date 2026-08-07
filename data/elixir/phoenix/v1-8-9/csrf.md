# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: csrf

## csrf

### Enforce CSRF Protection in Pipelines and Layouts

**Use when**

Configuring browser pipelines, session handling, and root layouts in Phoenix applications to prevent cross-site request forgery.

**Secure rules**

**Rule 1: Include the protect_from_forgery plug in browser-facing pipelines and render CSRF token meta tags in layouts.**

Ensure all browser pipelines execute the `protect_from_forgery` plug after fetching the session, and include the CSRF meta tag using `get_csrf_token()` within your root layout.

```elixir
pipeline :browser do
  plug :accepts, ["html"]
  plug :fetch_session
  plug :protect_from_forgery
  plug :put_secure_browser_headers
end

# root.html.heex
<meta name="csrf-token" content={get_csrf_token()} />
```
