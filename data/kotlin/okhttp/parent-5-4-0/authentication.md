# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: authentication

## authentication

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
