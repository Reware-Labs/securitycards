# Security blueprint

Repository: `https://github.com/pydantic/pydantic#v2.13.4`

## Security posture

When developing applications with Pydantic, developers must treat all external data boundaries as untrusted and configure strict validation policies to prevent unexpected coercion or resource exhaustion. Pydantic validates data types, boundaries, and schemas by default, but it does not protect against unsafe third-party deserialization, sensitive data exposure in logs, or validation bypasses without explicit defensive configurations. Security-sensitive surfaces include external payload parsers, URL and DSN ingestion points, custom field validators, and configuration assignments, all of which should fail closed when untrusted input is processed.

## Essential implementation rules

1. **Configure Explicit API Aliases and Serialization Boundaries**

Always pass `by_alias=True` when generating JSON schemas for external API clients, and set `serialize_by_alias=True` in `ConfigDict` or `model_dump` calls to prevent exposing internal Python attribute names in outgoing API responses.

2. **Enforce Strict Payload Schema Validation and Boundary Checks**

Set `model_config = ConfigDict(extra='forbid')` inside models receiving untrusted payloads to ensure unexpected fields are rejected with a `ValidationError`. Define explicit upper and lower boundary constraints or temporal constraints using `Field` or `Annotated` types.

3. **Use Safe YAML Parsers Before Model Validation**

When validating data from a YAML file, parse the document securely with `yaml.safe_load()`, then pass the resulting Python data to `BaseModel.model_validate()` for validation against the model.

4. **Avoid Validation Bypass APIs When Processing Untrusted Data**

Use standard validation methods like `model_validate()` instead of `model_construct()` or unvalidated `model_copy(update=...)` mappings when handling external data to ensure all field constraints, types, and custom validators are properly enforced.

5. **Enable Default Value Validation and Inner Container Constraints**

Set `validate_default=True` on fields or within model configuration to ensure default values undergo custom validators and type checks, and use `typing.Annotated` with `Field` metadata on inner container elements to enforce security constraints.

6. **Use Validation-Mode Schemas and Constrain Type Bounds**

Use `model_json_schema(mode='validation')` to describe input contracts matching accepted runtime inputs, and parameterize type attributes with specific base classes rather than unconstrained types to enforce subclass validation at runtime.

7. **Enforce Strict Validation Modes to Prevent Implicit Coercion**

Enable strict mode (`strict=True`) on models, fields, or validation calls to reduce unwanted input coercion, and account for the input source when strictly validating temporal or numeric values.

8. **Validate and Restrict Network, URI, and Module Import Inputs**

Use specialized network types such as `HttpUrl` or DSN types instead of generic strings to restrict acceptable schemes, and enforce strict allowlists before validating `ImportString` fields to prevent dynamic module loading.

9. **Enforce Length and Size Constraints to Prevent Resource Exhaustion**

Use `max_length` in `Field`, `conbytes`, collections, and `UrlConstraints` to restrict input size and prevent excessive memory allocation or CPU utilization, and enable `fail_fast=True` on complex collection schemas.

10. **Protect Sensitive Fields and Credentials with Secret Types**

Wrap sensitive parameters using `SecretStr` or `SecretBytes` so Pydantic automatically masks these values in string representations and logs, and set `hide_input_in_errors=True` in model configuration to prevent credential leakage in exceptions.

11. **Enable Assignment Validation and Maintain Dataclass Integrity**

Configure Pydantic dataclasses with `ConfigDict(validate_assignment=True)` to ensure attribute mutations post-creation enforce field constraints and maintain invariant guarantees across the object lifecycle.
