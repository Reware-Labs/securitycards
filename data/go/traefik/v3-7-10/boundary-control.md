# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: boundary control

## boundary control

### Enforce Namespace and Cross-Provider Boundary Restrictions for Kubernetes Providers

**Use when**

When configuring Traefik Kubernetes Ingress, CRD, and Gateway providers to isolate tenant boundaries and prevent unauthorized resource discovery or cross-namespace references.

**Secure rules**

**Rule 1: Restrict provider resource discovery and cross-namespace references.**

Explicitly scope provider discovery using namespace filtering flags and disable cross-namespace resource access to maintain proper tenant boundaries and prevent resource hijacking.

```yaml
providers:
  kubernetesIngressNginx:
    watchNamespace: "production"
    ingressClass: "nginx"
    controllerClass: "k8s.io/ingress-nginx"
    watchIngressWithoutClass: false
```
