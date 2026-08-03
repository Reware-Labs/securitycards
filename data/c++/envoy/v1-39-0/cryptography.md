# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: cryptography

## cryptography

### Use Authenticated Encryption and Secure Cryptographic Verification in Envoy

**Use when**

When configuring cryptographic operations, token encryption in filters, and signature verification routines.

**Secure rules**

**Rule 1: Enable AES-256-GCM encryption for OAuth2 cookie token protection**

When configuring Envoy's OAuth2 filter, ensure sensitive tokens stored in cookies are encrypted by setting `disable_token_encryption` to false and opting in to AES-256-GCM encryption mode via the `oauth2_use_gcm_encryption` feature flag to replace legacy CBC mode.

```yaml
http_filters:
- name: envoy.filters.http.oauth2
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.filters.http.oauth2.v3.OAuth2Config
    disable_token_encryption: false
    credentials:
      client_id: "client_id"
      token_secret:
        name: "token_secret"
      hmac_secret:
        name: "hmac_secret"
```

**Rule 2: Always verify status results from signature verification operations**

Envoy's `verifySignature()` method returns a status object that evaluates to false on `result.ok()` when given unsupported hash algorithms, uninitialized key objects, altered data payloads, or corrupted signatures. Callers must evaluate `result.ok()` before trusting signed data.

```cpp
auto result = Envoy::Common::Crypto::UtilitySingleton::get().verifySignature("sha256", *key_object, signature_bytes, data_bytes);
if (!result.ok()) {
  ENVOY_LOG(warn, "Signature verification failed: {}", result.message());
  return;
}
```
