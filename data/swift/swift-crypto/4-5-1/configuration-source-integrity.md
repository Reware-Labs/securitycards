# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: configuration source integrity

## configuration source integrity

### Restrict Certificate Lookup Directory Paths and Environment Overrides to Trusted Sources

**Use when**

Configuring directory paths and environment variable overrides for hash-based X.509 certificate and CRL resolution.

**Secure rules**

**Rule 1: Supply an explicit certificate directory to `X509_LOOKUP_add_dir` instead of relying on `SSL_CERT_DIR` defaults**

`X509_LOOKUP_add_dir` and `X509_STORE_set_default_paths` fall back to paths taken from the `SSL_CERT_DIR` or `SSL_CERT_FILE` environment variables. Treat those variables as untrusted input and avoid the fallback by always passing a concrete, trusted directory path and a specific file-type constant (`X509_FILETYPE_PEM`). Ignore the `X509_FILETYPE_DEFAULT` option and never pass `NULL`, which would re-enable the environment-based lookup.

```c
/* Build a store that trusts only certificates in /etc/ssl/certs. */
X509_STORE *store = X509_STORE_new();
if (!store) { /* handle error */ }

X509_LOOKUP *lookup =
    X509_STORE_add_lookup(store, X509_LOOKUP_hash_dir());
if (!lookup ||
    !X509_LOOKUP_add_dir(lookup, "/etc/ssl/certs", X509_FILETYPE_PEM)) {
    /* Abort: explicit trust store failed to load. */
}
```
