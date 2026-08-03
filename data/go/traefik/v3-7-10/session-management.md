# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: session management

## session management

### Configure Secure and HttpOnly Attributes for Session and Sticky Cookies

**Use when**

Configuring session or sticky session cookies across Traefik routing, middleware, and backend service configurations to protect tokens from interception and client-side script theft.

**Secure rules**

**Rule 1: Explicitly set Secure and HttpOnly flags on session and sticky session cookies.**

When configuring session identifiers or load balancer sticky session cookies, you must explicitly enable security flags such as `secure: true` and `httpOnly: true` along with strict `sameSite` attributes. Omitting these settings exposes session tokens to network eavesdropping over cleartext HTTP and client-side extraction through Cross-Site Scripting (XSS) vulnerabilities.

```yaml
apiVersion: traefik.io/v1alpha1
kind: TraefikService
metadata:
  name: whoami-sticky
  namespace: default
spec:
  weighted:
    services:
      - name: whoami
        port: 80
        sticky:
          cookie:
            name: sticky_cookie
            secure: true
            httpOnly: true
```
