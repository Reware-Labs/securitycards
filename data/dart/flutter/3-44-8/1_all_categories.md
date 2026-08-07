# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`

## Category: api contract misuse

### Validate Form State Before Saving Inputs

**Use when**

When building forms in Flutter and processing user inputs prior to saving or submission.

**Secure rules**

**Rule 1: Explicitly invoke and verify FormState.validate() before triggering FormState.save().**

Because calling `FormState.save()` invokes `onSaved` callbacks without executing `FormField` validators or confirming input correctness, developers must explicitly call `FormState.validate()` and confirm it returns true before triggering `FormState.save()` or using field inputs in application logic.

```dart
final formKey = GlobalKey<FormState>();

void submitForm() {
  if (formKey.currentState?.validate() ?? false) {
    formKey.currentState?.save();
    // Send or process validated fieldValue
  }
}
```


## Category: boundary control

### Specify Explicit Application Identifiers During mDNS Service Discovery

**Use when**

Performing mDNS VM Service discovery on local networks where multiple active processes or services are present.

**Secure rules**

**Rule 1: Always supply an explicit application bundle or process identifier when querying for mDNS attach targets to prevent attaching to an unintended local service.**

When discovering VM service instances, pass the explicit application identifier to ensure the discovery operation fails safely instead of attaching to an arbitrary local binary.

```dart
final MDnsVmServiceDiscoveryResult? result = await portDiscovery.queryForAttach(
  applicationId: 'com.example.targetApp',
);
```


## Category: configuration source integrity

### Validate upstream repository and mirror URLs from trusted sources

**Use when**

Configuring custom repository mirrors, SDK download locations, or storage endpoints for Flutter and Dart packages.

**Secure rules**

**Rule 1: Ensure all custom host mirror URLs and environment overrides use fully qualified HTTPS URIs and valid TLS configurations.**

When redirecting SDK or package downloads using environment variables such as `PUB_HOSTED_URL`, `FLUTTER_STORAGE_BASE_URL`, or `FLUTTER_GIT_URL`, verify that the endpoints are trusted and properly formatted. Running `flutter doctor` helps verify mirror integrity and catch validation errors.

```bash
export PUB_HOSTED_URL="https://internal-mirror.example.com/pub"
export FLUTTER_STORAGE_BASE_URL="https://internal-mirror.example.com/flutter"
export FLUTTER_GIT_URL="https://internal-mirror.example.com/flutter.git"
flutter doctor
```


## Category: escape hatch

### Restrict Validation Failure Callback Overrides and Restrict Unsafe Scoped Flag Usage

**Use when**

Configuring or testing rendering validation error handlers and error suppression mechanisms in low-level graphics subsystems.

**Secure rules**

**Rule 1: Avoid returning true unconditionally from custom validation failure callbacks to prevent suppressing rendering errors.**

Do not return true unconditionally from validation failure callbacks registered with `ImpellerValidationErrorsSetCallback`, as this bypasses default error handling and process termination. Restrict the override strictly to targeted tests and handle expected error messages explicitly while failing fast on unexpected states.

```cpp
impeller::ImpellerValidationErrorsSetCallback([](const char* message, const char* file, int line) {
  if (std::string(message).find("Expected test error") != std::string::npos) {
    return true;
  }
  return false;
});
```


## Category: file handling

### Use Exclusive Mode for Safe File Creation

**Use when**

When creating temporary or sensitive files on disk to prevent overwriting pre-existing files or following malicious symlinks.

**Secure rules**

**Rule 1: Use exclusive file creation mode to ensure file creation is atomic and fails if the target path already exists.**

When creating secure files on disk, set the `exclusive` parameter to true during file creation so that the operation fails safely if the target path already exists, protecting against symlink attacks and file overwrites.

```dart
final File file = fileSystem.file('/path/to/secure_file.dat');
file.createSync(exclusive: true);
```


## Category: injection

### Prevent Template and Expression Injection in Flutter Tools and Web Builds

**Use when**

Developing or building Flutter applications, handling custom web-define configurations, rendering templates, or utilizing dynamic expression evaluation and compilation APIs.

**Secure rules**

**Rule 1: Escape dynamic variables using escapeYamlString when rendering YAML templates.**

When substituting dynamic variables such as branch names or user inputs into YAML templates, format variables using `escapeYamlString` to safely enclose inputs in double quotes and escape special control characters.

```dart
final String safeBranch = escapeYamlString(userBranch);
final String yamlContent = 'default_branch: $safeBranch';
```


### Supply CSP Nonces and Selector Prefixes When Attaching Global Styles

**Use when**

Injecting or attaching global styles dynamically within web applications targeting Flutter 3.44.8.

**Secure rules**

**Rule 1: Always supply a valid Content Security Policy nonce and scope styles with a selector prefix when attaching global styles dynamically.**

When dynamically inserting style elements via `StyleManager.attachGlobalStyles`, pass the active host CSP nonce through the `styleNonce` parameter and scope the styles using `cssSelectorPrefix`. This prevents style execution failures, avoids relying on unsafe inline policy headers, and mitigates CSS injection and global rule pollution.

```dart
StyleManager.attachGlobalStyles(
  node: flutterViewElement,
  styleId: 'flutter-global-styles',
  styleNonce: cspNonceValue,
  cssSelectorPrefix: DomManager.flutterViewTagName,
);
```


## Category: input contract definition

### Validate Android build numbers against integer and store limits

**Use when**

Configuring Android build settings and supplying build numbers in Flutter tooling.

**Secure rules**

**Rule 1: Ensure that buildNumber inputs are validated as positive integers within allowed store limits before processing.**

Constrain build number inputs to positive integers within the allowed range prior to invoking build tooling to prevent build exits and disrupted CI/CD pipelines.

```dart
const BuildInfo buildInfo = BuildInfo(
  BuildMode.release,
  '',
  treeShakeIcons: false,
  buildNumber: '42',
  packageConfigPath: '.dart_tool/package_config.json',
);
```


### Validate Untrusted Form Field Input Using Validator Properties

**Use when**

Handling untrusted user input via `TextFormField` or `FormField` components before saving or processing form state.

**Secure rules**

**Rule 1: Define input validation contracts on form fields and invoke state validation prior to saving.**

Attach a validator function to `TextFormField` props to check input constraints and ensure `FormState.validate()` is called before invoking `FormState.save()`.

```dart
final formKey = GlobalKey<FormState>();
Form(
  key: formKey,
  child: TextFormField(
    validator: (String? value) {
      if (value == null || value.isEmpty) {
        return 'Input required';
      }
      return null;
    },
    onSaved: (String? value) {
      // Process validated value
    },
  ),
);

if (formKey.currentState!.validate()) {
  formKey.currentState!.save();
}
```


## Category: input driven boundary selection

### Anchor regex proxy rules to enforce path boundaries

**Use when**

Routing and rewriting web requests to upstream backend servers using proxy rules.

**Secure rules**

**Rule 1: Anchor regular expression proxy rules with explicit start anchors to enforce path boundaries.**

Always define regex patterns with explicit start anchors (^) using `RegExp` to ensure matching occurs strictly from the start of the path, preventing unexpected request routing or bypassing access control boundaries.

```dart
final rule = RegexProxyRule(
  pattern: RegExp(r'^/api/v1/users/(.*)'),
  target: 'http://localhost:8080/users/',
  replacement: r'$1',
);
```

**Rule 2: Prevent unanchored regex patterns from matching substrings anywhere in requested URI paths.**

Avoid unanchored proxy rules that match arbitrary substrings, which can lead to double path substitution or unintended access to internal services.


## Category: input interpretation safety

### Parse and validate string representations using unambiguous rules and explicit schemes

**Use when**

When parsing untrusted representations, configuration files, localization messages, or command-line option inputs in Flutter applications and tooling.

**Secure rules**

**Rule 1: Canonicalize and escape special syntax in localization messages to prevent parser misinterpretation.**

When parsing ICU localization messages with escaping enabled in Flutter localization tools (`gen_l10n`), ensure single quotes are properly escaped by doubling them or enclosing literal blocks in single quotes. Unmatched single quotes trigger syntax lexing failures and prevent ambiguous placeholder boundary interpretation.

```json
"greeting": "Flutter''s amazing!",
"literal": "'{ escaped string }' { placeholder }"
```

**Rule 2: Enforce explicit schemes and URI canonicalization for external server configuration inputs.**

When configuring Flutter command options for external DevTools servers via flags such as `--devtools-server-address`, supply a fully qualified URI containing an explicit scheme. Verify that the input parses successfully and includes a valid scheme before passing it to command runners to prevent malformed fallback parsing.

```dart
final String address = 'http://127.0.0.1:9105';
final Uri? parsed = Uri.tryParse(address);
if (parsed != null && parsed.hasScheme) {
  // Pass verified scheme URI to flutter command runners
}
```


## Category: interface protocol hardening

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


## Category: memory safety

### Enable Engine Sanitizers During Debug Testing for Memory Safety

**Use when**

Compiling and testing unoptimized Flutter Engine debug builds to catch native memory safety flaws such as buffer overflows and use-after-free.

**Secure rules**

**Rule 1: Enable engine sanitizers during debug testing to catch memory errors.**

Enable Address Sanitizer (--asan), Memory Sanitizer (--msan), Undefined Behavior Sanitizer (--ubsan), or Thread Sanitizer (--tsan) when compiling and testing unoptimized Flutter Engine debug builds to catch native memory safety flaws before release.

```bash
./flutter/tools/gn --runtime-mode debug --asan --unoptimized --no-goma
autoninja -C out/host_debug_unopt
source ./flutter/testing/sanitizer_suppressions.sh
./out/host_debug_unopt/embedder_unittests
```


## Category: network boundary

### Configure trusted proxy environment variables with explicit loopback exemptions

**Use when**

When configuring HTTP proxy environment variables for Flutter CLI workflows and development tools to ensure local loopback traffic bypasses the external proxy.

**Secure rules**

**Rule 1: Define `NO_PROXY` or `no_proxy` explicitly with standard comma-separated entries including all loopback interfaces.**

Ensure that loopback addresses such as `localhost`, `127.0.0.1`, and `::1` are explicitly included in proxy exemption configurations using proper comma separation. Avoid non-standard delimiters like semicolons to prevent parsing failures that could route internal traffic through external proxies.

```bash
export HTTP_PROXY="http://proxy.example.com:8080"
export NO_PROXY="localhost,127.0.0.1,::1"
```


## Category: resource exhaustion

### Enforce Image Decoding Dimension Limits to Prevent Resource Exhaustion

**Use when**

Decoding large or user-supplied image assets into memory where unbounded bitmap allocations can cause out-of-memory crashes.

**Secure rules**

**Rule 1: Wrap image providers with ResizeImage to restrict decoded bitmap dimensions.**

Use `ResizeImage` or `ResizeImage.resizeIfNeeded` to decode image assets at target display dimensions instead of native pixel resolution. Ensure `allowUpscaling` remains set to false by default to downscale high-resolution images while preventing small images from allocating oversized bitmap buffers.

```dart
final ImageProvider resizedProvider = ResizeImage.resizeIfNeeded(
  200,
  200,
  NetworkImage('https://example.com/large_image.jpg'),
  policy: ResizeImagePolicy.fit,
);
```


## Category: secret handling

### Redact and filter sensitive tokens from logs and diagnostic outputs

**Use when**

When building logging mechanisms, handling subprocess execution outputs, or generating system diagnostic reports that might contain sensitive credentials or PII.

**Secure rules**

**Rule 1: Filter sensitive tokens and credentials from logs and exception messages**

Ensure logging mechanisms and custom subprocess wrappers filter sensitive tokens and credentials from exceptions, stdout, stderr, and trace messages by configuring custom filtering functions.

```dart
final stdio = VerboseStdio(
  stdin: stdIn,
  stdout: stdOut,
  stderr: stdErr,
  filter: (String msg) => msg.replaceAll(sensitiveToken, '[REDACTED]'),
);
```

**Rule 2: Strip PII from Diagnostic Logs and Telemetry Outputs**

When collecting system diagnostic logs or submitting environment telemetry, strip sensitive personal identifiable information such as local filesystem usernames and home directory paths using PII-redacted diagnosis channels.

```dart
final DoctorText doctorText = DoctorText(logger, doctor: doctor);
final String sanitizedReport = await doctorText.piiStrippedText;
```
