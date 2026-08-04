# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: authentication

## authentication

### Implement explicit credential verification and scope validation in Goa security handlers

**Use when**

When writing custom authentication handlers and security functions in Goa services to verify credentials, check token validity, and validate scopes.

**Secure rules**

**Rule 1: Perform thorough credential validation and verify scopes inside authentication handler functions**

Authentication functions such as `AuthAPIKeyFunc` receive credential strings along with scheme metadata. You must validate the authenticity of the credentials, verify scopes against the scheme using `scheme.Validate()`, and return a fully populated context containing the authenticated identity.

```go
func AuthenticateAPIKey(ctx context.Context, key string, scheme *security.APIKeyScheme) (context.Context, error) {
	user, err := validateAPIKey(key)
	if err != nil {
		return ctx, fmt.Errorf("invalid API key: %w", err)
	}
	if err := scheme.Validate(user.Scopes); err != nil {
		return ctx, fmt.Errorf("insufficient scope: %w", err)
	}
	return context.WithValue(ctx, userCtxKey, user), nil
}
```

**Rule 2: Implement manual token parsing, signature validation, and expiration checks in security handlers**

Goa security scheme definitions like `JWTSecurity` and `BearerSecurity` do not automatically validate or parse tokens at runtime. They only pass raw token strings to your security handler, meaning you must implement explicit cryptographic signature validation, expiration checking, and claim verification.

```go
var JWT = JWTSecurity("jwt", func() {
    Scope("api:read", "Read access")
})

Method("get_profile", func() {
    Security(JWT, func() {
        Scope("api:read")
    })
    Payload(func() {
        Token("token", String)
        Required("token")
    })
})
```


### Implement service-to-service authentication and credential validation in Goa

**Use when**

Developing inter-service communication and microservice endpoints where callers must authenticate using tokens, OAuth2 client credentials, or gRPC metadata.

**Secure rules**

**Rule 1: Define explicit security schemes and enforce them across services or methods using Goa's design DSL.**

Use schemes like `JWTSecurity`, `BearerSecurity`, or `OAuth2Security` with `ClientCredentialsFlow` to define machine-to-machine authentication requirements. Apply them to services or methods using `Security()` along with required scopes.

```go
var ServiceAuth = OAuth2Security("service_auth", func() {
    ClientCredentialsFlow("/oauth2/token", "/oauth2/refresh")
    Scope("svc:read", "Read access for service callers")
})

var _ = Service("internal_service", func() {
    Security(ServiceAuth, func() {
        Scope("svc:read")
    })
})
```

**Rule 2: Validate token signatures, validity, and required scopes within service authentication handlers.**

Implement authentication functions such as `AuthJWTFunc` or `AuthOAuth2Func` to verify incoming service tokens and explicitly validate required scopes using `s.Validate(scopes)` before injecting the verified caller identity into the context.

```go
func AuthenticateServiceJWT(ctx context.Context, token string, s *security.JWTScheme) (context.Context, error) {
	claims, err := parseAndVerifyServiceToken(token)
	if err != nil {
		return ctx, fmt.Errorf("unauthorized service token: %w", err)
	}
	if err := s.Validate(claims.Scopes); err != nil {
		return ctx, fmt.Errorf("insufficient service scopes: %w", err)
	}
	return context.WithValue(ctx, serviceIdentityKey, claims.Subject), nil
}
```

**Rule 3: Configure secure credential transport locations for gRPC service calls.**

Tag service authentication tokens in method payloads with metadata directives like `Meta("security:token")` so that `GRPCEndpointExpr.Finalize` automatically maps them into gRPC request metadata headers instead of standard request fields.

```go
var _ = Service("order_service", func() {
    Security(JWTAuth)
    Method("CreateOrder", func() {
        Payload(func() {
            Token("token", String, "Service identity token", func() {
                Meta("security:token")
            })
            Attribute("order_id", String)
        })
        GRPC(func() {
            Response(CodeOK)
        })
    })
})
```
