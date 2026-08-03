# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: session management

## session management

### Clear session state and invalidate cookies securely on logout

**Use when**

Handling user logout actions and terminating active session states in Ktor server applications.

**Secure rules**

**Rule 1: Explicitly clear server-side session state and invalidate client session cookies during user logout.**

Always clear session state explicitly using `call.sessions.clear<SessionType>()` when executing logout actions, and ensure session cookie configurations correctly preserve security flags while handling termination. When invalidating cookies via `call.response.cookies.append`, supply `maxAge = -1` or `0` alongside matching domain and path attributes so the browser successfully drops the token.

```kotlin
routing {
    authenticate("auth-session") {
        get("/logout") {
            call.sessions.clear<UserSession>()
            call.respondRedirect("/login")
        }
    }
}
```


### Enforce secure transport attributes and server-side storage for sensitive session cookies

**Use when**

Configuring session storage backends, cookie flags, and secure transport mechanisms.

**Secure rules**

**Rule 1: Configure server-side session storage and enforce strict secure flags on session cookies to prevent exposure.**

Supply a server-side `SessionStorage` implementation when configuring sessions containing sensitive user data so that only a random identifier is sent to the client. Set `cookie.secure = true` and appropriate `SameSite` policies to restrict transmission to encrypted connections and prevent interception or cross-site leakage.

```kotlin
val sessionStorage = SessionStorageMemory()

install(Sessions) {
    cookie<UserSession>("MY_SESSION", sessionStorage) {
        cookie.maxAge = 3600.seconds
        cookie.httpOnly = true
        cookie.secure = true
    }
}
```


### Validate session identifiers and authenticate session principals on incoming requests

**Use when**

Processing incoming requests and verifying session authenticity in protected routes.

**Secure rules**

**Rule 1: Verify that session lookup and authentication hooks successfully resolve valid, non-null session principals.**

Configure session authentication with an explicit `validate` block that checks session validity, and always check for null when fetching session data via `call.sessions.get<T>()`. Unrecognized or expired session identifiers should immediately trigger invalidation or return unauthorized responses.

```kotlin
install(Sessions) {
    cookie<UserSession>("SESSION_ID", storage)
}

routing {
    get("/protected") {
        val session = call.sessions.get<UserSession>()
        if (session == null) {
            call.respond(HttpStatusCode.Unauthorized, "Invalid or expired session")
            return@get
        }
        call.respondText("Welcome, ${session.userId}")
    }
}
```
