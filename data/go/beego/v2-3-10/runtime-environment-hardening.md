# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: runtime environment hardening

## runtime environment hardening

### Configure Production RunMode and Disable Debug Settings

**Use when**

Deploying the Beego application to production environments where sensitive internals, error traces, and SQL debugging output must be hidden from end-users.

**Secure rules**

**Rule 1: Set the Beego RunMode to production and disable error rendering and ORM debugging.**

Configure `web.BConfig.RunMode` to `prod` and explicitly set `web.BConfig.EnableErrorsShow` and `web.BConfig.EnableErrorsRender` to `false` to prevent leaking internal stack traces and error messages during panics. Additionally, ensure `orm.Debug` is set to `false` in production to avoid exposing full SQL statements, parameters, and query execution times in log files.

```go
web.BConfig.RunMode = "prod"
web.BConfig.EnableErrorsShow = false
web.BConfig.EnableErrorsRender = false
orm.Debug = false
```
