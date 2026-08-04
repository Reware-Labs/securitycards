# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: authentication

## authentication

### Configure JWT Signature, Audience, and Issuer Validation

**Use when**

When establishing and verifying token-based identity credentials using JSON Web Tokens in Ktor server applications.

**Secure rules**

**Rule 1: Configure a valid signature verifier and validate claim requirements like audience, issuer, and key ID inside the jwt authentication block.**

Always supply signature verifiers and explicit claim checks to prevent accepting forged or cross-domain tokens. Ensure custom validation blocks return null when credentials fail validation requirements.

```kotlin
install(Authentication) {
    jwt {
        realm = "my-realm"
        verifier(issuer, audience, algorithm)
        validate { credential ->
            if (credential.payload.audience.contains(audience)) {
                JWTPrincipal(credential.payload)
            } else null
        }
    }
}
```


### Enforce Mutual TLS Authentication and Restrict Client Token Transmission

**Use when**

When configuring TLS mutual authentication or managing client authentication tokens and preemptive request headers.

**Secure rules**

**Rule 1: Configure key stores and trust managers explicitly when establishing mutual TLS connections.**

Supply valid client key stores and trust managers to ensure peers verify each other's identities correctly during handshakes.

```kotlin
val client = HttpClient(CIO) {
    engine {
        https {
            trustManager = caTrustStore.trustManagers.first()
            addKeyStore(clientKeyStore, password)
        }
    }
}
```

**Rule 2: Restrict `sendWithoutRequest` predicates in client auth plugins to avoid leaking credentials to unintended paths.**

Define strict matching criteria based on target URLs or paths in `sendWithoutRequest` rather than returning true unconditionally.

```kotlin
HttpClient {
    install(Auth) {
        basic {
            credentials { BasicAuthCredentials("MyUser", "SecretPassword") }
            sendWithoutRequest { request ->
                request.url.encodedPath.startsWith("/api/v1/protected")
            }
        }
    }
}
```


### Implement Mandatory Validation and Fallback Handlers for Authentication Providers

**Use when**

When configuring authentication plugins such as basic, digest, API key, and OAuth in Ktor applications to verify credentials and handle failures.

**Secure rules**

**Rule 1: Configure mandatory validation functions and return null when credentials fail verification checks.**

Always supply validate functions and digest providers for basic, digest, and API key authentication blocks so missing or invalid credentials properly trigger unauthenticated challenge responses.

```kotlin
install(Authentication) {
    basic("auth-basic") {
        realm = "ktor-app"
        validate { credentials ->
            if (credentials.name == "user" && credentials.password == "pass") {
                UserIdPrincipal(credentials.name)
            } else {
                null
            }
        }
    }
}
```

**Rule 2: Configure explicit fallback handlers for OAuth authentication flows to process errors gracefully.**

Set up explicit fallback blocks on OAuth authentication providers to handle authorization errors or failed token exchanges safely without exposing internal exceptions.

```kotlin
install(Authentication) {
    oauth("oauthProvider") {
        client = httpClient
        providerLookup = { oauthSettings }
        urlProvider = { "http://localhost/login/callback" }
        fallback = { cause ->
            if (cause is OAuth2RedirectError) {
                respondRedirect("/login?error=denied")
            } else {
                respond(HttpStatusCode.Forbidden, "OAuth exchange failed")
            }
        }
    }
}
```


### Protect Routing Endpoints and WebSocket Handshakes with Authentication Blocks

**Use when**

When securing HTTP routes, API key protected endpoints, or WebSocket connection handshakes in Ktor applications.

**Secure rules**

**Rule 1: Enclose protected routes and WebSocket endpoints within `authenticate` blocks referencing valid providers.**

Wrap all sensitive routes and WebSocket connections inside an `authenticate` block to ensure that unauthenticated requests are rejected before executing route logic.

```kotlin
install(Authentication) {
    apiKey("api-key") {
        validate { key ->
            if (key == "valid-key") UserIdPrincipal("user") else null
        }
    }
}

routing {
    authenticate("api-key") {
        get("/authenticated") {
            val principal = call.principal<UserIdPrincipal>()
            call.respond(principal!!)
        }
    }
}
```
