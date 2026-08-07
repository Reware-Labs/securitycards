# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: session management

## session management

### Clear Session State and Terminate Live Sockets on Logout

**Use when**

Implementing user logout flows in Phoenix web applications to ensure session state is completely invalidated and active WebSocket connections are terminated.

**Secure rules**

**Rule 1: Erase HTTP session data, delete session tokens from storage, and broadcast a disconnect event to active live sockets upon logout.**

When logging out a user, invoke `clear_session/1`, delete the resp cookie, and broadcast a disconnect message to the `live_socket_id` to terminate open channels and prevent token reuse.

```elixir
def log_out_user(conn) do
  user_token = get_session(conn, :user_token)
  user_token && Accounts.delete_user_session_token(user_token)

  if live_socket_id = get_session(conn, :live_socket_id) do
    YourAppWeb.Endpoint.broadcast(live_socket_id, "disconnect", %{})
  end

  conn
  |> delete_resp_cookie(@remember_me_cookie)
  |> clear_session()
  |> redirect(to: ~p"/")
end
```
