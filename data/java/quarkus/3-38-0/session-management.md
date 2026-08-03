# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: session management

## session management

### Configure Secure and HttpOnly Attributes for Session Cookies

**Use when**

Configuring session cookies and form authentication in Quarkus web applications to protect authentication state against cross-site scripting and unauthorized interception.

**Secure rules**

**Rule 1: Enable HttpOnly and Secure cookie attributes on form-based authentication and OIDC session configurations.**

Ensure that session cookies are protected by enabling HttpOnly and secure attributes to prevent client-side script access and unencrypted transmission.

```java
HttpAuthenticationMechanism formAuth = Form.builder()
    .httpOnlyCookie(true)
    .cookieSameSite(FormAuthConfig.CookieSameSite.STRICT)
    .timeout(Duration.ofMinutes(30))
    .cookieName("quarkus-credential")
    .build();
```


### Manage Server-Side and Local Session Invalidation on Logout

**Use when**

Implementing user logout workflows to ensure both server-side authentication state and local web session cookies are properly invalidated and destroyed.

**Secure rules**

**Rule 1: Invalidate server-side session state and clear local web session cookies during logout operations.**

Invoke the authentication mechanism logout method on the server side and redirect users through the appropriate logout endpoints to clear local session cookies.

```java
@Inject
SecurityIdentity identity;

@POST
@Path("/logout")
public Response logout() {
    if (identity.isAnonymous()) {
        throw new UnauthorizedException("Not authenticated");
    }
    FormAuthenticationMechanism.logout(identity);
    return Response.noContent().build();
}
```
