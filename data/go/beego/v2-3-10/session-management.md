# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: session management

## session management

### Configure Secure Cookie Attributes and Explicit Cryptographic Keys

**Use when**

Configuring session providers and cookie security attributes for web applications and API endpoints.

**Secure rules**

**Rule 1: Configure explicit static secret keys and enable secure cookie attributes.**

When initializing session providers, explicitly set static secret keys such as `securityKey` and `blockKey` to prevent Beego from generating transient random keys on startup, which invalidates active sessions across restarts. In addition, ensure `secure` or `CfgSecure` is enabled in production environments to restrict cookies to HTTPS channels.

```go
sessionConfig := session.NewManagerConfig(
    session.CfgCookieName("gosessionid"),
    session.CfgSetCookie(true),
    session.CfgSecure(true),
    session.CfgGcLifeTime(3600),
    session.CfgMaxLifeTime(3600),
    session.CfgProviderConfig("127.0.0.1:6379,100,,0,30"),
)
globalSessions, err := session.NewManager("redis", sessionConfig)
```

**Rule 2: Disable URL-based session tracking and restrict HTTPOnly usage.**

Keep `SessionDisableHTTPOnly` set to false and `SessionEnableSidInURLQuery` set to false to prevent token leakage via server logs, browser history, and Referer headers.

```go
web.BConfig.WebConfig.Session.SessionOn = true
web.BConfig.WebConfig.Session.SessionDisableHTTPOnly = false
web.BConfig.WebConfig.Session.SessionEnableSidInURLQuery = false
web.BConfig.WebConfig.Session.SessionCookieSameSite = http.SameSiteLaxMode
```


### Propagate Request Context and Promptly Release Session Resources

**Use when**

Managing session lifecycle scopes and cleaning up session resources in request handler routines.

**Secure rules**

**Rule 1: Pass active request context and release session resources upon request completion.**

Always invoke `SessionRelease` with the active HTTP request context (`r.Context()`) immediately after acquiring a session via `SessionStart` to ensure session persistence and network operations respect request cancellation and lifecycle scopes.

```go
func handleRequest(w http.ResponseWriter, r *http.Request) {
    sess := globalSessions.SessionStart(w, r)
    defer sess.SessionRelease(r.Context(), w)
    // Perform session operations safely
}
```


### Regenerate Session Identifiers Upon Authentication and Invalidate Tokens on Logout

**Use when**

Handling user authentication state changes, privilege elevation, and user logout workflows.

**Secure rules**

**Rule 1: Regenerate session identifiers immediately upon authentication or privilege elevation.**

Invoke session regeneration functions such as `SessionRegenerateID` or `SessionRegenerate` immediately after authenticating a user or changing privilege levels to assign a newly generated session ID and prevent session fixation attacks.

```go
func loginHandler(w http.ResponseWriter, r *http.Request) {
    sess, err := globalSessions.SessionRegenerateID(w, r)
    if err != nil {
        http.Error(w, "Session regeneration failed", http.StatusInternalServerError)
        return
    }
    sess.Set(r.Context(), "user_id", authenticatedUser.ID)
}
```

**Rule 2: Destroy session records when terminating a user session.**

Always invoke `SessionDestroy` when handling user logouts or terminating session states to ensure active session identifiers are invalidated and cannot be reused.

```go
func LogoutHandler(w http.ResponseWriter, r *http.Request) {
    globalSessions.SessionDestroy(w, r)
    http.Redirect(w, r, "/login", http.StatusFound)
}
```
