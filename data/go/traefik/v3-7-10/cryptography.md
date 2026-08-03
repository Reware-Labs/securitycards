# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: cryptography

## cryptography

### Configure Cryptographic Key Types for ACME Certificate Generation

**Use when**

Configuring ACME certificate resolvers to issue TLS certificates with appropriate cryptographic key strengths.

**Secure rules**

**Rule 1: Specify robust cryptographic key types using the `keyType` parameter.**

When configuring ACME certificate resolvers in Traefik, explicitly set `keyType` to a strong algorithm option such as `EC256`, `EC384`, or `RSA4096` to ensure generated private keys offer adequate cryptographic resistance.

```yaml
certificatesResolvers:
  myresolver:
    acme:
      email: admin@example.com
      storage: /etc/traefik/acme.json
      keyType: EC256
      httpChallenge:
        entryPoint: web
```
