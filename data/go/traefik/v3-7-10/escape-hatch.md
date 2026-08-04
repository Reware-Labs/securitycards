# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: escape hatch

## escape hatch

### Disable raw snippet annotations to restrict directive injection

**Use when**

Configuring the Traefik Ingress NGINX provider where untrusted ingress authors might supply custom metadata annotations.

**Secure rules**

**Rule 1: Keep `allowSnippetAnnotations` set to false to prevent execution of unvalidated raw directive injections.**

Ensure snippet annotations remain disabled in your Traefik ingress-nginx provider settings to prevent escape hatch risks where users could override proxy logic or tamper with security controls.

```yaml
providers:
  kubernetesIngressNginx:
    allowSnippetAnnotations: false
```
