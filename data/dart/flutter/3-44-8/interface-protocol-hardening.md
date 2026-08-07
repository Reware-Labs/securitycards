# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Strict Native Resolvers and Dispatch Signatures for FFI and Platform Messaging

**Use when**

Registering native Ffi native resolvers and managing binary native payloads between Dart isolates and host platforms.

**Secure rules**

**Rule 1: Enforce strict static dispatch registration using typed dispatchers for native bindings.**

When mapping Dart native bindings to host C++ implementations via `Dart_SetFfiNativeResolver`, enforce strict static dispatch registration using templated dispatchers and explicitly declared function macros. Ensure that any dynamic native symbols without pre-registered dispatch signatures fail resolution securely.

```cpp
void* ResolveFfiNativeFunction(const char* name, uintptr_t args) {
  auto it = g_function_dispatchers.find(name);
  return (it != g_function_dispatchers.end()) ? it->second : nullptr;
}

void DartUI::InitForIsolate(const Settings& settings) {
  Dart_SetFfiNativeResolver(dart_ui, ResolveFfiNativeFunction);
}
```

**Rule 2: Validate platform channel messaging APIs exposed to FFI dispatchers.**

Ensure that platform channel messaging APIs exposed directly to FFI dispatchers undergo contract enforcement and state validation before forwarding binary native payloads across boundaries.

```cpp
#define FFI_FUNCTION_LIST(V) \
  V(PlatformConfigurationNativeApi::SendPlatformMessage) \
  V(PlatformConfigurationNativeApi::RespondToPlatformMessage)
```


### Filter Framing Headers When Forwarding Proxied Requests

**Use when**

When proxying HTTP requests across network boundaries using `shelf` proxy middleware.

**Secure rules**

**Rule 1: Strip hop-by-hop and transport framing headers such as Content-Length prior to forwarding requests to downstream target endpoints.**

When proxying requests using `shelf`, filter out framing headers like `Content-Length` from the original request headers before creating the proxied request to prevent request smuggling and protocol framing desynchronization.

```dart
final headers = Map<String, String>.fromEntries(
  originalRequest.headers.entries.where(
    (entry) => entry.key.toLowerCase() != 'content-length',
  ),
);
final proxiedRequest = proxyRequest(originalRequest, targetUrl);
```


### Secure Platform Channel Method Handlers and Validate Incoming Payloads

**Use when**

Implementing and configuring method channel handlers to process messages crossing the native-Dart execution boundary.

**Secure rules**

**Rule 1: Validate all incoming method names, payload types, and argument structures before executing platform operations.**

When receiving method calls across platform channels, strictly verify `call.method` and type-check `call.arguments` against expected schemas. Explicitly return `result.notImplemented()` for unknown methods and catch decoding exceptions such as `JSONException` or `NoSuchFieldException`, returning error envelopes via `MethodChannel.Result.error` rather than allowing unhandled native crashes or state desynchronization.

```java
methodChannel.setMethodCallHandler((call, result) -> {
  if ("getSensitiveData".equals(call.method)) {
    String query = call.argument("query");
    if (query == null) {
      result.error("INVALID_ARGUMENT", "Missing query parameter", null);
      return;
    }
    result.success(fetchData(query));
  } else {
    result.notImplemented();
  }
});
```

**Rule 2: Catch expected exceptions within handlers and prevent native stack trace exposure.**

Avoid letting uncaught runtime exceptions propagate across platform channels, which causes `MethodChannel` to automatically transmit full native stack traces back to Dart via error envelopes. Wrap handler logic in `try-catch` blocks and return sanitized error codes.

```java
methodChannel.setMethodCallHandler((call, result) -> {
  try {
    result.success(executeAction());
  } catch (Exception e) {
    result.error("INTERNAL_ERROR", "An error occurred while executing the native action", null);
  }
});
```

**Rule 3: Validate platform invocation results and manage channel handlers during engine detachment.**

Always clean up method call handlers during `onDetachedFromEngine` by setting them to `null` to avoid dangling references. Check lifecycle prerequisites, such as verifying that target activities are non-null before executing platform-specific operations.

```java
@Override
public void onDetachedFromEngine(FlutterPluginBinding binding) {
  if (methodChannel != null) {
    methodChannel.setMethodCallHandler(null);
    methodChannel = null;
  }
}
```
