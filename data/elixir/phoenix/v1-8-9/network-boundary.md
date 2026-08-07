# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: network boundary

## network boundary

### Restrict Endpoint Network Interfaces in Non-Production Environments

**Use when**

Configuring local development endpoint server listeners and network interface bindings in Phoenix applications.

**Secure rules**

**Rule 1: Restrict local development endpoint server listeners to loopback IP addresses.**

Configure wider network interface bindings only within runtime production configuration and explicitly set the loopback address in development endpoint settings using `ip: {127, 0, 0, 1}`.

```elixir
# config/dev.exs
config :my_app, MyAppWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}]
```
