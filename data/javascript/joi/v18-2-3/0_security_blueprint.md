# Security blueprint

Repository: `https://github.com/hapijs/joi#v18.2.3`

## Security posture

The library enforces strict data validation and input contract definition to protect against malformed payloads, prototype pollution, and unexpected type coercion. Developers must explicitly define shape, boundaries, and type constraints because default configurations or loose schemas can leave systems vulnerable to mass assignment and unauthorized property injection. Security-sensitive surfaces include untrusted JSON deserialization, custom validators, and dynamic schema composition, all of which must fail closed when encountering unvetted properties or invalid types.

## Essential implementation rules

1. **Verify API Support Across Runtimes**

Verify API support and avoid calling undefined methods in environment-restricted runtimes such as browsers, ensuring methods like `Joi.binary()` do not cause runtime exceptions that could compromise validation controls.

2. **Enforce Temporal Boundary Checks**

Utilize boundary methods such as `.greater()` or `.less()` combined with `'now'` or dynamic references via `Joi.ref()` to validate relative temporal boundaries and prevent invalid state transitions.

3. **Sanitize Deserialized Objects and Prevent Prototype Pollution**

Pass untrusted parsed JSON through `Joi.object()` schemas and enforce unknown property rejection or stripping to eliminate prototype pollution vectors like `__proto__` and prevent mass assignment attacks.

4. **Enforce Strict Base Types and Reject Unknown Properties**

Avoid generic untyped schemas by explicitly configuring strict base types, disallowing unknown attributes, and stripping unvetted payload properties to prevent arbitrary input injection and type confusion.

5. **Explicitly Allow Empty Strings and Define Allowed Values**

Explicitly allow empty strings using `.allow('')` when empty inputs are valid, and use `.valid()` or `.forbidden()` to enforce strict whitelists and block unauthorized attribute modifications.

6. **Enforce Strict Array Element Types and Filter Options**

Define explicit element schemas using `Joi.array().items()` and configure `stripUnknown: { arrays: true }` in validation preferences to correctly filter out unexpected or non-matching array items.

7. **Validate Complex Nested Models and Manage Hierarchy References**

Compose nested object and array structures explicitly, validate dependencies against upper hierarchy levels using validated relative path references like `Joi.ref('...parentField')`, and use asynchronous validation via `validateAsync()` for external checks.

8. **Disable Implicit Type Coercion for Security-Critical Inputs**

Call `.strict()` or configure `{ convert: false }` on schemas to disable implicit type casting and ensure inputs strictly match expected primitive or symbol mapping types without unexpected coercion.

9. **Manage Property Aliases and Renaming Explicitly**

Configure explicit alias options when renaming keys to prevent parameter ambiguity, ensuring source property retention is explicitly controlled and alias transformations inside alternatives are properly isolated.

10. **Escape HTML in Validation Error Messages**

Configure `errors.escapeHtml` to `true` within validation options to ensure that error messages containing user-supplied input are safely HTML-escaped and protected against Cross-Site Scripting.

11. **Limit Recursive Link Schema Depth**

Configure `maxRecursion()` on recursive link schemas defined with `Joi.link()` to explicitly limit nested object validation depth and prevent excessive stack allocation and resource exhaustion.

12. **Preserve Schema Immutability Across Method Chaining**

Store or return the result of chained Joi method calls since schema chain methods return new instances rather than mutating existing ones in place, preventing unconstrained schemas from accepting malicious input.

13. **Secure Custom Validators and Extension Rules**

Wrap custom validation logic in `try-catch` blocks, use helper methods like `helpers.error()` to signal failures safely, define error message maps for all custom error codes, and execute asynchronous validation via `validateAsync()`.
