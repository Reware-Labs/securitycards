# Security blueprint

Repository: `https://github.com/yaml/pyyaml#6.0.3`

## Security posture

When processing configuration files or data streams in PyYAML, developers must assume that inputs from external sources are inherently untrusted and capable of triggering resource exhaustion, parsing exceptions, or unsafe deserialization if loaded incorrectly. While PyYAML provides safe parsing mechanisms and restricts dangerous default object constructors via `yaml.SafeLoader`, developers are responsible for enforcing strict payload limits, explicit input schemas, and robust error handling. Security-sensitive surfaces include custom node constructors, implicit resolvers, path resolvers, and serializer lifecycles, where incorrect typing or unhandled exceptions must fail closed.

## Essential implementation rules

1. **Use Safe Loaders and SafeLoader Inheritance**

Always use `yaml.safe_load` or `yaml.CSafeLoader` when processing untrusted YAML input to prevent arbitrary object construction and remote code execution. When defining custom loader classes or path resolvers, inherit from `yaml.SafeLoader` rather than `yaml.Loader` to ensure that dangerous default object constructors are not preserved.

2. **Enforce Strict Schema and Type Validation**

Perform post-load schema validation, structural constraints enforcement, and explicit type assertions on parsed objects and primitives using `isinstance` to ensure input types match application expectations. Explicitly verify expected node types such as `ScalarNode`, `SequenceNode`, or `MappingNode` in custom constructors and raise `ConstructorError` when structures violate schema contracts.

3. **Reject Unrecognized Tags and Blacklist Unauthorized State Keys**

Rely on `SafeConstructor` defaults or implement strict fallback handlers to reject unrecognized YAML tags and unknown fields. When reconstructing Python objects using `FullLoader` subclasses, override `get_state_keys_blacklist()` to return regex patterns for prohibited or unauthorized attribute names.

4. **Handle Parsing Exceptions and Sanitize Error Outputs**

Wrap all PyYAML loading and parsing calls in `try...except` blocks handling `yaml.YAMLError`, `yaml.scanner.ScannerError`, `yaml.parser.ParserError`, or `yaml.reader.ReaderError`. Avoid directly outputting `str(error)` in user-facing error messages or external logs to prevent leaking sensitive data snippets extracted from input buffers.

5. **Limit Input Payload Size and Handle Recursion Exceptions**

Enforce maximum input payload size limits by checking string or stream lengths before processing. Catch both `yaml.YAMLError` and `RecursionError` exceptions during loading to prevent resource exhaustion from deeply nested or overly complex YAML structures.

6. **Enforce Single Document Structure and Path Resolver Rules**

Reject YAML streams containing multiple documents using `ComposerError` when a single-document structure is expected. Use `BaseResolver.add_path_resolver` and `add_implicit_resolver` with explicit loader classes, strict regular expression patterns, and precise node kinds to prevent structural mismatches and type coercions.

7. **Register Custom Constructors with SafeLoader**

Explicitly supply `Loader=yaml.SafeLoader` when registering custom constructors with `add_constructor` to ensure security controls remain consistently applied and enabled across safe execution paths.

8. **Enforce Correct Serializer Lifecycle State**

Strictly follow the serializer lifecycle contract by invoking `open()` prior to serialization and placing `close()` in a cleanup block when using `Serializer` directly to prevent unhandled `SerializerError` exceptions and malformed YAML streams.
