# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: escape hatch

## escape hatch

### Use Rocket Macro Attribute Routing Instead of Manual Routing

**Use when**

Defining web routes and handling parameters in a Rocket application.

**Secure rules**

**Rule 1: Use Rocket's standard attribute macros and request guards rather than manual routing.**

Manual routing bypasses Rocket's macro code generation and request parsing mechanisms, acting as an escape hatch that removes automatic parameter validation and type-checking security guarantees. Always prefer attribute macros like `#[get]` or `#[post]` to define routes securely.

```rust
#[get("/item/<id>")]
fn get_item(id: u64) -> String {
    format!("Item {}", id)
}
```
