# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: boundary control

## boundary control

### Prevent Observability Data Exposure in Traces and Telemetry Endpoints

**Use when**

Configuring OpenTelemetry tracing, span attributes, exporters, and telemetry endpoints in Quarkus applications.

**Secure rules**

**Rule 1: Restrict access to in-memory trace data export endpoints and isolate test span exporters.**

Do not expose in-memory trace data collected by `InMemorySpanExporter` through public REST endpoints in non-test builds. Isolate test exporter components within test source directories (`src/test/java`) or enforce authentication and authorization such as `@RolesAllowed` on telemetry endpoints.

```java
@GET
@Path("/export")
@RolesAllowed("admin")
public List<SpanData> exportTraces() {
    return inMemorySpanExporter.getFinishedSpanItems()
            .stream()
            .filter(sd -> !sd.getName().contains("export"))
            .collect(Collectors.toList());
}
```

**Rule 2: Disable OpenTelemetry End User attributes to prevent exposing PII in trace spans.**

Keep `quarkus.otel.traces.eusp.enabled` disabled by default unless telemetry storage meets compliance requirements, to prevent leaking `SecurityIdentity` user principal and role details as span attributes.

```properties
# Keep disabled to prevent PII exposure in trace spans
quarkus.otel.traces.eusp.enabled=false
quarkus.http.auth.proactive=true
```

**Rule 3: Disable OpenTelemetry logging exporters in production environments.**

Do not configure OpenTelemetry logging exporters like `quarkus.otel.traces.exporter=logging` or `quarkus.otel.metrics.exporter=logging` in production deployments to prevent writing raw trace spans and metrics to standard console logs where unencrypted log aggregators might capture them. Limit logging exporters strictly to development profiles.

```properties
%dev.quarkus.otel.traces.exporter=logging
%dev.quarkus.otel.metrics.exporter=logging
```

**Rule 4: Disable instrumentation for sensitive data pathways in OpenTelemetry**

Selectively disable OpenTelemetry instrumentation for sensitive subsystems such as SQL and Redis clients when SQL statement text or database operation metadata must not be recorded in trace spans.

```properties
# Disable SQL Client and Redis database operation telemetry
quarkus.otel.instrument.vertx-sql-client=false
quarkus.otel.instrument.vertx-redis-client=false

# Disable the OpenTelemetry SDK entirely if telemetry collection is prohibited
quarkus.otel.sdk.disabled=true
```


### Validate Redirect Back Locations Against Request Scheme and Authority

**Use when**

Handling form authentication redirects where user-controlled return locations must be verified at the server boundary before transitioning state.

**Secure rules**

**Rule 1: Verify that redirect-back locations strictly match the request scheme and authority to prevent open redirect vulnerabilities**

Do not override verifyRedirectBackLocation with relaxed domain checks. When running behind reverse proxies, enable proxy forwarding only with quarkus.http.proxy.trusted-proxies limited to those proxies so untrusted forwarding headers cannot control the validated scheme and authority.

```properties
quarkus.http.proxy.proxy-address-forwarding=true
quarkus.http.proxy.trusted-proxies=127.0.0.1
```
