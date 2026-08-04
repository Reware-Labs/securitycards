# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: secret handling

## secret handling

### Load and configure sensitive client and database credentials securely using external stores and environment variables

**Use when**

When configuring authentication client secrets, database passwords, SSL key store passwords, and third-party service credentials in Quarkus applications.

**Secure rules**

**Rule 1: Avoid hardcoding plaintext credentials and secrets in source code or configuration files.**

Use Quarkus CredentialsProvider, MicroProfile config properties, or environment variables to inject sensitive values dynamically rather than committing plain text secrets into `application.properties`.

```properties
quarkus.oidc.auth-server-url=http://localhost:8180/realms/quarkus/
quarkus.oidc.client-id=quarkus-app
quarkus.oidc.credentials.client-secret.provider.key=mysecret-key
quarkus.oidc.credentials.client-secret.provider.name=oidc-credentials-provider
```

**Rule 2: Explicitly configure encryption keys for session management, token state, and form authentication.**

Supply static and robust encryption keys using configuration properties like `quarkus.http.auth.session.encryption-key` or `quarkus.oidc.token-state-manager.encryption-secret` instead of relying on runtime auto-generated keys that break across cluster nodes and restarts.

```properties
quarkus.http.auth.session.encryption-key=${FORM_AUTH_ENCRYPTION_KEY}
quarkus.http.auth.form.enabled=true
```
