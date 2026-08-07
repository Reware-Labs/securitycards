# Security cards

Repository: `https://github.com/phoenixframework/phoenix#v1.8.9`
Category: cryptography

## cryptography

### Select robust password hashing algorithms during generation

**Use when**

When generating authentication features or configuring password hashing for user credentials.

**Secure rules**

**Rule 1: Use Argon2 as the password hashing library when server compute resources permit.**

Pass the `--hashing-lib argon2` flag when running `mix phx.gen.auth` to ensure user credentials are more resistant to offline brute-force attacks compared to standard bcrypt or pbkdf2.

```bash
mix phx.gen.auth Accounts User users --hashing-lib argon2
```
