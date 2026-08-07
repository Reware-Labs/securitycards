# Security blueprint

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`

## Security posture

When developing applications within this repository, developers must assume a defense-in-depth posture where framework defaults handle basic output encoding, session handling, and database parameterization, but require explicit developer configuration for authorization scopes, input validation, and security headers. Security-sensitive surfaces include database queries, authentication plugs, file upload endpoints, custom channel joins, and runtime debug options. Mistakes regarding authorization, token verification, and redirect handling must always fail closed rather than assuming permissive defaults.

## Essential implementation rules

1. **Derive Authorization Scope from Server Assigns and Halt on Failure**

Always derive authorization checks and database query scopes from server-side assigns like `conn.assigns.current_user` or `%Scope{}` structs rather than trusting client parameters. Explicitly call `Plug.Conn.halt/1` inside custom authentication or authorization plugs to terminate request execution immediately upon failure, and enforce matching socket topic rules in channel `join/3` callbacks.

2. **Enforce Input Casting Boundaries and Strict Parameter Validation**

Explicitly specify allowed input keys in `Ecto.Changeset.cast/3` while excluding administrative or sensitive fields to prevent mass assignment, and apply strict constraints such as `validate_length/3` and `validate_number/3`. Read parameter origins explicitly using origin-specific connection accessors like `conn.body_params` or `conn.query_params` to avoid parameter shadowing discrepancies.

3. **Prevent SQL Injection and Unsafe Binary Deserialization**

Always parameterize dynamic values in Ecto queries using Ecto query syntax, parameter bindings in `fragment/2`, or parameter placeholders in raw SQL queries instead of string interpolation. Avoid standard binary deserialization and use `Plug.Crypto.non_executable_binary_to_term/2` with `[:safe]` for untrusted data.

4. **Use HEEx Templates for Safe HTML Encoding and Avoid Dynamic Code Execution**

Render untrusted data automatically and safely through HEEx templates and `render/3` without relying on unescaped HTML functions. Never pass untrusted user input into dynamic code evaluation or operating system command execution functions such as `Code.eval_string/3` or `System.cmd/3`.

5. **Protect Session State, Tokens, and Credentials Securely**

Use Argon2 as the password hashing library when generating authentication features, enforce `require_sudo_mode` for sensitive settings changes, and clear session state along with live socket disconnect broadcasts upon logout. Redact sensitive schema fields with `redact: true` and filter parameters from logs using `Phoenix.Logger.filter_values/2`.

6. **Enforce CSRF Protection, Security Headers, and Transport Security**

Include the `protect_from_forgery` plug and `put_secure_browser_headers` in all browser-facing pipelines while rendering CSRF token meta tags in root layouts. Configure endpoint `:force_ssl` in compile-time configuration to inject strict transport security headers.

7. **Sanitize File Uploads and Validate Internal Redirects**

Never rely directly on untrusted upload filenames from `Plug.Upload`, instead extracting metadata and assigning unique server-controlled identifiers when storing files, while enforcing explicit content type validations when serving them. Use relative path options for internal redirects to enforce server-side validation against open redirect attacks.

8. **Harden Runtime Environments and Restrict Resource Consumption**

Gate development-only routes and dashboards behind `:dev_routes` compile-time flags and keep `debug_errors: false` in production endpoints. Restrict local development listeners to loopback interfaces, set explicit channel transport limits on sockets, and enforce parser limits via `Plug.Parsers` to prevent resource exhaustion.
