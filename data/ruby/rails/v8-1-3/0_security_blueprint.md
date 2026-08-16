# Security blueprint

Repository: `https://github.com/rails/rails#v8.1.3`

## Security posture

Developers working within this repository must assume a defense-in-depth posture where framework defaults handle standard transport hardening, automatic parameter escaping, and basic CSRF protection, but explicit configuration remains mandatory for access controls, serialization safety, and session handling. Security-sensitive surfaces include parameter inputs, database querying layers, cryptographic message boundaries, and authentication state transitions. Any ambiguity in identity, authorization checks, or cryptographic verification must fail closed.

## Essential implementation rules

1. **Enforce Resource Ownership and Strong Parameter Contracts**

Scope all Active Record lookups through authenticated user associations using constructs like `Current.user.wishlists.find(params[:id])` rather than global queries to prevent IDOR vulnerabilities. Always require and permit incoming HTTP request parameters using `params.expect` or `params.permit` prior to mass-assignment.

2. **Secure Authentication and Session Lifecycle Transitions**

Utilize built-in helpers such as `authenticate_or_request_with_http_token` and perform credential verification with constant-time comparisons via `ActiveSupport::SecurityUtils.secure_compare`. Always call `reset_session` during authentication state changes or logouts to prevent session fixation, and configure session cookies with `secure`, `httponly`, and appropriate `same_site` attributes.

3. **Prevent SQL Injection and Bypass Misuse**

Always use parameterized queries, positional placeholders, or hash conditions with ActiveRecord query methods rather than raw string interpolation. Treat `Arel.sql` as restricted to hardcoded literals and never pass unvalidated user input directly into it.

4. **Harden Cryptographic Messaging and Deserialization**

Attach explicit `:purpose` options and expiration constraints when encrypting, signing, or verifying messages to prevent replay and context confusion attacks. Configure cookie stores and message encryptors to use safe non-Marshal serializers like JSON or MessagePack, and rescue `ActiveSupport::MessageEncryptor::InvalidMessage` during decryption.

5. **Enforce Strict CSRF Protection and Route Constraints**

Enable request forgery protection using `protect_from_forgery with: :exception` or `:null_session` for stateless APIs, and ensure state-changing forms use `form_with` or embed authenticity tokens. Restrict dynamic routes with explicit verb options and regex constraints on parameters.

6. **Sanitize Outputs and Protect Static Files**

Rely on standard ERB interpolation for automatic HTML auto-escaping and avoid bypassing encoding with the `raw` helper; when a feature must emit caller-supplied HTML, pass it through the `sanitize` helper with an explicit allowlist, and strip control characters from untrusted values before writing them to logs. Disable built-in static file servers when upstream reverse proxies handle asset delivery, and prevent path traversal by validating file download paths against database records using `Rails.root.join` and `File.exist?`.

7. **Secure Production Environments and Sensitive Data Logs**

Ensure `config.consider_all_requests_local` is explicitly set to `false` in production to suppress detailed exception backtraces, and configure `config.filter_parameters` to sanitize sensitive values such as passwords, tokens, and credentials from application logs.

8. **Keep Untrusted Input Out of Code Execution**

Never evaluate request data with `eval` or compile it as an ERB template, and never resolve a method or class name from parameters via `send`, `public_send`, or `constantize`. Map approved identifiers to fixed methods, classes, or operations so request data can never select arbitrary code to run.
