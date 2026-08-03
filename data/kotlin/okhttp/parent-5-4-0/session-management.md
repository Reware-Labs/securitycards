# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: session management

## session management

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
