# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: runtime environment hardening

## runtime environment hardening

### Restrict Container Privileges and Host Resource Access in Deployment Manifests

**Use when**

Configuring deployment manifests and security contexts for Sglang worker and leader containers.

**Secure rules**

**Rule 1: Enforce the principle of least privilege in container security contexts by avoiding `privileged: true` and granting only required capabilities.**

Do not grant full `privileged: true` access alongside `hostIPC: true` and `hostNetwork: true` to containers unless strictly required. Instead, disable privileged mode and explicitly add only necessary capabilities such as `IPC_LOCK`.

```yaml
securityContext:
  privileged: false
  capabilities:
    add:
    - IPC_LOCK
```
