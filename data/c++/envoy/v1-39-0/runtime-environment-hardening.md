# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: runtime environment hardening

## runtime environment hardening

### Avoid OpenSSL Builds in Production Environments

**Use when**

Building and compiling Envoy for production deployment where security policy guarantees and security vulnerability response processes are required.

**Secure rules**

**Rule 1: Build Envoy with default BoringSSL or FIPS-compliant BoringSSL/AWS-LC configurations rather than OpenSSL.**

Avoid building Envoy with `--config=openssl` for production deployments unless strictly required. OpenSSL builds rely on dynamically loaded libraries, disable HTTP/3 (QUIC) support, and are explicitly excluded from the Envoy security policy.

```bash
bazel build //source/exe:envoy-static

# Or for FIPS compliance:
bazel build --config=boringssl-fips //source/exe:envoy-static
```


### Harden Envoy Container Deployments and Runtime Environments

**Use when**

Configuring container orchestrators, runtime security contexts, and deployment parameters for production Envoy instances.

**Secure rules**

**Rule 1: Run Envoy containers with a read-only root filesystem to prevent runtime modification.**

Set `readOnlyRootFilesystem: true` within the container security context for container orchestrators such as Kubernetes.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: envoy-pod
spec:
  containers:
  - name: envoy
    image: envoyproxy/envoy:v1.39.0
    securityContext:
      readOnlyRootFilesystem: true
```

**Rule 2: Execute Envoy container processes as an unprivileged non-root user.**

Configure dedicated non-root user identities using `ENVOY_UID` and `ENVOY_GID` environment variables while avoiding root (`0`) execution.

```console
$ docker run -d --name envoy \
    -e ENVOY_UID=777 \
    -e ENVOY_GID=777 \
    -p 80:8000 \
    -v $(pwd)/envoy.yaml:/etc/envoy/envoy.yaml \
    envoyproxy/envoy:v1.39.0
```


### Restrict Envoy Privileged Ports and File System Permissions

**Use when**

Configuring Envoy container execution users, port mappings, and file system paths to restrict access to privileged resources.

**Secure rules**

**Rule 1: Run Envoy as a non-user container and map host privileged ports to unprivileged container ports.**

Keep Envoy running as a non-root user such as the default UID/GID 101. Avoid running as root with `ENVOY_UID=0`, and configure Envoy to listen on unprivileged ports greater than 1024 inside the container while relying on runtime port mapping to forward host privileged ports.

```bash
docker run -d --name envoy -p 80:8000 envoyproxy/envoy:v1.39.0
```

**Rule 2: Validate file paths to restrict unauthorized access to privileged system directories.**

Perform path integrity checks using `Filesystem::Instance::illegalPath` before attempting filesystem operations to block unauthorized reads from privileged or restricted host directories such as `/proc`, `/sys`, and `/dev`.

```cpp
Filesystem::InstanceImpl file_system;
std::string target_path = "/proc/kallsyms";
if (file_system.illegalPath(target_path)) {
  ENVOY_LOG(warn, "Blocked access to restricted host path: {}", target_path);
  return;
}
auto result = file_system.fileReadToEnd(target_path);
```
