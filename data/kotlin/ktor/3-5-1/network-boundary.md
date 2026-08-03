# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: network boundary

## network boundary

### Enforce strict TLS certificate hostname verification and avoid authentication bypass

**Use when**

Configuring TLS connections and validating server certificates or hostnames in Ktor client applications.

**Secure rules**

**Rule 1: Enforce strict wildcard and domain matching during TLS hostname verification.**

Rely on Ktor's built-in hostname verification functions to strictly validate domain labels, ignore trailing dots, perform case-insensitive comparisons, and reject overly broad wildcards or invalid wildcard positions.

```kotlin
val match1 = matchHostnameWithCertificate("www.example.com", "*.example.com") // true
val match2 = matchHostnameWithCertificate("www.example.com", "*.com") // false (rejected TLD wildcard)
val match3 = matchHostnameWithCertificate("www.sub.example.com", "www.*.example.com") // false (rejected non-prefix wildcard)
```

**Rule 2: Avoid bypassing TLS certificate validation in production client configurations.**

Do not use custom authentication challenge handlers that automatically trust any server certificate without evaluation. Use standard default handling for server trust challenges to allow the operating system to perform full certificate chain validation.

```swift
completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, null)
```
