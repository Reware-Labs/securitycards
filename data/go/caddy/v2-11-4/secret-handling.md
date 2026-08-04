# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: secret handling

## secret handling

### Load Credentials and Secrets Dynamically Using Environment Variables and Placeholders

**Use when**

Configuring issuers, certificates, and sensitive keys in Caddyfile or JSON configurations.

**Secure rules**

**Rule 1: Use environment variable placeholders instead of hardcoding sensitive account keys and credentials in configuration files.**

Supply private keys, MAC keys, and API credentials dynamically using environment variable placeholders such as `{$ACME_ACCOUNT_KEY}` or `{env.ZEROSSL_API_KEY}` in your configuration files to avoid exposing secrets in version control or backups.

```json
{
    "tls": {
        "issuer": {
            "acme": {
                "account_key": "{$ACME_ACCOUNT_KEY}"
            }
        }
    }
}
```

**Rule 2: Avoid passing plaintext passwords via command line flags when generating credentials or hashes.**

Omit the `--plaintext` argument when using `caddy hash-password` so that Caddy interactively prompts for the password or receives it securely through standard input, preventing exposure in process listings and history files.

```bash
echo -n "MyStrongPassword123!" | caddy hash-password --algorithm argon2id
```


### Redact and Filter Sensitive Data in Log Outputs and Storage

**Use when**

Configuring log filters, file storage permissions, and security-sensitive log options.

**Secure rules**

**Rule 1: Configure explicit log filters to automatically redact sensitive query parameters and cookie headers from logs.**

Use `QueryFilter` and `CookieFilter` log field filters in your logging configuration to purge or replace sensitive fields like `access_token` and `session_id` before logs are written.

```caddyfile
log {
	format json {
		filter {
			request>uri query {
				delete access_token
				replace api_key "REDACTED"
			}
		}
	}
}
```
