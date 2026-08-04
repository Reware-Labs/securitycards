# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: runtime environment hardening

## runtime environment hardening

### Initialize Cryptographic Resources Before Restricting Process Sandboxes

**Use when**

Configuring process sandboxing and system access restrictions in applications utilizing underlying cryptographic components.

**Secure rules**

**Rule 1: Call `CRYPTO_pre_sandbox_init()` prior to enabling strict process sandboxing or restricting system access rights.**

Invoke `CRYPTO_pre_sandbox_init()` before setting up sandbox policies to ensure underlying system resources and entropy required by BoringSSL are pre-acquired before sandbox boundaries block them.

```c
// Call before setting up sandbox restrictions
CRYPTO_pre_sandbox_init();

// Proceed with enabling sandbox policies
apply_process_sandbox_policy();
```
