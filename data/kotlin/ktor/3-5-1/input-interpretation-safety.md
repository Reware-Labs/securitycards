# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: input interpretation safety

## input interpretation safety

### Canonicalize and parse untrusted URL and header strings safely

**Use when**

When validating, parsing, or normalizing untrusted URL strings, authentication headers, or cookie values to ensure security decisions rely on unambiguous interpretations.

**Secure rules**

**Rule 1: Use parseUrl instead of direct Url constructor calls when processing untrusted URL strings.**

Invoke `parseUrl()` to evaluate untrusted or user-supplied URL inputs. This approach gracefully returns null when encountering malformed specifications or invalid encoding, preventing uncaught runtime exceptions and potential parsing bypasses during input validation.

```kotlin
val untrustedInput = "https://example.com?url=https%3A%2F%2Fwww.google.com%2"
val url = parseUrl(untrustedInput)
if (url == null) {
    // Reject invalid URL input safely
} else {
    // Proceed with validated Url object
}
```

**Rule 2: Normalize internationalized and multi-byte domain names using Ktor URL builders.**

Convert URLs containing internationalized domain names or non-ASCII characters using Ktor's `Url` builder and `toNSUrl()`. This ensures Punycode encoding is applied correctly to hostnames and percent-encoding is applied to query parameters before native platform calls.

```kotlin
val safeUrl = Url("http://привет.привет/echo_query?привет")
val nsUrl = safeUrl.toNSUrl()
```

**Rule 3: Encode cookie values instead of using RAW encoding**

Do not render data that may contain untrusted characters with `CookieEncoding.RAW`. Use `CookieEncoding.URI_ENCODING`, which is also Ktor’s default, so the cookie value is encoded when the `Set-Cookie` header is rendered. Treat values returned by `parseServerSetCookieHeader` as decoded application data rather than as sanitized header text.

```kotlin
import io.ktor.http.Cookie
import io.ktor.http.CookieEncoding
import io.ktor.http.renderSetCookieHeader

val cookie = Cookie(
    name = "session",
    value = "line1\r\nline2; role=admin",
    encoding = CookieEncoding.URI_ENCODING,
    secure = true,
    httpOnly = true
)

val setCookieHeader = renderSetCookieHeader(cookie)
```
