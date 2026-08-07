# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: output encoding

## output encoding

### Use Phoenix view rendering and HEEx templates for automatic HTML output encoding

**Use when**

Rendering dynamic HTML responses and user input in Phoenix views and templates.

**Secure rules**

**Rule 1: Always use HEEx templates and `render/3` to render untrusted data automatically and safely escape it.**

Pass user parameters directly into HEEx templates or use `render/3` to benefit from Phoenix's built-in automatic output encoding. Avoid passing untrusted input into `raw/1` and do not manually construct unescaped HTML strings in controllers.

```elixir
def show(conn, %{"messenger" => messenger}) do
  render(conn, :show, messenger: messenger)
end
```
