# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: runtime environment hardening

## runtime environment hardening

### Disable Development Mode and Configure Production TLS Profiles

**Use when**

Configuring the Rocket application for production deployment to ensure secure runtime settings and default protective header injection.

**Secure rules**

**Rule 1: Compile and run the Rocket application in a non-debug profile with TLS enabled in production.**

Rocket automatically injects `Strict-Transport-Security` (HSTS) headers and applies default protective headers only when TLS is configured and running in a non-debug profile such as release mode. Developers must ensure TLS credentials and the non-debug compilation profile are active in production environments to rely on these built-in runtime security mechanisms.
