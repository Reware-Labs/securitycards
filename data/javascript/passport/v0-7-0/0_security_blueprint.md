# Security blueprint

Repository: `https://github.com/jaredhanson/passport#v0.7.0`

## Security posture

When developing with Passport, authentication strategies and middleware restore login state but rely on application-level guards to explicitly protect sensitive endpoints and prevent unauthenticated access. Developers must handle session fixation and state management securely, ensuring proper lifecycle configuration and custom callback handling. Security-sensitive surfaces include authentication routes, session deserialization hooks, and multi-tenant authentication contexts where failures must fail closed.

## Essential implementation rules

1. **Protect Sensitive Routes with Explicit Authentication Guards**

Passport’s session strategy allows unauthenticated requests to flow through the middleware stack. Insert a guard that verifies `req.isAuthenticated()` or the presence of `req.user` before route logic runs to protect sensitive endpoints.

2. **Prevent Session Fixation by Managing Session State Securely**

Rely on Passport's default `req.login()` behavior which regenerates and clears the session to protect against session fixation. Enable `{ keepSessionInfo: true }` only after thoroughly auditing pre-authentication session content to ensure no sensitive or unintended state carries across the login boundary.

3. **Provide Callbacks for Asynchronous Login and Logout Methods**

Always pass a callback function as the final argument when invoking `req.login()` and `req.logout()` to ensure proper session handling and prevent unhandled exceptions.

4. **Verify User Existence and Status in Deserialization**

Inside `passport.deserializeUser()`, verify that the user ID stored in the session exists and that the account is active. Pass `done(null, false)` if the user is missing or disabled rather than returning an invalid user object or throwing an exception.

5. **Explicitly Handle Authentication Results in Custom Callbacks**

When using a custom callback with `passport.authenticate()`, explicitly check if the user argument is `false` to handle failures securely, as sessions are not established automatically. Call `req.logIn()` explicitly upon successful authentication.

6. **Override Strategy Failure Messages to Mitigate User Enumeration**

When configuring authentication routes with `passport.authenticate()`, override strategy-provided failure messages using `failureFlash` to present standardized generic error messages instead of raw internal strategy details.

7. **Isolate Authentication Contexts Using Separate Instances**

Prevent configuration leakage and cross-tenant authentication bypasses by instantiating separate Passport instances via `new Passport()` rather than using the global default singleton when building multi-tenant or decoupled sub-applications.

8. **Suppress Unwanted Metadata When Assigning Authentication Properties**

When using the `assignProperty` option with `passport.authenticate()`, pass `authInfo: false` to prevent `req.authInfo` from being populated by default and exposed to downstream middleware or API responses.
