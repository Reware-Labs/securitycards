# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: security control integrity

## security control integrity

### Configure Certificate Verification Parameters Without Unsupported CRL Flags

**Use when**

Configuring X509 verification parameters where unauthorized or unsupported verification flags could cause verification failures or fail-closed behavior.

**Secure rules**

**Rule 1: Avoid setting unsupported extended or delta CRL verification flags to prevent unconditional verification failures.**

Do not set `X509_V_FLAG_EXTENDED_CRL_SUPPORT` or `X509_V_FLAG_USE_DELTAS` in `X509_VERIFY_PARAM` flags, because unsupported CRL processing causes verification requests to fail closed unconditionally. Instead, configure certificate verification parameters using standard supported CRL checking flags such as `X509_V_FLAG_CRL_CHECK`.

```c
X509_VERIFY_PARAM *param = X509_VERIFY_PARAM_new();
X509_VERIFY_PARAM_set_flags(param, X509_V_FLAG_CRL_CHECK);
X509_STORE_CTX_set0_param(ctx, param);
```
