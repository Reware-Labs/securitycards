# Security blueprint

Repository: `https://github.com/gin-gonic/gin#v1.12.0`

## Security posture

The Gin framework provides a lightweight routing and middleware foundation for building HTTP services, relying heavily on developer configuration to secure transport boundaries, authentication flows, and data binding. It does not automatically validate business logic constraints, restrict trusted proxy headers, or configure session cookie flags by default. Developers must enforce strict input contracts, configure explicit trusted proxy ranges, and apply proper output encoding or safe cookie flags to prevent injection and session compromise.

## Essential implementation rules

1. **Return Immediately After Aborting Request in Auth Middleware**

Explicitly invoke `return` immediately after calling `c.Abort()`, `c.AbortWithStatus()`, or `c.AbortWithError()` in authorization or authentication middleware to prevent downstream handlers and subsequent security checks from executing.

2. **Validate HTTP Status Codes Before Redirecting**

Ensure status codes passed to `render.Redirect` are strictly valid HTTP redirect status constants from `net/http` such as `http.StatusFound` to prevent runtime panics.

3. **Authenticate via BasicAuth and Context Keys**

Use `gin.BasicAuth` for credential verification and retrieve authenticated identities exclusively via `c.MustGet(gin.AuthUserKey)` or `c.Get(gin.AuthUserKey)` in downstream handlers.

4. **Configure Secure Cookie Attributes and SameSite Policy**

Always invoke `c.SetSameSite` with lax or strict modes prior to calling `c.SetCookie`, and enforce `secure = true` and `httpOnly = true` on all session tokens to prevent cross-site request forgery and client-side script theft.

5. **Sanitize Uploaded Filenames and Restrict Static File Paths**

Strip untrusted path information from multipart form uploads using `filepath.Base` before saving files, and confine custom file paths or static routing roots within designated safe directories without enabling directory listing.

6. **Enforce Strict Input Contracts and Validate Parameters**

Define explicit struct tags such as `binding:"required"` and use `ShouldBind`, `ShouldBindJSON`, or `BindUri` to reject unvalidated payloads and URI path parameters before processing core logic.

7. **Configure Escaped Paths and Trusted Proxies**

Set `router.UseEscapedPath = true` to evaluate raw percent-encoded paths, and explicitly configure trusted proxy IP ranges via `SetTrustedProxies` while handling error returns to prevent client IP spoofing and header injection.

8. **Limit Multipart Upload Memory Allocation**

Explicitly set `router.MaxMultipartMemory` to an appropriate limit to prevent concurrent large multipart form uploads from exhausting server RAM and causing a denial of service.

9. **Run in Release Mode in Production**

Configure Gin's execution mode to `gin.ReleaseMode` during application startup to prevent leaking sensitive application internal information, full route tables, and debug outputs.

10. **Redact Sensitive Data in Logs and Preserve Error Status Codes**

Configure loggers to skip query strings using `SkipQueryString: true` and implement custom recovery handlers using `CustomRecovery` to catch panics, log generic error details safely, and preserve aborted HTTP status codes.
