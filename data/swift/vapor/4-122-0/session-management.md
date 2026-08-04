# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: session management

## session management

### Configure Secure Session Cookies and Destroy Sessions on Logout

**Use when**

Configuring session cookie attributes, registering session middleware, and terminating user sessions in Vapor applications.

**Secure rules**

**Rule 1: Explicitly destroy sessions on logout to invalidate server storage and clear client cookies.**

Call `req.session.destroy()` during logout handling to remove session records from backend storage and clear the session cookie on the client side.

```swift
app.get("logout") { req -> HTTPStatus in
    req.session.destroy()
    return .ok
}
```
