# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: resource exhaustion

## resource exhaustion

### Limit socket channel counts and request parsing sizes to prevent resource exhaustion

**Use when**

Configuring Phoenix sockets, transports, and endpoint parsers to handle incoming client connections and payloads safely.

**Secure rules**

**Rule 1: Configure maximum channel limits per transport on Phoenix sockets to prevent process exhaustion.**

Set `max_channels_per_transport` on `Phoenix.Socket` definitions to restrict how many concurrent channels a single socket connection can join. This mitigates risks where malicious clients attempt to spawn thousands of BEAM process instances and exhaust server memory.

```elixir
defmodule MyAppWeb.UserSocket do
  use Phoenix.Socket, max_channels_per_transport: 20

  channel "room:*", MyAppWeb.RoomChannel

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end
```

**Rule 2: Configure upload size, read timeout, and parser limits in Plug.Parsers.**

Set explicit constraints like `:length`, `:read_length`, and `:read_timeout` on `Plug.Parsers` to protect against slowloris attacks and excessive resource consumption from large request payloads.

```elixir
plug Plug.Parsers,
  parsers: [:urlencoded, :multipart, :json],
  pass: ["*/*"],
  length: 8_000_000,
  read_length: 1_000_000,
  read_timeout: 15_000,
  json_decoder: Phoenix.json_library()
```
