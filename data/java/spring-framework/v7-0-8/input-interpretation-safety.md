# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: input interpretation safety

## input interpretation safety

### Configure Canonical URI Parsing and Reject Alternate Input Interpretations

**Use when**

Parsing and validating untrusted URLs, request paths, or class names where alternate interpretations or parser differentials could bypass security checks.

**Secure rules**

**Rule 1: Select consistent URL parsers and validate components explicitly to prevent parser differential vulnerabilities.**

When parsing user-supplied URLs for routing or security boundaries, explicitly specify `UriComponentsBuilder.ParserType.WHAT_WG` to ensure consistent browser-aligned parsing and evaluate the exact same parsed components in downstream authorization checks.

```java
UriComponents uriComponents = UriComponentsBuilder.fromUriString(untrustedUrl, UriComponentsBuilder.ParserType.WHAT_WG)
        .build();
String host = uriComponents.getHost();
if (host != null && allowedHosts.contains(host.toLowerCase(Locale.ROOT))) {
}
```

**Rule 2: Prefer PathPatternParser over legacy path matchers for consistent request path interpretation.**

Use `PathPatternParser` for parsed request path matching rather than deprecated helpers to avoid URL decoding inconsistencies and path matching discrepancies across security layers.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.setPatternParser(new PathPatternParser());
    }
}
```

**Rule 3: Validate dynamic class names against an allowlist before resolution.**

Ensure that unvalidated user-supplied class names are strictly restricted against an explicit allowlist before passing them into `ClassUtils.forName` or `ClassUtils.resolveClassName`.

```java
Set<String> ALLOWED_CLASSES = Set.of(
    "com.example.dto.UserPayload",
    "com.example.dto.OrderPayload"
);

public Class<?> getValidatedClass(String className, ClassLoader cl) throws ClassNotFoundException {
    if (!ALLOWED_CLASSES.contains(className)) {
        throw new IllegalArgumentException("Unauthorized class resolution attempt: " + className);
    }
    return ClassUtils.forName(className, cl);
}
```
