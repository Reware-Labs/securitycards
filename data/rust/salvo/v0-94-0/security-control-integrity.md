# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: security control integrity

## security control integrity

### Halt Execution on Authentication Failure in Custom Salvo Middleware

**Use when**

When writing custom authentication handlers or middleware in Salvo that need to reject unauthorized requests and prevent downstream handler execution.

**Secure rules**

**Rule 1: Call skip_rest() on FlowCtrl when an authentication failure occurs to halt the execution chain.**

When writing custom authentication handlers or middleware in Salvo, you must explicitly halt the routing execution chain on failure. Always retrieve the `FlowCtrl` parameter in your handler and call `ctrl.skip_rest()` immediately after setting the unauthorized response status to ensure Salvo does not continue executing downstream handlers in the routing table.

```rust
#[handler]
pub fn auth_middleware(res: &mut Response, ctrl: &mut FlowCtrl) {
    if !check_auth_header() {
        res.status_code(StatusCode::UNAUTHORIZED);
        res.render("Unauthorized Access");
        ctrl.skip_rest();
        return;
    }
}
```
