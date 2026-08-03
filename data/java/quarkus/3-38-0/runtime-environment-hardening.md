# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: runtime environment hardening

## runtime environment hardening

### Configure Reflection and Native Initialization for Native Images

**Use when**

Developing or packaging Quarkus applications as GraalVM native images where dynamic reflection, native initialization, and proxy configurations are required.

**Secure rules**

**Rule 1: Explicitly register reflectively accessed classes, dynamic proxies, and third-party dependency hierarchies for native image compilation.**

Use `@RegisterForReflection` or `ReflectiveClassBuildItem` to ensure that classes requiring dynamic instantiation or field access are preserved during GraalVM closed-world dead-code elimination. Ensure dynamic proxy interfaces are declared using `@RegisterForProxy` to prevent runtime `UnsupportedFeatureError` exceptions.

```java
@RegisterForReflection(targets = { User.class, UserImpl.class })
public class MyReflectionConfiguration {
}
```

**Rule 2: Defer pseudo-random number generator initialization and stateful security managers to runtime**

Prevent static build-time caching of `SecureRandom` seed values or sensitive security contexts by explicitly configuring `--initialize-at-run-time` for PRNG-dependent classes and registering stateful managers using `RuntimeInitializedClassBuildItem`.

```properties
quarkus.native.additional-build-args=--initialize-at-run-time=com.example.CryptoService\\,sun.security.provider.NativePRNG
```

**Rule 3: Avoid performing side effects and runtime operations during static initialization.**

Restrict `@Record(STATIC_INIT)` build steps strictly to immutable build-time metadata setup, and defer port binding, thread creation, and runtime configuration access to `@Record(RUNTIME_INIT)` steps executed when the application launches.

```java
@BuildStep
@Record(ExecutionTime.RUNTIME_INIT)
void startRuntimeServices(ServiceRecorder recorder, RuntimeConfig config) {
    recorder.startServer(config.port());
}
```


### Disable Development Mode in Production Environments

**Use when**

Configuring deployment environments and packaging Quarkus applications for live production or staging usage.

**Secure rules**

**Rule 1: Run packaged Quarkus applications using standard production launch modes to prevent development-only exception message disclosure.**

Ensure application deployments run in production mode and do not enable development flags or interactive debugging features in live environments, preventing detailed authentication failure exceptions from exposing sensitive internal behavior.

```bash
java -jar target/quarkus-app/quarkus-run.jar
```


### Secure Container and Deployment Configuration in Quarkus

**Use when**

Configuring container runtimes, deployment manifests, build-time versus runtime configuration separation, and development utilities for Quarkus applications.

**Secure rules**

**Rule 1: Restrict custom Dev UI actions to local development and validate configuration targets**

When implementing Dev UI actions in a Quarkus extension, register mutating actions only for local development by using `@BuildStep(onlyIf = IsLocalDevelopment.class)`. Validate dynamically supplied configuration filenames against an explicit allowlist before resolving them within the resource directory.

```java
private static final Set<String> ALLOWED_CONFIG_FILES = Set.of(
        "application.properties",
        "application.yaml",
        "application.yml");

@BuildStep(onlyIf = IsLocalDevelopment.class)
void registerBuildTimeActions(
        BuildProducer<BuildTimeActionBuildItem> buildTimeActionProducer) {
    // Register local-development actions
}

private static Path getConfigPath(String target) throws IOException {
    Path fileName = Paths.get(target).getFileName();
    if (fileName == null || !ALLOWED_CONFIG_FILES.contains(fileName.toString())) {
        throw new IllegalArgumentException("Unsupported configuration file");
    }

    Path resourceDir = DevConsoleManager.getHotReplacementContext()
            .getResourcesDir().get(0);
    return resourceDir.resolve(fileName);
}
```

**Rule 2: Separate build-time configuration from container runtime overrides and enforce strict configuration binding.**

Ensure configuration properties that require container environment customization or dynamic runtime overrides are defined using `@ConfigRoot(phase = ConfigPhase.RUN_TIME)`. Reserve build-time phases strictly for static build optimizations. When defining deployment configuration models using Spring Boot `@ConfigurationProperties`, explicitly set `ignoreUnknownFields = false` to force Quarkus to validate that all supplied deployment configuration keys strictly match defined model fields.

```java
@ConfigurationProperties(prefix = "app.deployment", ignoreUnknownFields = false)
public class DeploymentConfig {
    private String trustedSubnet;
    private boolean enforceTls;

    public String getTrustedSubnet() { return trustedSubnet; }
    public void setTrustedSubnet(String trustedSubnet) { this.trustedSubnet = trustedSubnet; }
    public boolean isEnforceTls() { return enforceTls; }
    public void setEnforceTls(boolean enforceTls) { this.enforceTls = enforceTls; }
}
```

**Rule 3: Configure explicit security contexts, least-privilege service accounts, and secure secret mounting in generated Kubernetes manifests.**

Configure explicit security contexts, least-privilege service accounts, and resource boundaries via Quarkus Kubernetes deployment settings. Define `securityContext()`, `serviceAccount()`, and `resources()` to restrict container privileges and resource limits. Mount sensitive runtime application credentials via `appSecret` or `secretVolumes` rather than embedding them in plain environment variables or `appConfigMap`.

```properties
quarkus.kubernetes.security-context.run-as-non-root=true
quarkus.kubernetes.security-context.read-only-root-filesystem=true
quarkus.kubernetes.service-account=my-app-sa
quarkus.kubernetes.resources.limits.memory=512Mi
quarkus.kubernetes.app-secret=my-app-secret
```
