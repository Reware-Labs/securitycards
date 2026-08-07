# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: boundary control

## boundary control

### Validate internal redirect paths to prevent open redirects

**Use when**

Handling user-supplied return paths or redirect targets in Phoenix controllers to prevent open redirect vulnerabilities.

**Secure rules**

**Rule 1: Use relative path options for internal redirects to enforce server-side validation against open redirect attacks.**

Use `redirect(conn, to: ...)` for relative internal redirects to automatically block open redirect attacks. Phoenix strictly validates the path provided to `:to`, raising an `ArgumentError` on full URLs with hostnames, protocol-relative URLs, and encoding bypasses. Use `:external` explicitly when redirecting to trusted external URLs.

```elixir
def handle_redirect(conn, %{"return_to" => return_to}) do
  # Safe: Phoenix rejects external or malformed URLs passed to :to
  redirect(conn, to: return_to)
end

def handle_external_redirect(conn, %{"url" => url}) do
  # Safe: Require explicit opt-in via :external for trusted external URLs
  if trusted_domain?(url) do
    redirect(conn, external: url)
  else
    conn |> send_resp(400, "Invalid URL")
  end
end
```
