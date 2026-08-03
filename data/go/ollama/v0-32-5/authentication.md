# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: authentication

## authentication

### Enforce Token Cookies and Server Security Settings for UI APIs

**Use when**

When configuring UI server instances and handling requests to application UI endpoints.

**Secure rules**

**Rule 1: Disable development mode in production to enforce token validation.**

Ensure `Server.Dev` is set to `false` when instantiating the UI server in production environments, ensuring incoming requests are properly authenticated via token cookies.

```go
s := &ui.Server{
    Logger: logger,
    Token:  requiredAuthToken,
    Dev:    false,
}
```

**Rule 2: Attach valid token cookies to API requests targeting protected UI server routes.**

Attach the secret token cookie matching the server configuration on every client request to avoid receiving HTTP 403 Forbidden rejection responses.

```go
req, err := http.NewRequest("POST", "http://localhost:11434/api/v1/settings", bytes.NewReader(body))
if err != nil {
    return err
}
req.Header.Set("Content-Type", "application/json")
req.AddCookie(&http.Cookie{
    Name:  "token",
    Value: authToken,
})
resp, err := client.Do(req)
```


### Validate Authentication Tokens and Realms in Registry Transfer Options

**Use when**

When building custom token handlers and download or upload options for communicating with protected model registries.

**Secure rules**

**Rule 1: Pass a dynamic GetToken callback to evaluate WWW-Authenticate challenges securely.**

Implement `GetToken` inside `DownloadOptions` or `UploadOptions` to inspect challenge parameters and fetch tokens securely without hardcoding credentials.

```go
err := transfer.Download(ctx, transfer.DownloadOptions{
    Blobs:   blobs,
    BaseURL: registryURL,
    DestDir: destDir,
    GetToken: func(ctx context.Context, challenge transfer.AuthChallenge) (string, error) {
        return tokenClient.FetchToken(ctx, challenge.Realm, challenge.Service, challenge.Scope)
    },
})
```

**Rule 2: Validate challenge realms and domains before issuing token requests.**

Ensure that challenge realm URLs match the expected registry host and trusted prefixes before returning authorization secrets to prevent leaking credentials to external hosts.

```go
opts := transfer.DownloadOptions{
    GetToken: func(ctx context.Context, challenge transfer.AuthChallenge) (string, error) {
        if !strings.HasPrefix(challenge.Realm, "https://registry.example.com/") {
            return "", errors.New("untrusted authentication realm")
        }
        return fetchAuthToken(ctx, challenge.Scope)
    },
}
```
