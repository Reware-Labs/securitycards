# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: memory safety

## memory safety

### Allocate Sufficient Buffer Sizes and Verify Non-Overlapping Regions in Cryptographic Operations

**Use when**

When managing input and output memory buffers for low-level cryptographic primitives, key derivation, or block cipher operations.

**Secure rules**

**Rule 1: Pre-allocate destination buffers with sufficient capacity for cryptographic operations to prevent buffer overflows.**

Ensure output buffers supplied to functions like `HMAC_Final` are pre-allocated with at least `EVP_MAX_MD_SIZE` or the required maximum size before executing the operation.

```c
uint8_t out[EVP_MAX_MD_SIZE];
unsigned int out_len = 0;
if (HMAC_Final(ctx, out, &out_len) == 1) {
    // HMAC output successfully written to out
}
```

**Rule 2: Ensure input and output memory regions are strictly non-overlapping or identical when invoking block cipher and conditional memory operations.**

Avoid partial memory overlap across input and output parameters in functions like `AES_cbc_encrypt` to prevent unrecoverable data corruption. Use completely separate buffers or identical pointers for in-place processing.

```c
// Safe: In-place processing using identical pointers
AES_cbc_encrypt(buffer, buffer, buffer_len, &key, ivec, AES_ENCRYPT);

// Safe: Completely separate input and output memory regions
AES_cbc_encrypt(in_buffer, out_buffer, buffer_len, &key, ivec, AES_ENCRYPT);
```
