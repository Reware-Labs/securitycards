# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: file handling

## file handling

### Configure and Secure Static File Serving and Delivery

**Use when**

Configuring asset delivery, middleware stacks, and reverse proxy offloading for public static files.

**Secure rules**

**Rule 1: Disable the built-in static file server when an upstream web server or CDN handles assets.**

Set `config.public_file_server.enabled` to false in production environments where a reverse proxy handles asset delivery to reduce the application attack surface and conserve runtime resources.

```ruby
Rails.application.configure do
  config.public_file_server.enabled = false
end
```

**Rule 2: Configure security headers and offload static file delivery to upstream servers.**

When using `ActionDispatch::Static`, define security headers like `X-Content-Type-Options` via `config.public_file_server.headers` and offload file streaming to upstream web servers using `config.action_dispatch.x_sendfile_header`.

```ruby
Rails.application.configure do
  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?
  config.public_file_server.headers = {
    "Cache-Control" => "public, max-age=31536000",
    "X-Content-Type-Options" => "nosniff"
  }
  config.action_dispatch.x_sendfile_header = "X-Accel-Redirect"
end
```


### Prevent Path Traversal When Serving Files via send_file

**Use when**

When handling file download requests where file paths are determined using user-controlled parameters or cookies.

**Secure rules**

**Rule 1: Avoid passing user input directly to `send_file` and instead map input to trusted database records or absolute paths.**

Accepting unvalidated user input to locate files on disk permits path traversal attacks. Always look up records securely via database queries, construct paths using `Rails.root.join`, and verify existence via `File.exist?` before calling `send_file`.

```ruby
class ClientsController < ApplicationController
  def download_pdf
    client = Client.find(params[:id])
    file_path = Rails.root.join("files", "clients", "#{client.id}.pdf")

    if File.exist?(file_path)
      send_file(file_path, filename: "#{client.name}.pdf", type: "application/pdf")
    else
      head :not_found
    end
  end
end
```
