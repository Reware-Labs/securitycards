# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: resource exhaustion

## resource exhaustion

### Enforce RSA Key Bit Length Limits During Parsing

**Use when**

Parsing RSA keys from external sources to prevent excessive computational resource consumption.

**Secure rules**

**Rule 1: Inspect and constrain RSA key bit lengths using key inspection functions.**

When parsing RSA keys, explicitly inspect the key bit length and ensure it falls within acceptable safety boundaries. Reject keys with insecure or excessive lengths to protect against CPU exhaustion.

```c
EVP_PKEY *pkey = EVP_PKEY_from_subject_public_key_info(der_data, der_len, algs, alg_count);
if (pkey != NULL) {
    int bits = EVP_PKEY_bits(pkey);
    if (bits < 2048 || bits > 4096) {
        EVP_PKEY_free(pkey);
    }
}
```
