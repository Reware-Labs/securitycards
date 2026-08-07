# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: file handling

## file handling

### Sanitize and validate uploaded filenames and content types

**Use when**

When handling user file uploads using `Plug.Upload` and persisting or serving files.

**Secure rules**

**Rule 1: Sanitize untrusted filenames and assign unique server-controlled names when persisting uploaded files**

Never rely directly on untrusted upload filenames provided by `Plug.Upload` to prevent path traversal or file overwrites. Extract only necessary metadata such as the file extension and assign unique server-controlled identifiers when storing files.

```elixir
if upload = product_params["photo"] do
  extension = Path.extname(upload.filename)
  File.cp(upload.path, "/media/#{product.id}-cover#{extension}")
end
```

**Rule 2: Enforce explicit content type validation when serving uploaded user files**

Validate allowed content types on user-uploaded files rather than relying blindly on metadata when responding with stored file data.

```elixir
def view_photo(conn, %{"filename" => filename}) do
  case ImgServer.get(filename) do
    %{content_type: "image/png", bin: bin} ->
      conn
      |> put_resp_content_type("image/png")
      |> send_resp(200, bin)
    _ ->
      conn
      |> put_resp_content_type("text/plain")
      |> send_resp(400, "Invalid file type")
  end
end
```
