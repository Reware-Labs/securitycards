# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: access control

## access control

### Enforce Resource-Level Access Control and Ownership Scopes in Context Functions

**Use when**

Developing data layer context functions, controllers, or channel callbacks where database queries and resource actions must be restricted to the authenticated user or tenant.

**Secure rules**

**Rule 1: Derive authorization context from server assigns and pass scope structs into context queries**

Always perform access control checks using authenticated identity stored in server-side assigns such as `conn.assigns.current_user` or `%Scope{}` structs. Never rely on user-supplied parameters in request bodies or query parameters to determine authorization or identity, and ensure all queries filter records by matching the user or tenant ID.

```elixir
def list_posts(%Scope{} = scope) do
  Repo.all(from post in Post, where: post.user_id == ^scope.user.id)
end
```

**Rule 2: Implement strict authorization checks inside Channel join callbacks**

Explicitly match topic patterns in `join/3` callbacks and evaluate access control checks against the socket assigns before permitting topic subscriptions.

```elixir
def join("room:" <> room_id, _params, socket) do
  if Accounts.can_access_room?(socket.assigns.current_user, room_id) do
    {:ok, socket}
  else
    {:error, %{reason: "unauthorized"}}
  end
end
```


### Halt Plug Execution on Access Control Failure

**Use when**

Writing custom authentication or authorization plugs where request execution must be immediately terminated upon failure.

**Secure rules**

**Rule 1: Call Plug.Conn.halt when access checks fail in custom plugs**

When writing custom authentication or authorization plugs, always call `Plug.Conn.halt(conn)` when access checks fail. Simply adding a redirect or flash message to the connection does not stop downstream plugs or controller actions from executing.

```elixir
defp authenticate(conn, _) do
  case Authenticator.find_user(conn) do
    {:ok, user} ->
      assign(conn, :user, user)
    :error ->
      conn
      |> put_flash(:error, "You must be logged in")
      |> redirect(to: ~p"/login")
      |> halt()
  end
end
```
