# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: file handling

## file handling

### Validate Normalized Paths Against Storage Root to Prevent Traversal

**Use when**

Handling user-supplied file paths and resolving them against a storage root directory.

**Secure rules**

**Rule 1: Always verify that normalized user-supplied paths stay strictly within the designated base storage root directory.**

Do not rely on `StringUtils.cleanPath()` as a standalone security sanitizer against path traversal attacks. While `cleanPath()` normalizes path separators and reduces relative dot-segments, it does not prevent normalized paths from escaping a base directory if they retain leading relative segments or reference absolute paths. Always validate that the resolved path starts with the base path.

```java
Path basePath = Paths.get("/app/storage").toAbsolutePath().normalize();
String cleaned = StringUtils.cleanPath(userInput);
Path resolvedPath = basePath.resolve(cleaned).toAbsolutePath().normalize();
if (!resolvedPath.startsWith(basePath)) {
    throw new SecurityException("Access denied for path outside base directory");
}
```

**Rule 2: Retain PathResourceResolver at the end of resource resolver chains to enforce path traversal safety.**

Always retain `PathResourceResolver` at the end of the `ResourceResolver` chain when configuring custom resource resolvers on `ResourceHttpRequestHandler`. Omitting `PathResourceResolver` disables default path safety checks and could allow path traversal attacks to expose arbitrary files on the filesystem or classpath.

```java
List<ResourceResolver> resolvers = new ArrayList<>();
resolvers.add(new VersionResourceResolver().addFixedVersionStrategy("1.0", "/**/*.js"));
resolvers.add(new PathResourceResolver()); // Ensure PathResourceResolver is added last

ResourceHttpRequestHandler handler = new ResourceHttpRequestHandler();
handler.setLocations(List.of(new ClassPathResource("static/")));
handler.setResourceResolvers(resolvers);
```
