# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: network boundary

## network boundary

### Enforce Strict Loopback and Endpoint Allowlisting for Network Boundaries

**Use when**

Configuring network endpoints, proxy targets, remote model destinations, and subprocess bindings across trust boundaries.

**Secure rules**

**Rule 1: Validate remote model hostnames against allowed remote configurations.**

Ensure remote model requests target endpoints matching allowed remote domains specified in allowed remote configurations and environment variables.

```go
req := api.GenerateRequest{
    Model: "remote-model-alias",
    Prompt: "Summarize this context",
}
```

**Rule 2: Restrict production proxy target overrides to loopback addresses.**

In release mode, enforce strict validation of proxy target base URLs so that non-loopback HTTP endpoints are rejected and only loopback addresses are allowed.

```go
baseURL, signingHost, overridden, err := resolveCloudProxyBaseURL(overrideURL, gin.ReleaseMode)
if err != nil {
    return err
}
```

**Rule 3: Bind backend processes and local endpoints exclusively to loopback addresses.**

Restrict inter-process communication and local client connections by mapping wildcard hosts to loopback addresses such as `127.0.0.1`.

```go
os.Setenv("OLLAMA_HOST", "http://127.0.0.1:11434")
o := &OMP{}
if err := o.ConfigureWithModels("glm-5.1:cloud", models); err != nil {
    log.Fatalf("Failed to configure OMP models: %v", err)
}
```
