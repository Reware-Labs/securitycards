# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: authentication

## authentication

### Verify API Request Signatures and Client Timestamps Using Shared Secrets

**Use when**

When validating incoming API requests using shared secrets and timestamps to verify client identity and prevent unauthorized requests.

**Secure rules**

**Rule 1: Verify API request signatures using complete request components and ensure client timestamps are strictly checked against a replay window.**

When protecting endpoints with `apiauth.APISecretAuth` or verifying request signatures manually, ensure all core request context components such as the shared secret, HTTP method, URL parameters, and request URL are explicitly supplied. Configure an appropriate timeout threshold to prevent replay attacks.

```go
beego.InsertFilter("/api/*", beego.BeforeRouter, apiauth.APISecretAuth(getAppSecret, 60))
```
