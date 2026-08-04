# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`

## Category: api contract misuse

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


## Category: authentication

### Configure authentication credentials and interceptors securely

**Use when**

Implementing basic authentication, proxy authorization, or preemptive credential injection using `Authenticator`, `Credentials.basic()`, and custom interceptors.

**Secure rules**

**Rule 1: Guard against infinite authentication retry loops in `Authenticator` implementations**

When implementing OkHttp's `Authenticator` interface to handle 401 unauthorized challenges, check whether the authorization header was already set on the request. Return null when an authorization header is already present to stop infinite retry loops on authentication failure.

```kotlin
val client = OkHttpClient.Builder()
  .authenticator(object : Authenticator {
    override fun authenticate(route: Route?, response: Response): Request? {
      if (response.request.header("Authorization") != null) {
        return null
      }
      val credential = Credentials.basic(getUser(), getPassword())
      return response.request.newBuilder()
        .header("Authorization", credential)
        .build()
    }
  })
  .build()
```

**Rule 2: Restrict preemptive authorization headers to intended target hosts**

When attaching authentication credentials preemptively using an OkHttp interceptor and `Credentials.basic()`, always verify that the request URL host matches the specific intended target domain before setting the `Authorization` header to prevent leaking credentials to unintended third-party domains.

```java
static final class BasicAuthInterceptor implements Interceptor {
  private final String credentials;
  private final String host;

  BasicAuthInterceptor(String host, String username, String password) {
    this.credentials = Credentials.basic(username, password);
    this.host = host;
  }

  @Override public Response intercept(Chain chain) throws IOException {
    Request request = chain.request();
    if (request.url().host().equals(host)) {
      request = request.newBuilder()
          .header("Authorization", credentials)
          .build();
    }
    return chain.proceed(request);
  }
}
```


## Category: configuration source integrity

### Verify OkHttp dependency artifacts using published PGP signing keys

**Use when**

Configuring build tools and dependency verification metadata for OkHttp artifacts to ensure configuration and supply-chain integrity.

**Secure rules**

**Rule 1: Enforce automated dependency signature verification in build scripts against official release signing keys.**

Verify downloaded OkHttp dependency artifacts and binaries using Gradle automated dependency signature verification against Square's published signing key to prevent compromised binaries from being included in client applications.

```bash
./gradlew --write-verification-metadata pgp,sha256 help
```


## Category: cryptography

### Configure TLS transport security, certificate pinning, and custom trust stores securely

**Use when**

Configuring transport layer security, validating server certificates, or setting up custom certificate authorities and pinning on `OkHttpClient`.

**Secure rules**

**Rule 1: Enforce public key pinning using `CertificatePinner` to prevent man-in-the-middle attacks.**

Configure `OkHttpClient` with a `CertificatePinner` to enforce SHA-256 public key pinning against specific target hostnames. Handle any resulting `SSLPeerUnverifiedException` errors securely without bypassing verification.

```kotlin
val certificatePinner = CertificatePinner.Builder()
  .add("api.example.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
  .build()

val client = okHttpClient.newBuilder()
  .certificatePinner(certificatePinner)
  .build()
```

**Rule 2: Configure both custom `SSLSocketFactory` and `X509TrustManager` on `OkHttpClient.Builder`.**

Pass both the custom `SSLSocketFactory` and the corresponding `X509TrustManager` to `OkHttpClient.Builder.sslSocketFactory()` to ensure correct certificate chain validation and trust verification.

```java
X509TrustManager trustManager = trustManagerForCertificates(trustedCertificatesInputStream());
SSLContext sslContext = SSLContext.getInstance("TLS");
sslContext.init(null, new TrustManager[] { trustManager }, null);

OkHttpClient client = new OkHttpClient.Builder()
    .sslSocketFactory(sslContext.getSocketFactory(), trustManager)
    .build();
```

**Rule 3: Load platform trusted root certificate authorities explicitly when initializing `HandshakeCertificates`.**

Call `.addPlatformTrustedCertificates()` on `HandshakeCertificates.Builder()` to include standard system default root certificate authorities into the trust manager for public TLS validation.

```kotlin
val handshakeCertificates = HandshakeCertificates.Builder()
  .addPlatformTrustedCertificates()
  .addTrustedCertificate(customPrivateRootCert)
  .build()

val client = OkHttpClient.Builder()
  .sslSocketFactory(handshakeCertificates.sslSocketFactory(), handshakeCertificates.trustManager)
  .build()
```

**Rule 4: Select robust public key algorithms for generated certificates.**

Use robust public key algorithms such as `ecdsa256()` or `rsa2048()` when creating runtime or test certificates via `HeldCertificate.Builder`, avoiding legacy or weak key lengths and hashing algorithms.

```kotlin
val heldCertificate = HeldCertificate.Builder()
  .commonName("localhost")
  .addSubjectAlternativeName("127.0.0.1")
  .ecdsa256()
  .build()
```

**Rule 5: Explicitly configure cryptographic settings including `SSLSocketFactory`, `HostnameVerifier`, and `ConnectionSpecs` on `OkHttpClient`.**

Rely on explicit client configuration for `OkHttpClient` rather than relying on URLs alone to ensure specific TLS versions, trusted certificate authorities, and hostname verification logic are enforced.

```java
OkHttpClient client = new OkHttpClient.Builder()
    .sslSocketFactory(sslSocketFactory, trustManager)
    .hostnameVerifier(hostnameVerifier)
    .connectionSpecs(Collections.singletonList(ConnectionSpec.MODERN_TLS))
    .build();
```


## Category: csrf

### Validate state tokens to prevent CSRF in OAuth authorization flows

**Use when**

Initiating OAuth 2.0 authorization flows and handling callbacks in network client applications.

**Secure rules**

**Rule 1: Generate a cryptographically random, unguessable state token for each authorization request and validate it upon receiving the callback.**

Use `SecureRandom` to create an unpredictable state token for every outgoing request and verify the corresponding parameter during the callback processing to prevent cross-site request forgery.

```java
private ByteString generateStateToken() {
  byte[] bytes = new byte[16];
  secureRandom.nextBytes(bytes);
  return ByteString.of(bytes);
}

HttpUrl authorizeUrl = slackApi.authorizeUrl(scopes, redirectUrl, generateStateToken(), team);
```


## Category: input interpretation safety

### Parse and Canonicalize Untrusted URLs Using HttpUrl

**Use when**

When handling user-provided URLs or constructing network requests from external input to prevent validation and policy bypasses.

**Secure rules**

**Rule 1: Always parse untrusted URL strings using HttpUrl parsing APIs to normalize representations before performing security decisions or routing requests.**

Use `HttpUrl.parse()` or `HttpUrl.get()` to process untrusted URLs. This ensures standard Web Platform URL canonicalization rules are applied to percent-encoded dot-segments, IP representations, control characters, and whitespace, preventing path traversal and host boundary validation bypasses.

```java
HttpUrl url = HttpUrl.parse(untrustedUrlInput);
if (url == null) {
  throw new IllegalArgumentException("Invalid or malformed URL");
}

if (!allowedHosts.contains(url.host())) {
  throw new SecurityException("Target host not allowed: " + url.host());
}

Request request = new Request.Builder()
    .url(url)
    .build();
```


## Category: interface protocol hardening

### Enforce Strict Protocol Version Restriction for HTTP/2 Prior Knowledge

**Use when**

Configuring network protocols and client connections where cleartext HTTP/2 without ALPN negotiation is required.

**Secure rules**

**Rule 1: Do not combine Protocol.H2_PRIOR_KNOWLEDGE with other protocols in the protocol configuration list.**

When configuring HTTP protocols using `Protocol.H2_PRIOR_KNOWLEDGE`, ensure it is the sole protocol specified in the protocol list. Mixing prior knowledge HTTP/2 with fallback protocols like `Protocol.HTTP_1_1` or `Protocol.HTTP_2` introduces protocol ambiguity and causes runtime connection failures.

```kotlin
server.protocols = listOf(Protocol.H2_PRIOR_KNOWLEDGE)
```


## Category: network boundary

### Restrict insecure host TLS overrides to non-production environments

**Use when**

Configuring TLS client certificates and custom handshake settings for OkHttp during local development or test setups.

**Secure rules**

**Rule 1: Restrict insecure host TLS overrides to private development and test environments**

Use `HandshakeCertificates.Builder().addInsecureHost()` only in private development environments and only to carry test data. This configuration disables server authentication for the listed hosts, making the connection vulnerable to man-in-the-middle attacks, and is intended for testing against localhost or other development setups where a certificate authority is not available.

```kotlin
val clientCertificates = HandshakeCertificates.Builder()
    .addPlatformTrustedCertificates()
    .addInsecureHost("localhost")
    .build()

val client = OkHttpClient.Builder()
    .sslSocketFactory(clientCertificates.sslSocketFactory(), clientCertificates.trustManager)
    .build()
```


## Category: resource exhaustion

### Configure Dispatcher Concurrency Limits and Read Timeouts

**Use when**

Configuring OkHttpClient instances to handle concurrent network traffic and prevent thread starvation or resource exhaustion.

**Secure rules**

**Rule 1: Configure explicit concurrency limits on the Dispatcher and read timeouts on the client to protect against request overloads and thread hangs.**

Set explicit maximum limits on total concurrent requests and per-host requests using the `Dispatcher` to prevent exhausting system memory, thread resources, and file descriptors. Additionally, define an explicit `readTimeout` on `OkHttpClient.Builder` to prevent execution threads from blocking indefinitely when handling servers that send inaccurate metadata or stall stream delivery.

```java
Dispatcher dispatcher = new Dispatcher();
dispatcher.setMaxRequests(32);
dispatcher.setMaxRequestsPerHost(4);

OkHttpClient client = new OkHttpClient.Builder()
    .dispatcher(dispatcher)
    .readTimeout(Duration.ofSeconds(10))
    .build();
```


### Stream Response Bodies Incrementally and Enforce Resource Limits

**Use when**

Handling large or continuous HTTP response bodies where loading entire payloads into heap memory risks exhaustion, or managing active streaming lifecycles.

**Secure rules**

**Rule 1: Avoid loading large response bodies entirely into memory via `ResponseBody.string()`**

When processing HTTP responses that may exceed 1 MiB, stream the response body incrementally using streaming APIs such as `ResponseBody.source()` or `ResponseBody.byteStream()` to prevent heap memory exhaustion and `OutOfMemoryError` crashes.

```kotlin
client.newCall(request).execute().use { response ->
  if (!response.isSuccessful) throw IOException("Unexpected code $response")
  val source = response.body!!.source()
  // Read from source incrementally rather than calling response.body!!.string()
}
```

**Rule 2: Explicitly manage active streaming lifecycles instead of relying on call timeouts**

Because call timeouts are enforced during initial connection setup and HTTP header retrieval rather than active streaming, developers must explicitly manage streaming lifecycles by calling `cancel()` on the `EventSource` or `Call` to prevent long-lived connections from consuming socket resources indefinitely.

```kotlin
val client = OkHttpClient.Builder()
  .readTimeout(30, TimeUnit.SECONDS)
  .build()

val request = Request.Builder()
  .url("https://example.com/stream")
  .build()

val eventSource = EventSources.createFactory(client)
  .newEventSource(request, listener)

eventSource.cancel()
```


## Category: secret handling

### Configure Redirect and SSL Security Controls in OkHttp

**Use when**

Configuring client behavior for handling HTTP redirects, ensuring transport security, and inspecting intermediate redirect hops.

**Secure rules**

**Rule 1: Disable automatic SSL-to-cleartext redirect downgrades when strict transport security is required.**

Configure `followSslRedirects(false)` on `OkHttpClient.Builder` to prevent the client from automatically transitioning from HTTPS to cleartext HTTP during request redirection.

```java
OkHttpClient client = new OkHttpClient.Builder()
    .followSslRedirects(false)
    .build();
```

**Rule 2: Register network interceptors to inspect intermediate redirect hops and location headers.**

Use `addNetworkInterceptor()` on `OkHttpClient.Builder` when you need visibility into intermediate redirect steps, allowing your security logic to inspect `Location` headers and enforce boundary controls before subsequent network requests are sent.

```java
OkHttpClient client = new OkHttpClient.Builder()
    .addNetworkInterceptor(new Interceptor() {
      @Override public Response intercept(Chain chain) throws IOException {
        Request request = chain.request();
        Response response = chain.proceed(request);
        if (response.isRedirect()) {
          String location = response.header("Location");
        }
        return response;
      }
    })
    .build();
```


### Prevent Secret Leaks in Logs, Headers, and Storage

**Use when**

Configuring OkHttp logging interceptors, requests, or credential handling to prevent unintended exposure of secrets, tokens, and sensitive headers.

**Secure rules**

**Rule 1: Redact sensitive headers and restrict elevated logging levels to non-production environments.**

Use `HttpLoggingInterceptor` with `redactHeader()` to mask headers like `Authorization` and `Cookie`, and ensure higher logging levels such as `HttpLoggingInterceptor.Level.BODY` are restricted to debug builds.

```kotlin
val logging = HttpLoggingInterceptor()
logging.redactHeader("Authorization")
logging.redactHeader("Cookie")
logging.level = if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY else HttpLoggingInterceptor.Level.NONE

val client = OkHttpClient.Builder()
    .addInterceptor(logging)
    .build()
```

**Rule 2: Supply credentials dynamically and avoid hardcoding secrets in source code or request builders.**

Load sensitive application credentials from environment variables or secure credential stores rather than hardcoding them into source files or authentication builders.

```java
String clientId = System.getenv("IMGUR_CLIENT_ID");

Request request = new Request.Builder()
    .header("Authorization", "Client-ID " + clientId)
    .url("https://api.imgur.com/3/image")
    .post(new ProgressRequestBody(requestBody, progressListener))
    .build();
```

**Rule 3: Avoid transmitting sensitive access tokens via URL query parameters.**

Send authentication tokens and sensitive parameters through secure HTTP headers such as `Authorization` instead of appending them to request URLs.

```java
Request request = new Request.Builder()
    .url(baseUrl.newBuilder("rtm.start").build())
    .header("Authorization", "Bearer " + accessToken)
    .build();
```

**Rule 4: Redact sensitive HTTP headers when using the logging interceptor**

The `HEADERS` and `BODY` logging levels can expose sensitive information, including `Authorization` and `Cookie` header values. Use these logging levels only in a controlled setting or a nonproduction environment, and configure each sensitive header with `redactHeader()` before installing the interceptor.

```java
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import okhttp3.logging.HttpLoggingInterceptor.Level;

public final class HttpClientFactory {
  public static OkHttpClient create() {
    HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
    logging.setLevel(Level.HEADERS);
    logging.redactHeader("Authorization");
    logging.redactHeader("Cookie");

    return new OkHttpClient.Builder()
        .addInterceptor(logging)
        .build();
  }
}
```

**Rule 5: Redact sensitive headers when using HttpLoggingInterceptor**

The logs generated by `HttpLoggingInterceptor` when using the `HEADERS` or `BODY` levels have the potential to leak sensitive information such as "Authorization" or "Cookie" headers. This data should only be logged in a controlled way or in a non-production environment. Redact headers that may contain sensitive information by calling `redactHeader()`.

```java
HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
logging.setLevel(HttpLoggingInterceptor.Level.HEADERS);
logging.redactHeader("Authorization");
logging.redactHeader("Cookie");
OkHttpClient client = new OkHttpClient.Builder()
    .addInterceptor(logging)
    .build();
```


## Category: session management

### Invalidate OAuth state tokens immediately after token exchange

**Use when**

Handling OAuth authentication callbacks and authorization code exchanges.

**Secure rules**

**Rule 1: Remove or invalidate OAuth state parameters immediately after state verification and authorization code exchange to enforce single-use semantics.**

Ensure that OAuth state tokens are purged from tracking maps or session stores immediately following the completion of the authorization code exchange. This prevents reuse of the state parameter across multiple callbacks and mitigates exposure to replay attacks and authorization confusion.

```java
String stateString = requestUrl.queryParameter("state");
ByteString state = stateString != null ? ByteString.decodeBase64(stateString) : null;

Listener listener;
synchronized (this) {
  listener = listeners.get(state);
}
if (listener == null) {
  return new MockResponse().setResponseCode(404).setBody("unexpected request");
}

try {
  OAuthSession session = slackApi.exchangeCode(code, redirectUrl());
  listener.sessionGranted(session);
} finally {
  synchronized (this) {
    listeners.remove(state);
  }
}
```
