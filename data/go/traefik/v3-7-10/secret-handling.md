# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: secret handling

## secret handling

### Avoid Storing Sensitive Data in Container Labels and Service Tags

**Use when**

Defining routing rules and service metadata for orchestrator providers like Docker, Swarm, ECS, Consul, and Nomad.

**Secure rules**

**Rule 1: Do not embed credentials, tokens, or private keys inside container labels or service tags.**

Container metadata and service discovery tags are exposed in plain text through API endpoints, inspection commands, and monitoring tools. Store sensitive configuration in dedicated secret stores, file-based providers, or secure storage systems instead of container labels or Consul/Nomad service tags.

```yaml
services:
  my-container:
    deploy:
      labels:
        - traefik.http.routers.my-container.rule=Host(`example.com`)
        - traefik.http.services.my-service.loadbalancer.server.port=8080
    secrets:
      - my_app_secret
```


### Load Sensitive Credentials via Kubernetes Secret URNs

**Use when**

Configuring sensitive values in Kubernetes Middleware `spec.plugin` fields.

**Secure rules**

**Rule 1: Reference external secrets using URN syntax instead of embedding plain text credentials in resource manifests.**

Avoid placing plaintext client secrets, passwords, signing secrets, or TLS private keys directly in Middleware CRD manifests. Use the URN reference syntax `urn:k8s:secret:<secret-name>:<key>` to securely retrieve sensitive values from Kubernetes Secrets.

```yaml
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: test-jwt
spec:
  plugin:
    jwt:
      signingSecret: "urn:k8s:secret:jwt-secret-name:secret-key"
      clientConfig:
        tls:
          key: "urn:k8s:secret:tls-secret-name:tls-key"
```


### Redact and Restrict Sensitive Log Data and Auth Headers

**Use when**

Configuring access logs, log serialization, header forwarding, and ACME storage permissions.

**Secure rules**

**Rule 1: Drop or redact sensitive authentication headers and query parameters from access logs, and remove authentication headers from backend requests**

Configure header and query parameter filtering in Traefik access logs to explicitly drop or redact sensitive authorization details. When using BasicAuth or DigestAuth, explicitly set `removeHeader` to `true` to prevent forwarding the `Authorization` header to backend services.

```yaml
accessLog:
  format: json
  fields:
    headers:
      defaultMode: drop
      names:
        Authorization: drop
        User-Agent: redact
    queryParameters:
      defaultMode: drop
```
