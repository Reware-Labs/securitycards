# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: runtime environment hardening

## runtime environment hardening

### Harden Container Runtime with Restricted Docker API Access and Privilege Restrictions

**Use when**

Configuring container deployment for Traefik to run with least privilege and reduced attack surface.

**Secure rules**

**Rule 1: Restrict Docker API access and enforce privilege restrictions**

Do not rely on a read-only Docker socket mount to restrict Docker API operations. Connect Traefik to an authorization-filtering Docker API proxy, and configure `no-new-privileges:true` to limit privilege escalation.

```yaml
services:
  traefik:
    image: "traefik:v3.7.10"
    security_opt:
      - no-new-privileges:true
    command:
      - "--providers.docker.endpoint=tcp://authorized-docker-api-proxy:2375"
```


### Secure and Validate Traefik Plugins and Module Trust Boundaries

**Use when**

Configuring, installing, or executing third-party and custom Go or WebAssembly plugins within Traefik.

**Secure rules**

**Rule 1: Restrict WASM plugin filesystem access with read-only mounts**

Enforce strict least-privilege filesystem boundaries by appending the `:ro` suffix to host directory mounts in WASM plugin settings where write access is not required.

```go
settings := Settings{
    Mounts: []string{
        "/var/www/static:/var/www/static:ro",
    },
}
```

**Rule 2: Validate remote plugin module descriptors and block path traversal**

Specify fully qualified module names, explicit non-empty versions, and unique module mappings while rejecting path traversal sequences like `..` or URL-encoded characters.

```yaml
experimental:
  plugins:
    plugin1:
      moduleName: "github.com/org/plugin1"
      version: "v1.0.0"
```

**Rule 3: Restrict unsafe package access in Go plugins**

Keep `settings.useUnsafe` set to `false` for Go plugins to prevent loading the `unsafe` and `syscall` packages unless explicitly audited and required.

```yaml
experimental:
  plugins:
    mywasmplugin:
      moduleName: "github.com/org/wasm-plugin"
      version: "v1.0.0"
      settings:
        useUnsafe: false
```

**Rule 4: Restrict WebAssembly plugin module paths to local directories**

Ensure manifest configuration references strictly local paths relative to the plugin directory and avoids absolute paths or directory traversal sequences.

```json
{
  "wasmPath": "bin/plugin.wasm"
}
```

**Rule 5: Limit environment variable exposure to WASM plugin instances**

Restrict `Settings.Envs` to public or non-sensitive configuration keys required by the WASM module, avoiding process-level host secrets or API tokens.

```go
settings := Settings{
    Envs: []string{"LOG_LEVEL", "APP_REGION"},
}
```

**Rule 6: Enforce hash verification when installing external plugins**

Always define and enforce expected module hashes when installing external plugins to ensure packages are validated against configured descriptors before extraction.

```go
plugin := Descriptor{
    ModuleName: "github.com/example/plugin",
    Version:    "v1.0.0",
    Hash:       "expected-sha256-hash",
}
err := manager.InstallPlugin(ctx, plugin)
```
