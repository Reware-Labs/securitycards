# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: deserialization

## deserialization

### Use safe binary deserialization for untrusted data

**Use when**

Deserializing binary data from untrusted sources in Phoenix or Plug applications.

**Secure rules**

**Rule 1: Avoid binary_to_term and use non_executable_binary_to_term for untrusted data**

Do not decode binary data from untrusted sources using `:erlang.binary_to_term/2` even when passing the `[:safe]` option because it does not prevent the creation of executable terms. Use `Plug.Crypto.non_executable_binary_to_term/2` with `[:safe]` instead.

```elixir
Plug.Crypto.non_executable_binary_to_term(user_input, [:safe])
```
