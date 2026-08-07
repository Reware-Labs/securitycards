# Security blueprint

Repository: `https://github.com/flutter/flutter#3.44.8`

## Security posture

Developers working with Flutter must ensure robust boundary control, strict input validation across all interfaces, and secure configuration management. While the framework provides foundational protections, native bridges, FFI bindings, form state processing, and web style injections represent sensitive surfaces that require explicit defensive controls. Any validation failure, malformed payload, or untrusted source configuration must fail closed securely.

## Essential implementation rules

1. **Validate Form State and Inputs Explicitly**

Explicitly invoke and verify `FormState.validate()` before triggering `FormState.save()` or processing user inputs. Attach explicit validator functions to `TextFormField` and `FormField` components to enforce input contracts and prevent unvalidated data processing.

2. **Specify Explicit Application Identifiers for mDNS Discovery**

Always supply an explicit application bundle or process identifier when querying for mDNS attach targets to prevent attaching to an unintended local service.

3. **Verify Secure Repository and Mirror URLs**

Ensure all custom host mirror URLs and environment overrides such as `PUB_HOSTED_URL`, `FLUTTER_STORAGE_BASE_URL`, and `FLUTTER_GIT_URL` use fully qualified HTTPS URIs and valid TLS configurations.

4. **Restrict Validation Failure Overrides in Rendering Subsystems**

Avoid returning true unconditionally from custom validation failure callbacks registered with `ImpellerValidationErrorsSetCallback` to prevent suppressing rendering errors and bypassing process termination.

5. **Use Exclusive Mode for Secure File Creation**

Set the `exclusive` parameter to true during file creation so that the operation fails safely if the target path already exists, protecting against symlink attacks and file overwrites.

6. **Escape Dynamic Variables in YAML Templates**

When substituting dynamic variables such as branch names or user inputs into YAML templates, format variables using `escapeYamlString` to safely enclose inputs in double quotes and escape special control characters.

7. **Supply CSP Nonces and Selector Prefixes for Global Styles**

When dynamically inserting style elements via `StyleManager.attachGlobalStyles`, pass the active host CSP nonce through the `styleNonce` parameter and scope the styles using `cssSelectorPrefix` to prevent style execution failures and CSS injection.

8. **Validate Android Build Numbers and Input Constraints**

Ensure that buildNumber inputs and other numerical parameters are validated as positive integers within allowed store limits before processing to prevent build exits and disrupted pipelines.

9. **Anchor Regex Proxy Rules and Enforce Path Boundaries**

Always define regular expression proxy patterns with explicit start anchors (^) using `RegExp` to ensure matching occurs strictly from the start of the path, preventing unexpected request routing or access control bypasses.

10. **Canonicalize Localization Messages and External Server URIs**

Canonicalize and escape special syntax in ICU localization messages to prevent lexing failures. For external DevTools server configuration inputs, supply a fully qualified URI containing an explicit scheme and verify it parses successfully.

11. **Enforce Strict Native Resolvers and Platform Channel Handlers**

Enforce strict static dispatch registration for native bindings using typed dispatchers and validate all incoming method names, payload types, and argument structures across platform channels. Wrap handlers in `try-catch` blocks, return error envelopes, and clean up handlers during `onDetachedFromEngine`.

12. **Filter Framing Headers in Proxy Middleware**

Strip hop-by-hop and transport framing headers such as `Content-Length` from original request headers before proxying requests to downstream targets using `shelf` to prevent request smuggling.

13. **Enable Engine Sanitizers During Debug Testing**

Enable Address Sanitizer, Memory Sanitizer, Undefined Behavior Sanitizer, or Thread Sanitizer when compiling and testing unoptimized Flutter Engine debug builds to catch native memory safety flaws.

14. **Configure Loopback Exemptions for Proxy Environments**

Define `NO_PROXY` or `no_proxy` explicitly with standard comma-separated entries including loopback addresses like `localhost`, `127.0.0.1`, and `::1` to prevent internal traffic from routing through external proxies.

15. **Enforce Image Decoding Limits and Redact Sensitive Logs**

Wrap image providers with `ResizeImage` to restrict decoded bitmap dimensions and prevent resource exhaustion. Configure logging mechanisms and diagnostic reporters to filter sensitive tokens, credentials, and PII from outputs.
