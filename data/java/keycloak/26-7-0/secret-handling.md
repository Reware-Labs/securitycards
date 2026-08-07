# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: secret handling

## secret handling

### Protect Stored CLI Configuration and Secrets in Local Environments

**Use when**

When running Admin CLI commands or configuring local tool sessions that generate configuration files containing active tokens.

**Secure rules**

**Rule 1: Keep Client Registration CLI configuration private or avoid persisting it**

Do not make `~/.keycloak/kcreg.config` visible to other system users because it contains access tokens and secrets. To avoid storing these credentials in a configuration file, use `--no-config` with every `kcreg` command and provide the required authentication information on each invocation.

```bash
kcreg.sh create --no-config -s clientId=myclient -t "$INITIAL_TOKEN"
```


### Secure Secrets in Configuration Files and Realm Exports

**Use when**

When managing realm configurations, import files, client settings, and database parameters without exposing plaintext credentials.

**Secure rules**

**Rule 1: Use environment-variable placeholders for secrets in maintained realm import files**

Do not place literal production secrets in realm configuration files maintained in source control. Use Keycloak’s `${ENVIRONMENT_VARIABLE}` placeholder syntax so sensitive values are supplied from the deployment environment during import.

```json
{
  "realm": "production",
  "clients": [
    {
      "clientId": "test-app",
      "secret": "${TEST_APP_CLIENT_SECRET}"
    }
  ],
  "smtpServer": {
    "host": "smtp.example.com",
    "user": "${SMTP_USER}",
    "password": "${SMTP_PASSWORD}"
  }
}
```

**Rule 2: Store database passwords securely using environment variables or configuration files instead of command-line arguments.**

Do not supply database passwords directly via CLI arguments like `--db-password`. Pass database passwords using `conf/keycloak.conf`, environment variables like `KC_DB_PASSWORD`, or `KCRAW_DB_PASSWORD` when passwords contain special characters.

```bash
# conf/keycloak.conf
db-username=keycloak
db-password=your_secure_password

# Or via raw environment variable:
export KCRAW_DB_PASSWORD='p@ssword$with$symbols'
bin/kc.sh start --optimized
```
