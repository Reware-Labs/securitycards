# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: interface protocol hardening

## interface protocol hardening

### Configure browser and transport security headers

**Use when**

Configuring router pipelines and endpoint transport settings to enforce browser security headers and strict transport security.

**Secure rules**

**Rule 1: Include put_secure_browser_headers in browser pipelines**

Ensure `plug :put_secure_browser_headers` is included in all router pipelines serving browser traffic. In Phoenix 1.8.9, `put_secure_browser_headers` applies standard HTTP security headers, defaulting `content-security-policy` to `"base-uri 'self'; frame-ancestors 'self';"` when unconfigured.

```elixir
pipeline :browser do
  plug :accepts, ["html"]
  plug :fetch_session
  plug :fetch_live_flash
  plug :protect_from_forgery
  plug :put_secure_browser_headers
end
```

**Rule 2: Enable force_ssl in compile-time config to inject Strict-Transport-Security headers**

Configure endpoint `:force_ssl` in compile-time configuration files such as `config/prod.exs` (not `config/runtime.exs`) to ensure Phoenix emits the `Strict-Transport-Security` (HSTS) security header on HTTPS responses.

```elixir
config :my_app, MyAppWeb.Endpoint,
  force_ssl: [rewrite_on: [:x_forwarded_proto], hsts: true]
```
