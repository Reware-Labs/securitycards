# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: boundary control

## boundary control

### Enforce Middleware Boundaries by Isolating Public Routes

**Use when**

Structuring the router tree to ensure that authentication and authorization hoops are only applied to protected routes and do not inadvertently enclose public endpoints.

**Secure rules**

**Rule 1: Isolate public routes from protected sub-routers to prevent unauthorized access or unintended authentication requirements.**

Use distinct sibling routes and place authentication middleware only on sensitive branches of your router tree using the `.hoop()` method rather than applying it globally.

```rust
pub fn get_users_router() -> Router {
    Router::with_path("users")
        .push(Router::with_path("login").post(get_access_token))
        .push(Router::with_path("").post(create_users))
        .push(
            Router::with_path("{user_id}")
                .hoop(auth_user)
                .delete(delete_users)
                .push(Router::with_path("posts").get(get_posts_by_users)),
        )
}
```
