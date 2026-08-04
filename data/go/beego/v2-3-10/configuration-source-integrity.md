# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: configuration source integrity

## configuration source integrity

### Restrict Configuration Sources to Trusted Local Files and Controlled Deployment Artifacts

**Use when**

Loading YAML or JSON configuration files into Beego applications where environment variable interpolation is evaluated.

**Secure rules**

**Rule 1: Ensure configuration files originate exclusively from verified local filesystem locations or trusted deployment artifacts.**

Prevent untrusted user-supplied buffers or streams from being parsed by Beego configuration loaders, as automatic environment variable expansion can expose system environment variables. Load configuration files strictly from trusted paths using `config.NewConfig`.

```go
cnf, err := config.NewConfig("yaml", "/etc/myapp/config.yaml")
if err != nil {
    log.Fatalf("failed to load config: %v", err)
}

dbHost := cnf.DefaultString("database.host", "127.0.0.1")
```
