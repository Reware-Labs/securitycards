# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: network boundary

## network boundary

### Configure Trusted Proxy Ranges and Host Authorization to Secure Network Boundaries

**Use when**

When deploying Fiber applications behind reverse proxies, load balancers, or when configuring server network and transport security settings.

**Secure rules**

**Rule 1: Explicitly configure trusted proxy IP addresses and header settings when enabling proxy trust.**

Always set `TrustProxy` to true and define explicit IP addresses or network CIDR ranges in `TrustProxyConfig.Proxies` to prevent untrusted clients from spoofing IP addresses, schemes, and hostnames.

```go
app := fiber.New(fiber.Config{
    TrustProxy: true,
    TrustProxyConfig: fiber.TrustProxyConfig{
        Proxies: []string{"10.0.0.0/8", "192.168.1.100"},
        Private: true,
    },
})
```

**Rule 2: Validate incoming Host headers using host authorization middleware.**

Configure `hostauthorization` middleware with explicit allowed hosts or domain lists to protect against DNS rebinding and host header injection attacks.

```go
app.Use(hostauthorization.New(hostauthorization.Config{
    AllowedHosts: []string{"example.com", "*.example.com"},
}))
```

**Rule 3: Enforce TLS encryption on server and client connections.**

Secure server-to-server and client communication by configuring TLS certificates on the Fiber server via `fiber.ListenConfig` and binding trusted CA certificates using `SetTLSConfig` on the Fiber HTTP client.

```go
err := app.Listen(":3000", fiber.ListenConfig{
    CertFile:    "ssl.cert",
    CertKeyFile: "ssl.key",
})

cc := client.New()
cc.SetTLSConfig(&tls.Config{
    RootCAs: certPool,
})
```
