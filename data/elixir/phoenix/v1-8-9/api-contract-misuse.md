# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: api contract misuse

## api contract misuse

### Verify HTTP Status Codes for Controller Error Handling

**Use when**

When testing Phoenix controllers to ensure domain-level exceptions and resource lookup failures map correctly to expected HTTP status codes.

**Secure rules**

**Rule 1: Use assert_error_sent to verify correct HTTP status mapping for resource lookup failures in controller tests.**

Always verify that domain-level exceptions during request processing map to appropriate HTTP status codes like `404` rather than exposing internal failure details, by wrapping the request in `assert_error_sent`.

```elixir
test "returns 404 for deleted or non-existent post", %{conn: conn, post: post} do
  conn = delete(conn, ~p"/posts/#{post}")
  assert redirected_to(conn) == ~p"/posts"

  assert_error_sent 404, fn ->
    get(conn, ~p"/posts/#{post}")
  end
end
```
