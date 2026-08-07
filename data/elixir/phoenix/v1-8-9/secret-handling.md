# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: secret handling

## secret handling

### Redact Sensitive Parameter Values in Application Logs

**Use when**

When processing or logging request parameters, custom data maps, or schema fields containing sensitive credentials and tokens.

**Secure rules**

**Rule 1: Filter sensitive parameter values in application logs to prevent secret leakage**

Use `Phoenix.Logger.filter_values/2` or precompiled filters created with `Phoenix.Logger.compile_filter/1` to scrub sensitive data such as passwords and tokens from logs.

```elixir
params = %{"username" => "alice", "password" => "secret123"}
sanitized = Phoenix.Logger.filter_values(params, ["password"])
```

**Rule 2: Redact sensitive schema fields with `redact: true`**

When defining Ecto schemas, mark secrets such as raw passwords and password hashes with `redact: true`. Ecto will automatically derive the `Inspect` protocol for the struct, omitting redacted fields from logs and interactive consoles, so sensitive data never appears in inspect output.

```elixir
defmodule MyApp.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :hashed_password, :string, redact: true
    field :confirmed_at, :utc_datetime_usec
    timestamps()
  end
end
```
