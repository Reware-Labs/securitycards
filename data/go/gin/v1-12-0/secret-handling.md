# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: secret handling

## secret handling

### Redact Query Strings and Sensitive Headers in Application Logs

**Use when**

Configuring request logging and panic recovery middleware to prevent sensitive credentials, tokens, and query parameters from appearing in log outputs.

**Secure rules**

**Rule 1: Configure the Gin request logger to skip query string output and prevent sensitive parameters from exposure.**

Set `SkipQueryString: true` within `gin.LoggerConfig` when initializing the request logger so that URL query parameters containing credentials or tokens are omitted from log files.

```go
loggerConfig := gin.LoggerConfig{
    SkipQueryString: true,
}
router.Use(gin.LoggerWithConfig(loggerConfig))
```

**Rule 2: Sanitize or omit custom credentials and non-authorization headers in custom recovery handlers.**

Implement a custom recovery handler using `gin.CustomRecovery` to log generic error details without dumping unmasked sensitive headers, cookies, or request bodies that are not automatically masked by default recovery mechanisms.

```go
router := gin.New()
router.Use(gin.CustomRecovery(func(c *gin.Context, err any) {
    log.Printf("[Recovery] Panic caught on %s %s: %v", c.Request.Method, c.Request.URL.Path, err)
    c.AbortWithStatus(http.StatusInternalServerError)
}))
```


### Keep credentials out of source and store user secrets encrypted

**Use when**

Configuring credentials for a Gin application, or persisting secret values that users submit.

**Secure rules**

**Rule 1: Load credentials from the environment, and reserve `gin.BasicAuth` for fixed operator accounts.**

`gin.BasicAuth(gin.Accounts{...})` holds every password in cleartext, and writing that map as a literal commits credentials to source control and to every image built from it. Read the values from the environment for the few fixed accounts this middleware suits. For accounts end users register it is the wrong shape: authenticate against a stored password hash so no reversible credential exists on the server.

```go
router := gin.Default()

// A fixed operator account, credential supplied at deploy time.
admin := router.Group("/internal", gin.BasicAuth(gin.Accounts{
    os.Getenv("ADMIN_USER"): os.Getenv("ADMIN_PASSWORD"),
}))
admin.GET("/metrics", metricsHandler)

// End-user accounts authenticate against a stored hash, not this map.
router.POST("/login", loginWithPasswordHash)
```

**Rule 2: Encrypt recoverable secrets before writing them to storage.**

Some values have to be readable again — a stored API key, a token replayed to a third party — so hashing is not an option. Encrypt with an authenticated cipher and store only the ciphertext; AES-GCM also detects tampering, given a nonce never repeated under one key, which a fresh `crypto/rand` draw per message provides.

Resolve the key **once at startup**, never inside the handler, and never generate a random one as a fallback: it differs on each restart and across workers, so everything already stored becomes permanently unreadable — silent data loss that surfaces as a decrypt or authentication error. Where no dedicated key is configured, derive one deterministically from the application secret you already have.

```go
// Resolved once at startup, never per request.
var vaultKey = loadVaultKey()

func loadVaultKey() []byte {
    if raw := os.Getenv("VAULT_ENCRYPTION_KEY"); raw != "" {
        if key, err := base64.StdEncoding.DecodeString(raw); err == nil {
            return key
        }
    }
    // Deterministic derivation: stable across restarts and across workers.
    sum := sha256.Sum256([]byte("vault-encryption|" + os.Getenv("APP_SECRET")))
    return sum[:]
}

func encryptSecret(plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(vaultKey) // 32 bytes for AES-256
    if err != nil {
        return nil, err
    }
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    nonce := make([]byte, gcm.NonceSize())
    if _, err := rand.Read(nonce); err != nil {
        return nil, err
    }
    // Nonce is prefixed to the ciphertext so decryption can recover it.
    return gcm.Seal(nonce, nonce, plaintext, nil), nil
}
```
