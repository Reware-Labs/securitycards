# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`

## Category: access control

### Configure Explicit Access Control and Boundary Rules for Caddy Endpoints and Services

**Use when**

When defining server listeners, routing policies, forwarding authentication headers, and administrative API access boundaries to enforce authorization constraints.

**Secure rules**

**Rule 1: Enforce explicit route path segment boundaries and origin checks when configuring remote administrative permissions and local admin API access.**

When configuring `RemoteAdmin` permissions using `AdminAccess` rules, Caddy enforces path prefix checks strictly at path segment boundaries. Ensure path permissions rely on path-segment boundaries to restrict access to sensitive routes. Additionally, set `enforce_origin: true` and specify explicit allowed origins in `origins` on `admin` configuration to prevent cross-site requests or unauthorized configuration modifications.

```json
{
  "admin": {
    "listen": "localhost:2019",
    "enforce_origin": true,
    "origins": [
      "localhost:2019",
      "127.0.0.1:2019"
    ]
  }
}
```

**Rule 2: Restrict client-supplied identity headers and enforce default-deny policies for certificate issuance and proxy forwarding.**

When using `forward_auth` with `copy_headers`, rely on the directive to automatically strip client-supplied request headers matching `copy_headers` before proxying requests, preventing attackers from injecting arbitrary identity or role values. Furthermore, explicitly define `allow` rule sets for trusted domain names and IP ranges when configuring the ACME server certificate issuance policy to enforce default-deny behavior.

```json
{
  "allow": {
    "domains": ["internal.example.com"],
    "ip_ranges": ["10.0.0.0/8"]
  },
  "allow_wildcard_names": false
}
```

**Rule 3: Restrict Unix domain socket permissions using explicit octal mode bits.**

When configuring Unix domain socket addresses for Caddy listeners, append octal file mode bits using the pipe syntax to ensure that owner write permission bits are present and unauthorized local processes are prevented from interacting with socket listeners.

```json
{
  "apps": {
    "http": {
      "servers": {
        "internal": {
          "listen": ["unix//var/run/app.sock|0660"]
        }
      }
    }
  }
}
```


## Category: authentication

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


## Category: boundary control

### Configure Trusted Proxies and Allowed Networks to Enforce Trust Boundaries

**Use when**

Configuring Caddy behind upstream load balancers, reverse proxies, or when accepting PROXY protocol connections from external sources.

**Secure rules**

**Rule 1: Explicitly define trusted proxy CIDRs before accepting forwarded headers.**

When deploying Caddy behind upstream proxies or load balancers, explicitly set `trusted_proxies` to specific IP addresses or CIDR ranges. By default, Caddy does not trust client-supplied headers and will drop or overwrite them unless the request originates from a configured trusted proxy.

```json
{
  "handler": "reverse_proxy",
  "trusted_proxies": ["10.0.0.0/8", "172.16.0.0/12"]
}
```

**Rule 2: Restrict PROXY protocol listener sources to trusted upstream networks.**

When configuring the `proxy_protocol` listener wrapper in Caddy to extract client connection metadata, explicitly restrict trusted proxy CIDRs using the `allow` property to prevent untrusted clients from injecting arbitrary PROXY headers and spoofing the remote client address.

```caddyfile
servers :9080 {
	listener_wrappers {
		proxy_protocol {
			timeout 5s
			allow 10.0.0.0/8 127.0.0.0/8
		}
	}
}
```


## Category: configuration source integrity

### Enforce secure HTTPS and authentication for remote configuration and certificate loaders

**Use when**

When loading dynamic Caddy configurations or root CA certificates over the network using remote endpoints.

**Secure rules**

**Rule 1: Always use HTTPS endpoints and explicit TLS client/CA credentials when retrieving remote server configurations or dynamic CA certificates.**

Prevent network attackers from altering configuration settings or injecting malicious root certificates by using secure `https://` URLs and configuring TLS settings, such as `RootCAPEMFiles`, `ClientCertificateFile`, and `ClientCertificateKeyFile`, instead of unencrypted plain HTTP.

```go
loader := caddyconfig.HTTPLoader{
    Method: "GET",
    URL: "https://config-server.internal.domain/v1/caddy-config",
    Timeout: caddy.Duration(10 * time.Second),
    TLS: &struct {
        UseServerIdentity bool `json:"use_server_identity,omitempty"`
        ClientCertificateFile string `json:"client_certificate_file,omitempty"`
        ClientCertificateKeyFile string `json:"client_certificate_key_file,omitempty"`
        RootCAPEMFiles []string `json:"root_ca_pem_files,omitempty"`
    }{
        RootCAPEMFiles: []string{"/etc/ssl/certs/internal-ca.pem"},
        ClientCertificateFile: "/etc/ssl/certs/config-client.crt",
        ClientCertificateKeyFile: "/etc/ssl/certs/config-client.key",
    },
}
```


## Category: cryptography

### Configure Secure TLS Protocol Versions and Cipher Selection

**Use when**

Configuring TLS server protocols, minimum version thresholds, cipher suites, curves, and cryptographic parameters in Caddy.

**Secure rules**

**Rule 1: Restrict minimum TLS protocol versions to secure standards and avoid weak cryptographic primitives.**

When customizing TLS connection policies or protocol blocks, keep minimum protocol thresholds restricted to `tls1.2` or `tls1.3` to prevent downgrade attacks and cryptanalytic vulnerabilities.

```caddyfile
example.com {
    tls {
        protocols tls1.2 tls1.3
    }
}
```


### Hash Passwords Securely Using Argon2id and Cryptographically Secure Salts

**Use when**

Hashing user passwords for authentication configurations and implementing password verification comparers.

**Secure rules**

**Rule 1: Use the Argon2id algorithm with cryptographically secure random salts and constant-time verification.**

Prefer the Argon2id hashing algorithm over older algorithms when hashing user passwords, rely on `crypto/rand` for salt generation, and ensure custom hashing comparers use constant-time comparison operations.

```bash
caddy hash-password \
  --algorithm argon2id \
  --argon2id-time 1 \
  --argon2id-memory 65536 \
  --argon2id-threads 4
```


### Verify and Validate PKI Key Pairs and Certificate Chains

**Use when**

Loading custom PKI key pairs, managing internal certificate authorities, and verifying certificate chain consistency.

**Secure rules**

**Rule 1: Validate key pair consistency and ensure complete intermediate certificate chains are provided.**

When configuring custom PKI key pairs or internal certificate authorities, ensure that private keys match lead certificate public components and supply complete intermediate certificate trust chains in a single PEM bundle.

```go
kp := caddypki.KeyPair{
    Certificate: "/etc/ssl/pki/ca.crt",
    PrivateKey:  "/etc/ssl/pki/ca.key",
    Format:      "pem_file",
}
chain, signer, err := kp.Load()
if err != nil {
    // Handle file access error or key mismatch error
}
```


## Category: file handling

### Safely Join File Paths and Restrict Document Roots

**Use when**

When mapping untrusted HTTP request paths, FastCGI configurations, or template file operations to local filesystem paths.

**Secure rules**

**Rule 1: Use sanitized path join functions and enforce document root isolation**

When mapping untrusted HTTP request paths to local filesystem paths in custom Caddy HTTP modules, use `caddyhttp.SanitizedPathJoin(root, reqPath)` rather than standard library functions like `filepath.Join` or `path.Join`. Ensure root directories and FastCGI script destinations resolve to an intended base directory to prevent directory traversal attacks.

```go
safePath := caddyhttp.SanitizedPathJoin(webRoot, req.URL.Path)
file, err := os.Open(safePath)
if err != nil {
    return err
}
defer file.Close()
```


## Category: input driven boundary selection

### Validate and Restrict FastCGI SplitPath Configurations to ASCII

**Use when**

Configuring FastCGI script execution boundaries and split paths where untrusted input or Unicode characters could lead to boundary confusion.

**Secure rules**

**Rule 1: Specify pure ASCII substrings for FastCGI split_path configurations.**

When configuring `split_path` for FastCGI script execution, ensure you only specify pure ASCII substrings such as `.php`. Non-ASCII code points are rejected during module provisioning because Unicode equivalence and case folding can lead to misidentified script boundaries and potential remote code execution.

```json
{
	"transport": {
		"protocol": "fastcgi",
		"split_path": [".php"]
	}
}
```


## Category: input interpretation safety

### Canonicalize and Normalize Request Paths and Certificate PEM Blocks

**Use when**

When configuring HTTP path matchers, routing rules, or decoding certificate PEM structures in Caddy to ensure unambiguous input interpretation and prevent security bypasses.

**Secure rules**

**Rule 1: Write path matchers using unescaped characters and standard wildcard patterns to rely on automatic path cleaning and normalization.**

Caddy normalizes request paths including downcasing, slash merging, and converting Windows backslashes, operating in unescaped path space by default. Define standard path matchers using unescaped characters so that Caddy's path cleaning protects against bypass attempts, and use `%*` only when explicitly targeting raw percent-encoded sequences.

```json
{
  "match": [
    {
      "path": ["/api/v1/*"]
    }
  ]
}
```

**Rule 2: Enforce strict single-block PEM validation when decoding individual certificates.**

When processing individual certificate PEM payloads, ensure the input buffer contains strictly one PEM block with the header block type `CERTIFICATE` and no trailing bytes or secondary blocks. For multi-certificate bundles, always use chain-aware parsing functions.

```go
cert, err := pemDecodeCertificate(pemDER)
if err != nil {
    // Handle multiple blocks, wrong PEM block type, or invalid DER data
}
```


## Category: interface protocol hardening

### Enforce Strict Protocol and Header Validation for Upstream Proxy Transport

**Use when**

When configuring reverse proxy transport layers and proxy protocol parameters to communicate with upstream servers.

**Secure rules**

**Rule 1: Configure reverse proxy transport to send PROXY protocol headers only to trusted upstream servers.**

When forwarding client requests to upstream backends that rely on client network context, set the `proxy_protocol` setting to `v1` or `v2` on the transport. Ensure that upstream services accept PROXY protocol headers exclusively from trusted proxies on controlled network segments.

```json
{
  "handler": "reverse_proxy",
  "upstreams": [{"dial": "127.0.0.1:8080"}],
  "transport": {
    "protocol": "http",
    "proxy_protocol": "v2",
    "versions": ["1.1"]
  }
}
```


### Restrict Non-Idempotent Requests During Early Data and Enforce Strict Framing

**Use when**

When configuring HTTP matching rules and transport settings to handle early data requests or protocol version restrictions safely.

**Secure rules**

**Rule 1: Restrict non-idempotent HTTP methods when processing uncompleted TLS handshakes or early data.**

When matching requests via `MatchTLS`, QUIC or TLS 1.3 0-RTT early data requests can be processed before handshakes are completed. Restrict non-idempotent HTTP methods by responding with status code `425` (Too Early) to mitigate replay attacks.

```json
{
  "match": [
    {
      "tls": {
        "handshake_complete": false
      },
      "method": ["POST", "PUT", "PATCH", "DELETE"]
    }
  ],
  "handle": [
    {
      "handler": "static_response",
      "status_code": 425
    }
  ]
}
```

**Rule 2: Configure HTTP/3 reverse proxy transport with exclusive version listing and explicit TLS configuration.**

When specifying HTTP/3 (`3`) in the reverse proxy transport versions array, ensure that TLS is enabled via a non-nil `tls` block and that `3` is the sole version listed in the versions slice.

```json
{
	"transport": {
		"protocol": "http",
		"versions": ["3"],
		"tls": {}
	}
}
```


## Category: network boundary

### Restrict network boundaries and proxy listener access

**Use when**

Configuring network interfaces, proxy binding, and trusted client IP ranges across trust boundaries in Caddy.

**Secure rules**

**Rule 1: Configure Caddy's admin endpoint listener to bind strictly to loopback interfaces or Unix domain sockets.**

Explicitly define the admin listener address to a restricted loopback address or Unix socket to prevent exposing the unauthenticated control interface to public networks.

```json
{
  "admin": {
    "listen": "127.0.0.1:2019",
    "enforce_origin": true
  }
}
```

**Rule 2: Configure trusted proxy IP ranges when evaluating client IP addresses and headers.**

Specify explicit upstream proxy IP ranges using `trusted_proxies` and enable strict right-to-left header evaluation to prevent header spoofing and unauthorized IP manipulation.

```json
{
    servers {
        trusted_proxies static 10.0.1.0/24
    }
}
```


## Category: output encoding

### Encode Untrusted URI Components and Template Inputs to Prevent Output Injection

**Use when**

When constructing dynamic Caddy configurations, headers, redirect targets, or rendering untrusted user input within Caddy template responses and markdown files.

**Secure rules**

**Rule 1: Use URL-escaped placeholders when referencing HTTP URI components inside dynamic configurations, headers, or redirects.**

When referencing HTTP URI components inside dynamic Caddy configurations, headers, or redirect targets, use URL-escaped placeholders such as `http.request.uri_escaped`, `http.request.uri.path_escaped`, and `http.request.uri.query_escaped` instead of raw unescaped values. This ensures special characters and control delimiters remain encoded and prevents HTTP response splitting, header injection, or query parameter ambiguity vulnerabilities.

```caddyfile
header_up X-Original-URI {http.request.uri_escaped}
redir https://auth.example.com/login?redirect={http.request.uri.query_escaped}
```

**Rule 2: Sanitize untrusted input using stripHTML and contextual escaping in template files.**

Developers outputting untrusted user input within Caddy template responses should use `stripHTML` or contextual escaping to prevent cross-site scripting attacks. Pipe untrusted inputs through `stripHTML` or apply `html` escaping functions to dynamic content rendered via file and HTTP includes.

```html
{{ .Req.URL.Query.Get "comment" | stripHTML }}
<p>User comment: {{ .Req.URL.Query.Get "comment" | stripHTML }}</p>
<a href="/files/{{ pathEscape .Req.URL.Query.Get "name" }}">Download</a>
```


## Category: resource exhaustion

### Enforce Memory and Buffer Limits on HTTP Requests, Responses, and File Browsing

**Use when**

Use when configuring Caddy servers, reverse proxies, and file servers to handle incoming client traffic and backend payloads securely without exhausting memory resources.

**Secure rules**

**Rule 1: Set explicit positive bounds on request and response buffer sizes in reverse proxy configurations.**

Avoid setting `request_buffers` or `response_buffers` to `-1` or unconstrained values. Always specify positive byte limits to prevent malicious clients or upstreams from consuming excessive memory during payload handling.

```json
{
  "handler": "reverse_proxy",
  "request_buffers": 10485760,
  "response_buffers": 10485760
}
```

**Rule 2: Limit the maximum number of entries returned during directory browsing.**

Explicitly configure `file_limit` in the file server `browse` configuration to cap the maximum number of directory entries loaded and rendered in memory per request, avoiding resource exhaustion from vast directory structures.

```json
{
  "handler": "file_server",
  "browse": {
    "file_limit": 500
  }
}
```

**Rule 3: Configure explicit timeouts and header size limits on HTTP servers.**

Set explicit `read_timeout`, `read_header_timeout`, and `idle_timeout` values on server configurations, and retain or define `max_header_bytes` to bound memory consumption and prevent slowloris connection exhaustion attacks.

```json
{
  "apps": {
    "http": {
      "servers": {
        "srv0": {
          "listen": [":443"],
          "read_header_timeout": "30s",
          "read_timeout": "1m",
          "idle_timeout": "2m"
        }
      }
    }
  }
}
```


## Category: runtime environment hardening

### Configure Explicit Home and XDG Environment Variables for Production Runtime Storage

**Use when**

Deploying Caddy as a system service or container manifest in production environments to ensure runtime storage resolves to secure absolute paths instead of falling back to working directories.

**Secure rules**

**Rule 1: Explicitly define standard home and application data environment variables in deployment service files prior to execution.**

Set environment variables such as HOME, USERPROFILE, XDG_DATA_HOME, XDG_CONFIG_HOME, and XDG_CACHE_HOME explicitly in systemd service definitions or container configurations. This prevents Caddy from falling back to storing sensitive cryptographic assets, private TLS keys, and internal state in a relative `./caddy` folder within the current working directory.

```ini
[Service]
Environment=HOME=/var/lib/caddy
Environment=XDG_DATA_HOME=/var/lib/caddy/.local/share
ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile
```


## Category: secret handling

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


## Category: security control integrity

### Enforce explicit directive ordering with route blocks

**Use when**

Configuring Caddyfile directives where security controls like authentication or header validation depend on strict execution sequence relative to request rewrites or proxy handlers.

**Secure rules**

**Rule 1: Wrap dependent directives in an explicit `route` block to override default pipeline sorting and enforce literal top-to-bottom execution.**

Caddy sorts directives automatically according to a predefined pipeline where rewrites execute before authentication controls. When security controls must run before request modifications, use an explicit `route` block to ensure execution order and prevent authorization bypasses.

```caddyfile
example.com {
    route {
        basic_auth {
            user1 $2a$14$...
        }
        rewrite /protected/* /backend/{path}
        reverse_proxy http://backend:8080
    }
}
```
