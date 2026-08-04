# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: api contract misuse

## api contract misuse

### Use Only Public OkHttp APIs

**Use when**

Developing network-enabled client applications using OkHttp public interfaces.

**Secure rules**

**Rule 1: Avoid importing or invoking classes from internal OkHttp packages.**

Depend strictly on public API packages such as `okhttp3.*` and avoid importing internal components from `okhttp3.internal` to prevent unexpected runtime crashes and breaking behavior during updates.

```java
import okhttp3.OkHttpClient;
import okhttp3.Request;

OkHttpClient client = new OkHttpClient();
Request request = new Request.Builder()
    .url("https://example.com")
    .build();
```
