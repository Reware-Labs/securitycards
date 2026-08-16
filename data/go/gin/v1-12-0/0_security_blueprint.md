# Security blueprint

Repository: `https://github.com/gin-gonic/gin#v1.12.0`

## Security posture

The Gin framework provides a lightweight routing and middleware foundation for building HTTP services, relying heavily on developer configuration to secure transport boundaries, authentication flows, and data binding. Gin validates the shape of a request but not the meaning of its values, so query construction, command execution, path resolution, response encoding, and credential storage are left to the handler. It does not bound request bodies, set connection timeouts, restrict trusted proxy headers, or configure session cookie flags by default.

## Essential implementation rules

1. **Bind SQL Values as Placeholders and Run Commands as Argument Slices**

Pass request values to `database/sql` as `?` or `$1` placeholders, and pick column names or sort directions from a map defined in code. Build commands with `exec.Command(name, args...)` rather than `sh -c`, rejecting request-derived arguments that begin with `-`.

2. **Store Passwords as bcrypt Hashes and Draw Tokens from crypto/rand**

Hash passwords with `bcrypt.GenerateFromPassword` from `golang.org/x/crypto/bcrypt` rather than storing plaintext or a bare `sha256`/`md5` digest, generate session identifiers with `crypto/rand`, and compare secrets using `subtle.ConstantTimeCompare` or `hmac.Equal`.

3. **Encode Untrusted Data for the Response Context**

Serve stored user content as `text/plain; charset=utf-8` with `X-Content-Type-Options: nosniff`, render markup through `html/template` via `LoadHTMLGlob` and `c.HTML` rather than string concatenation, and strip control characters from request data before logging it.

4. **Take the Acting Identity from the Verified Credential**

Store the verified subject with `c.Set` in authentication middleware and read it with `c.Get`, keying every lookup on that value rather than an identifier supplied in the payload. Register the middleware on a `router.Group`, and answer `403` on a mismatch.

5. **Return Immediately After Aborting Request in Auth Middleware**

Explicitly invoke `return` immediately after calling `c.Abort()`, `c.AbortWithStatus()`, or `c.AbortWithError()` in authorization or authentication middleware to prevent downstream handlers and subsequent security checks from executing.

6. **Parse Templates from Your Own Files, Never from Request Data**

Load templates once at startup with `LoadHTMLGlob` and pass request data in only as the data argument to `c.HTML`, so `html/template` escapes it per context rather than executing it.

7. **Confine File Paths and Archive Members**

Strip untrusted path information from uploads with `filepath.Base` before saving, confine custom paths and static roots to intended directories without directory listing, and reject archive members that fail `filepath.IsLocal` or escape the extraction root.

8. **Enforce Strict Input Contracts and Validate Parameters**

Define explicit struct tags such as `binding:"required"` and use `ShouldBind`, `ShouldBindJSON`, or `BindUri` to reject unvalidated payloads and URI path parameters before processing core logic.

9. **Bound Request Bodies, Connections, and Caller-Driven Work**

Cap bodies with `http.MaxBytesReader` and set explicit timeouts on an `http.Server` rather than relying on `router.Run`. Give external processes a deadline via `exec.CommandContext`, keep caller-supplied patterns out of `regexp`, and bound decompression with `io.LimitReader`.

10. **Keep Credentials Out of Source and Encrypt Stored Secrets**

Load credentials from the environment rather than a `gin.Accounts` literal, reserve `gin.BasicAuth` for fixed operator accounts and authenticate end users against a stored password hash, and encrypt recoverable secrets with AES-GCM under an environment-supplied key.

11. **Configure Secure Cookie Attributes and SameSite Policy**

Always invoke `c.SetSameSite` with lax or strict modes prior to calling `c.SetCookie`, and enforce `secure = true` and `httpOnly = true` on all session tokens to prevent cross-site request forgery and client-side script theft.

12. **Configure Escaped Paths and Trusted Proxies**

Set `router.UseEscapedPath = true` to evaluate raw percent-encoded paths, and explicitly configure trusted proxy IP ranges via `SetTrustedProxies` while handling error returns to prevent client IP spoofing and header injection.

13. **Run in Release Mode in Production**

Configure Gin's execution mode to `gin.ReleaseMode` during application startup to prevent leaking sensitive application internal information, full route tables, and debug outputs.

14. **Redact Sensitive Data in Logs and Preserve Error Status Codes**

Configure loggers to skip query strings using `SkipQueryString: true` and implement custom recovery handlers using `CustomRecovery` to catch panics, log generic error details safely, and preserve aborted HTTP status codes.

15. **Validate HTTP Status Codes Before Redirecting**

Ensure status codes passed to `render.Redirect` are strictly valid HTTP redirect status constants from `net/http` such as `http.StatusFound` to prevent runtime panics.
