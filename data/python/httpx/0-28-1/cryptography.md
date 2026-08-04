# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: cryptography

## cryptography

### Configure Explicit SSL Contexts and Maintain Certificate Verification

**Use when**

Configuring client certificate validation, custom CA bundles, or connecting over HTTPS using HTTPX.

**Secure rules**

**Rule 1: Maintain certificate verification and never disable TLS checks.**

Keep the default verification settings active by retaining `verify=True` or supplying a configured `ssl.SSLContext` instance. Never pass `verify=False` in production environments, as doing so completely disables certificate authority and host identity checks.

```python
import ssl
import certifi
import httpx

ctx = ssl.create_default_context(cafile=certifi.where())
client = httpx.Client(verify=ctx)
```

**Rule 2: Use explicit SSL contexts for custom certificate authorities and client certificates.**

Avoid passing file path strings or `cert` parameters directly to `verify=` or client initializations, as these legacy patterns trigger deprecation warnings in HTTPX 0.28.x. Instead, instantiate an explicit `ssl.SSLContext` using `ssl.create_default_context()` and load custom CA bundles or client certificate chains directly onto the context before passing it to `verify`.

```python
import ssl
import httpx

ctx = ssl.create_default_context(cafile='/path/to/ca_bundle.pem')
ctx.load_cert_chain(certfile='/path/to/client.crt', keyfile='/path/to/client.key')

client = httpx.Client(verify=ctx)
```

**Rule 3: Set the SNI hostname extension when requesting explicit IP addresses.**

When making HTTPS requests directly to an IP address instead of using DNS resolution, explicitly supply the expected domain name using the `sni_hostname` request extension so HTTPX performs proper server name indication and certificate hostname validation.

```python
import httpx

client = httpx.Client()
headers = {"Host": "www.encode.io"}
extensions = {"sni_hostname": "www.encode.io"}
response = client.get(
    "https://185.199.108.153/path",
    headers=headers,
    extensions=extensions
)
```


### Configure Secure TLS and Certificate Verification in HTTPX

**Use when**

Instantiating HTTPX clients or making HTTPS requests where TLS certificate verification, custom CA bundles, or IP-based SNI mapping must be securely enforced.

**Secure rules**

**Rule 1: Configure SSL and TLS verification settings during client initialization rather than passing per-request SSL arguments.**

When using HTTPX `Client` instances, pass TLS configuration parameters upon client instantiation. If distinct TLS configurations are needed, instantiate separate `Client` instances for each configuration because per-request SSL arguments are not supported.

```python
import httpx
import ssl

client = httpx.Client(verify=True)
response = client.get('https://example.com')

custom_ctx = ssl.create_default_context()
custom_client = httpx.Client(verify=custom_ctx)
```

**Rule 2: Set the sni_hostname request extension when connecting directly to IP addresses for TLS verification.**

When making HTTPS requests directly to an explicit IP address rather than a domain name, pass the expected server domain using the `sni_hostname` request extension so HTTPX can perform correct certificate hostname verification.

```python
import httpx

client = httpx.Client()
headers = {"Host": "www.encode.io"}
extensions = {"sni_hostname": "www.encode.io"}
response = client.get(
    "https://185.199.108.153/path",
    headers=headers,
    extensions=extensions
)
```

**Rule 3: Use explicit `ssl.SSLContext` objects for custom certificates and client credentials.**

Avoid passing deprecated string file paths or `cert` parameters directly. Build an explicit `ssl.SSLContext` using `ssl.create_default_context()` and load client certificate chains using `ctx.load_cert_chain()`.

```python
import ssl
import httpx

ctx = ssl.create_default_context(cafile="/path/to/ca_bundle.pem")
ctx.load_cert_chain(certfile="/path/to/client.crt", keyfile="/path/to/client.key")
client = httpx.Client(verify=ctx)
```

**Rule 4: Explicitly inspect SSL environment variables when building custom `SSLContext` objects.**

Because HTTPX does not automatically read `SSL_CERT_FILE` or `SSL_CERT_DIR` environment variables when custom contexts are used, explicitly retrieve and pass them to the `ssl.SSLContext` constructor.

```python
import os
import ssl
import certifi
import httpx

ctx = ssl.create_default_context(
    cafile=os.environ.get("SSL_CERT_FILE", certifi.where()),
    capath=os.environ.get("SSL_CERT_DIR"),
)
client = httpx.Client(verify=ctx)
```

**Rule 5: Keep default TLS verification enabled and never disable it in production code.**

Rely on HTTPX's default SSL verification or supply an authenticated `ssl.SSLContext` object. Never pass `verify=False` in production code to prevent man-in-the-middle attacks.

```python
import httpx

client = httpx.Client()
response = client.get("https://example.com")
```
