# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: secret handling

## secret handling

### Load Credentials and Secrets Securely from Environment Variables or External Providers

**Use when**

Configuring database connection strings, session providers, cache stores, logging targets, or configuration files that require sensitive credentials and authentication secrets.

**Secure rules**

**Rule 1: Load sensitive credentials and keys from environment variables instead of hardcoding them in source or configuration files.**

Always retrieve credentials such as database DSNs, API keys, passwords, and signing keys via environment variables or secret management services when initializing providers like `session.NewManager`, `orm.RegisterDataBase`, or logging targets. Avoid hardcoding plaintext secrets in static configuration or source files.

```go
dbDSN := os.Getenv("DATABASE_DSN")
orm.RegisterDataBase("default", "mysql", dbDSN, 30)
```
