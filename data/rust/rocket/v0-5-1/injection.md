# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: injection

## injection

### Use parameterized queries when querying databases with rocket_db_pools

**Use when**

When executing database queries via `rocket_db_pools` and SQL drivers like `sqlx` in Rocket request handlers.

**Secure rules**

**Rule 1: Bind untrusted request parameters safely using query placeholders instead of string formatting or concatenation.**

Always use parameterized query placeholders and parameter binding methods such as `sqlx::query` with `.bind()` or compile-time macros like `sqlx::query!` rather than formatting or concatenating untrusted request inputs directly into SQL strings. This protects your application against SQL injection vulnerabilities.

```rust
#[get("/")]
async fn read(mut db: Connection<Logs>, id: i64) -> Option<String> {
    sqlx::query("SELECT content FROM logs WHERE id = ?")
        .bind(id)
        .fetch_one(&mut **db)
        .await
        .and_then(|r| Ok(r.try_get(0)?))
        .ok()
}
```
