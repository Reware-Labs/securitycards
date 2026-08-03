# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: api contract misuse

## api contract misuse

### Avoid Conflicting Authorization Header Flags in OAuth2 Configuration

**Use when**

Configuring the OAuth2 HTTP filter in Envoy where multiple request header manipulation flags could be mistakenly enabled simultaneously.

**Secure rules**

**Rule 1: Select only one Authorization header handling flag per OAuth2 configuration to prevent conflicting management of request headers.**

Do not combine conflicting HTTP `Authorization` header manipulation flags in the OAuth2 filter. Enabling more than one of `forward_bearer_token`, `preserve_authorization_header`, or `forward_id_token` is disallowed because they attempt to manage the same request header and cause configuration rejection.

```yaml
config:
  forward_bearer_token: true
  preserve_authorization_header: false
  token_endpoint:
    cluster: oauth_cluster
    uri: oauth.com/token
    timeout: 3s
```
