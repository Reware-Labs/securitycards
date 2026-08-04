# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: input contract definition

## input contract definition

### Preserve mandatory HTTP pseudo-headers in custom filters

**Use when**

Developing or modifying custom HTTP filters placed prior to the Envoy router filter.

**Secure rules**

**Rule 1: Ensure custom filter logic preserves all mandatory HTTP pseudo-headers before passing requests upstream.**

Envoy's router strictly validates required request headers such as `:method` using `Http::HeaderUtility::checkRequiredRequestHeaders`. Custom HTTP filters running before the router must not remove or drop these mandatory pseudo-headers, as doing so triggers an immediate local `503 Service Unavailable` response.

```cpp
Http::FilterHeadersStatus MyFilter::decodeHeaders(Http::RequestHeaderMap& headers, bool) {
  if (headers.Method().empty()) {
    headers.setMethod(Http::Headers::get().MethodValues.Get);
  }
  return Http::FilterHeadersStatus::Continue;
}
```


### Validate Certificate Pins and Ensure Upstream TLS Session Resumption Verification

**Use when**

Configuring upstream TLS validation contexts, certificate hashes, public key pins, or handling custom peer verification and session resumption.

**Secure rules**

**Rule 1: Validate certificate fingerprint formats correctly in upstream `CertificateValidationContext` configurations.**

Ensure that digests adhere strictly to expected encodings when configuring certificate pinning via `verify_certificate_hash` or public key pinning via `verify_certificate_spki`. `verify_certificate_hash` requires a valid 64-character hex-encoded SHA-256 string, while `verify_certificate_spki` requires a valid base64-encoded SHA-256 digest.

```yaml
validation_context:
  verify_certificate_hash:
  - "6B29D7B49E77D182E6939E092F04801AEA3979C8A5726203D4D51CE73420F620"
  verify_certificate_spki:
  - "Q29uZ3JhdHVsYXRpb25zLCB5b3UgZm91bmQgaXQh"
```

**Rule 2: Enable re-verification on session resumption for peer-verifying upstream TLS connections.**

Ensure that `SSL_CTX_set_reverify_on_resume` is enabled during TLS context initialization for peer-verifying connections to re-execute peer certificate validation when resuming a TLS session.

```cpp
if (verify_mode != SSL_VERIFY_NONE) {
  SSL_CTX_set_custom_verify(ctx, verify_mode, customVerifyCallback);
  SSL_CTX_set_reverify_on_resume(ctx, /*reverify_on_resume_enabled=*/1);
}
```
