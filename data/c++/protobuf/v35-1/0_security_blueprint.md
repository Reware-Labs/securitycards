# Security blueprint

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`

## Security posture

Developers working with Protobuf must assume that all incoming binary, JSON, and text-format payloads are untrusted and capable of triggering resource exhaustion, type confusion, or unsafe deserialization if parsed without strict limits and explicit registries. The library protects against malformed serialization structures when proper parsing checks, type registries, and size constraints are enforced, but it relies on developers to explicitly manage recursive dropping of unknown fields and isolate descriptor pools. Security-sensitive surfaces include message deserialization, dynamic code generation, custom arena allocations, and parsing boundaries where unvalidated types or recursive structures can destabilize applications. Any detection of obsolete pre-22 generated code or malformed security-critical inputs must fail closed to prevent silent policy bypasses or memory corruption.

## Essential implementation rules

1. **Use safe copy and validation methods for ByteString and collections**

Always use `ByteString.copyFrom()` when instantiating byte strings from mutable buffers to enforce defensive copying and data immutability. Filter external input collections to exclude null values before populating repeated fields to avoid immediate runtime exceptions.

2. **Validate token parsing inputs and check tokenizer status**

Provide a `upb_Status` object when tokenizing text input and verify `upb_Status_IsOk` upon loop termination to distinguish clean completions from malformed input errors. Ensure input strings originate from tokens parsed with matching types before invoking static parsing helper functions.

3. **Restrict descriptor pools when parsing messages containing Any types**

Explicitly pass an isolated descriptor pool instance to text format functions when processing messages containing `google.protobuf.Any` types to prevent falling back to the default global descriptor pool which exposes all globally registered message descriptors.

4. **Sanitize environment variables for code generator configuration sources**

Launch `protoc` with Objective-C generator environment variables such as `GPB_OBJC_SKIP_IMPLS_FILE` and `GPB_OBJC_HEADERS_ONLY` explicitly unset or set to validated trusted paths, preferring deterministic `--objc_opt` parameters instead.

5. **Compute full cryptographic digests on serialized messages**

Do not rely on language-specific hash methods like Ruby's `Message#hash` for cryptographic integrity or checksums, as they may truncate outputs. Instead, serialize messages to binary byte strings using `encode` and compute full digests using standard cryptographic libraries.

6. **Configure explicit type registries and extension registries for deserialization**

Supply a properly scoped `TypeRegistry` when configuring JSON parsers for messages with `google.protobuf.Any` fields, and provide an explicit `ExtensionRegistry` containing only permitted extensions to prevent untrusted type injection.

7. **Prevent path traversal and enforce output directory containment**

Avoid enabling directory escape flags like `--unsafe_allow_out_dir_escape` when invoking command-line interfaces, and map virtual import base directories using clean relative paths free from parent directory references.

8. **Enforce required fields and valid input structures during parsing**

Use strict parsing methods such as `TextFormat.parse()` to ensure missing required fields trigger initialization exceptions. Validate map keys and values against null constraints before populating map builder fields.

9. **Safely handle and filter unknown fields across trust boundaries**

Explicitly configure JSON and binary parsers to ignore or discard unknown fields rather than relying on default settings, and use recursive runtime helpers like `GPBMessageDropUnknownFieldsRecursively()` before passing message graphs across trust boundaries.

10. **Validate UTF-8 string encodings and handle decoding exceptions**

Always validate byte sequences for UTF-8 compliance using methods like `ByteString.isValidUtf8()` before setting string fields. Wrap deserialization of untrusted bytes and handle both `UnicodeDecodeError` and `DecodeError` exceptions safely.

11. **Synchronize thread lifecycles and validate alignment for arena memory**

Ensure custom arena block allocators maintain strict system alignment and handle allocation failures symmetrically. Join all worker threads performing allocations on an `Arena` before destroying or resetting it to prevent use-after-free vulnerabilities.

12. **Escape untrusted text properly for output contexts**

Treat Protobuf Text Format output as debugging data only and apply context-appropriate plain text encoders before rendering any serialized representation in user-facing or web contexts.

13. **Enforce input size, recursion, and descriptor limits**

Configure explicit recursion depth limits on text-format and JSON parsers, set size limits on `CodedInputStream` instances, and instantiate arenas with defensive options to prevent resource exhaustion and stack overflow crashes.

14. **Redact sensitive data during message formatting**

Use built-in debug formatting options or configure custom printers with debug redaction enabled to ensure sensitive fields marked with `debug_redact=true` are replaced with redaction markers in logs.

15. **Regenerate outdated protobuf code and fail closed on startup**

Recompile all `.proto` files using modern compiler versions and pass the system property `-Dcom.google.protobuf.error_on_unsafe_pre22_gencode=true` during startup to fail explicitly when obsolete legacy generated code is detected.
