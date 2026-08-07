# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: runtime environment hardening

## runtime environment hardening

### Disable Sensitive Debug Options and Endpoints in Production Environments

**Use when**

Configuring runtime environments, endpoints, and database connections for production deployments.

**Secure rules**

**Rule 1: Gate development-only routes behind the `:dev_routes` compile-time flag**

Expose diagnostic routes such as **Phoenix LiveDashboard** and **Swoosh mailbox preview** **only** when the application is built with `dev_routes: true`.
Leave the flag unset in production configs so the code below is **not** compiled into the release.

```elixir
# config/dev.exs (compile-time)
config :my_app, dev_routes: true      # enabled only for development

# lib/my_app_web/router.ex
if Application.compile_env(:my_app, :dev_routes) do
  import Phoenix.LiveDashboard.Router

  scope "/dev" do
    pipe_through :browser
    live_dashboard "/dashboard", metrics: MyAppWeb.Telemetry
    forward "/mailbox", Plug.Swoosh.MailboxPreview
  end
end
```

**Rule 2: Disable `:debug_errors` in production endpoints and rely on `:render_errors` for sanitized pages**

Do not expose detailed stack traces or source code in production. Ensure `debug_errors: false` (the default) in your production `Endpoint` configuration and define `render_errors` to control how friendly error pages are rendered.

```elixir
# config/prod.exs
config :my_app, MyAppWeb.Endpoint,
  url: [host: "example.com", port: 443],
  # Leave debug_errors at its secure default (false) or set it explicitly
  debug_errors: false,
  # Use ErrorHTML / ErrorJSON views to present sanitized messages
  render_errors: [
    formats: [html: MyApp.ErrorHTML, json: MyApp.ErrorJSON],
    layout: false
  ]
```
