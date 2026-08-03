# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: authentication

## authentication

### Configure Password Verification and Hashing with Constant-Time Comparison

**Use when**

When implementing or configuring user credential authentication and password verification mechanisms in Caddy HTTP authentication providers.

**Secure rules**

**Rule 1: Supply pre-hashed password strings in Modular Crypt Format or bcrypt.**

When configuring HTTP Basic Authentication, ensure password strings are properly hashed using Modular Crypt Format starting with '$' or base64 encoding to prevent credential leakage in plain configuration files.

```json
{
  "handler": "authentication",
  "providers": {
    "http_basic": {
      "accounts": [
        {
          "username": "admin",
          "password": "$2a$14$Z3q/78zJgX5vG/H1K.O1eeQ0.V..."
        }
      ]
    }
  }
}
```

**Rule 2: Execute constant-time comparisons and fake hashes against non-existent users.**

When verifying user credentials or custom authentication modules, use `Compare` to execute constant-time key comparisons and execute a dummy comparison using `FakeHash()` when an account does not exist to prevent timing side-channel attacks.

```go
var hasher caddyauth.Argon2idHash

user, found := userDB.Find(username)
var hashToCompare []byte
if found {
    hashToCompare = user.PasswordHash
} else {
    hashToCompare = hasher.FakeHash()
}

valid, err := hasher.Compare(hashToCompare, []byte(suppliedPassword))
if err != nil || !found || !valid {
    return errors.New("invalid username or password")
}
```


### Enforce Client Authentication and Verify Certificate Identity

**Use when**

When establishing mutual TLS (mTLS) authentication and verifying peer or client certificate credentials.

**Secure rules**

**Rule 1: Configure strict client authentication enforcement modes.**

When configuring Mutual TLS via the `client_auth` block under the `tls` directive, set the enforcement mode to `require_and_verify` to guarantee that client certificates are cryptographically validated before granting access.

```caddyfile
example.com {
    tls {
        client_auth {
            mode require_and_verify
            trusted_leaf_cert_file /path/to/allowed_client.pem
        }
    }
}
```

**Rule 2: Propagate errors explicitly from custom client certificate verifiers.**

When implementing custom `ClientCertificateVerifier` modules, ensure that any certificate validation failure explicitly returns a non-nil error so Caddy rejects unauthenticated connections during `verifyConnection`.

```go
func (v *CustomCertVerifier) VerifyClientCertificate(rawCerts [][]byte, verifiedChains [][]*x509.Certificate) error {
	if len(verifiedChains) == 0 {
		return errors.New("client certificate chain is required")
	}
	return nil
}
```
