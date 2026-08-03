# Security blueprint

Repository: `https://github.com/pallets/jinja#3.1.6`

## Security posture

The Jinja security model assumes that templates processed from untrusted inputs require explicit isolation via sandboxed environments and strict output encoding. While standard environments protect against default behaviors, developers must enforce sandbox restrictions, autoescaping, and parameter validation to prevent sandbox bypasses and template injections. Any failure in handling untrusted scopes, dynamic attributes, or external helper loading should fail closed by raising explicit security or configuration exceptions.

## Essential implementation rules

1. **Enforce Sandboxed Environments for Untrusted Templates**

Initialize templates using `SandboxedEnvironment` or `ImmutableSandboxedEnvironment` to automatically intercept attribute lookups, block access to private dunder attributes like `__class__`, prevent state mutations, and safely restrict range allocations to prevent resource exhaustion.

2. **Mark Mutating or Sensitive Functions as Unsafe**

Decorate sensitive or state-changing Python callables exposed to templates using the `@unsafe` decorator or by setting `alters_data = True` to ensure the sandbox raises a `SecurityError` upon unauthorized invocation.

3. **Isolate State on Environment Objects**

Custom Jinja extensions must store configuration and dynamic state exclusively on the `Environment` object rather than extension instances to prevent state pollution and information leakage across requests.

4. **Restrict Dynamic Import Paths and Extensions**

Provide explicit extension classes or static import strings when adding extensions, and validate user input against a strict allowlist before passing keys to `import_string` to avoid arbitrary code execution.

5. **Secure Bytecode Caches and Environment Initialization**

Ensure bytecode cache storage backends are strictly write-protected against tampering, and initialize the Jinja environment once with explicit configurations to avoid undefined runtime behavior.

6. **Sanitize Dictionary Keys for HTML Attribute Rendering**

Pass untrusted dynamic data exclusively as dictionary values rather than keys when using the `xmlattr` filter, ensuring keys are valid attribute names devoid of illegal characters.

7. **Wrap Literal Template Syntax in Raw Blocks**

Encapsulate client-side framework placeholders or literal Jinja delimiters such as `{{` or `{%` inside `{% raw %}` and `{% endraw %}` blocks to prevent server-side parser interpretation.

8. **Enable Autoescaping and Contextual Output Encoding**

Initialize the `Environment` class with autoescaping enabled via `select_autoescape`, apply manual escaping filters like `|e` or `forceescape` when needed, and use block-level autoescape directives for precise control.

9. **Safely Concatenate and Translate Sequences**

Use `markup_join` or `markupsafe.Markup` for combining markup sequences, and keep autoescaping enabled with newstyle gettext callables during internationalization to protect dynamic variables.

10. **Configure StrictUndefined and Safe Native Environments**

Set `undefined=StrictUndefined` in production to fail closed on missing variables, and combine `SandboxedEnvironment` with `NativeEnvironment` when rendering native Python types from untrusted templates.

11. **Restrict Debug Extensions to Non-Production Environments**

Conditionally load the `jinja2.ext.debug` extension strictly based on development environment variables to prevent accidental dumping of sensitive template variables and environment settings in production.
