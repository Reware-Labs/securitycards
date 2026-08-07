# Security blueprint

Repository: `https://github.com/google/gson#gson-parent-2.14.0`

## Security posture

When working with Gson, developers must assume that untrusted input payloads and object serialization boundaries require explicit hardening to prevent unsafe deserialization, resource exhaustion, and unauthorized data exposure. The library provides high-performance object-to-JSON mapping by default, but does not inherently enforce strictness, safe constructor execution, or sensitive field exclusions without deliberate builder configuration. All parsing, custom deserialization, and reflection instantiation surfaces are security-sensitive and must be locked down against malformed structures, recursive loops, and unvalidated type resolution.

## Essential implementation rules

1. **Enforce Strict Parsing and Reject Duplicate Keys**

Configure Gson instances with `setStrictness(Strictness.STRICT)` and restrict untrusted `JsonReader` instances with a maximum nesting limit via `setNestingLimit(int)` to prevent parser differentials, duplicate key injection, and stack exhaustion from deep recursion.

2. **Disable JDK Unsafe and Enforce Safe Object Construction**

Call `disableJdkUnsafe()` on `GsonBuilder` to prohibit low-level object allocation that bypasses class constructors, and register adapter factories like `PostConstructAdapterFactory` to validate domain invariants after instantiation.

3. **Restrict Polymorphic Deserialization and Class Instantiation to Alllists**

Avoid dynamic class loading or unvalidated type resolution in custom deserializers. Always map untrusted identifiers to specific, safe target types using explicit static allowlists or enum mappings.

4. **Validate JsonElement Types Before Convenience Extractions**

Always check element types using methods like `isJsonObject()` or `isJsonPrimitive()` before invoking typed convenience getters such as `getAsJsonObject()` to prevent unhandled `ClassCastException` and runtime crashes.

5. **Apply Directional Exclusion Strategies and Expose Annotations**

Protect sensitive fields and prevent mass-assignment by configuring `excludeFieldsWithoutExposeAnnotation()` or registering explicit serialization and deserialization exclusion strategies using `addSerializationExclusionStrategy` and `addDeserializationExclusionStrategy`.

6. **Account for Precedence and Explicitly Bind JSON Properties**

Use `@SerializedName` with explicit keys and alternate aliases to define strict input contracts, and ensure application-level type adapter registrations override any field-level or class-level `@JsonAdapter` annotations.

7. **Maintain HTML Escaping and Generate Non-Executable JSON Responses**

Keep default HTML escaping enabled in Gson and `JsonWriter` or explicitly invoke `setHtmlSafe(true)` to prevent cross-site scripting, and call `generateNonExecutableJson()` on web endpoints to prevent script-sourcing data theft.

8. **Enforce Reflection Access Filters for Sensitive Boundary Control**

Configure `GsonBuilder` with `addReflectionAccessFilter(...)` returning `FilterResult.BLOCK_INACCESSIBLE` or `FilterResult.BLOCK_ALL` to harden runtime boundaries against reflective instantiation of restricted record constructors or internal classes.
