# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: network boundary

## network boundary

### Configure trusted hostnames on RedirectView to enforce redirect boundaries

**Use when**

Configuring dynamic HTTP redirects in Spring MVC applications where targets must be restricted to allowed internal domains.

**Secure rules**

**Rule 1: Specify allowed hostnames on RedirectView to distinguish between internal hosts and untrusted external destinations.**

Use `setHosts(...)` on `RedirectView` to define explicit allowed domains and evaluate target URLs using `isRemoteHost()` to prevent unauthorized external redirects.

```java
RedirectView view = new RedirectView(targetUrl);
view.setHosts("app.example.com", "auth.example.com");
if (view.isRemoteHost(targetUrl)) {
    throw new IllegalArgumentException("External redirects are not allowed");
}
```


### Validate Target URIs and Hostnames to Prevent Server-Side Request Forgery

**Use when**

Building outbound HTTP requests using `RestTemplate`, `WebClient`, or HTTP service proxies where user-supplied input dictates URIs, URI variables, or endpoint parameters.

**Secure rules**

**Rule 1: Strictly validate user-supplied URI parameters against an explicit allowlist before passing them to declarative HTTP client interfaces**

When using Spring HTTP service proxies built with `HttpServiceProxyFactory` and `WebClientAdapter` where method parameters are typed as `java.net.URI` to dynamically override the base URL, applications must validate user input to ensure the target scheme, host, and port match an explicit allowlist.

```java
public String getExternalData(URI userSuppliedUri, String id) {
    if (!"https".equalsIgnoreCase(userSuppliedUri.getScheme()) || !"api.example.com".equalsIgnoreCase(userSuppliedUri.getHost()) || (userSuppliedUri.getPort() != -1 && userSuppliedUri.getPort() != 443)) {
        throw new IllegalArgumentException("Invalid request destination");
    }
    return myService.getGreetingById(userSuppliedUri, id);
}
```

**Rule 2: Configure safe URI encoding modes when using `RestTemplate` with URI templates and variables.**

Configure `RestTemplate` to use `DefaultUriBuilderFactory` with `EncodingMode.TEMPLATE_AND_VALUES` when making HTTP requests with URI templates and variables to prevent untrusted input from injecting control characters that alter the target host or authority.

```java
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory();
factory.setEncodingMode(DefaultUriBuilderFactory.EncodingMode.TEMPLATE_AND_VALUES);

RestTemplate restTemplate = new RestTemplate();
restTemplate.setUriTemplateHandler(factory);

String response = restTemplate.getForObject("https://api.example.com/users/{userId}", String.class, userInput);
```

**Rule 3: Validate target hosts against an explicit allowlist before executing outbound `WebClient` requests**

When initiating outbound HTTP requests with `WebClient` using `uri(URI)`, `uri(String)`, or `baseUrl(String)`, untrusted input used to specify the host, scheme, or path must be strictly validated against an explicit allowlist before execution.

```java
Set<String> ALLOWED_HOSTS = Set.of("api.example.com", "partner.example.com");

public Mono<String> fetchExternalData(String targetUrl) {
    URI uri = URI.create(targetUrl);
    if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || !ALLOWED_HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT))) {
  return Mono.error(new IllegalArgumentException("Target host not allowed"));
 }
    return webClient.get()
        .uri(uri)
        .retrieve()
        .bodyToMono(String.class);
}
```
