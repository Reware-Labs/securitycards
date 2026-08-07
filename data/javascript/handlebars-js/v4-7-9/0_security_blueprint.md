# Security blueprint

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`

## Security posture

Handlebars.js enforces automated HTML-escaping by default to protect outputs, but relies heavily on secure developer configuration for runtime compilation, context scoping, and prototype access. Developers must assume that unvalidated dynamic inputs, unconstrained partial names, and permissive compiler flags can introduce severe cross-site scripting, prototype pollution, or code execution vulnerabilities. Security-sensitive surfaces such as template compilation, helper registration, and AST processing must fail closed by explicitly restricting default privileges.

## Essential implementation rules

1. **Restrict prototype access options during compilation and rendering**

Set `allowProtoMethodsByDefault` and `allowProtoPropertiesByDefault` to `false` in runtime options when rendering templates, and explicitly whitelist only approved properties to prevent prototype pollution.

2. **Validate dynamic partial names against an allowlist**

Never render user-controlled dynamic partial names without confirming they match an explicitly registered and trusted partial map. Use the runtime-only package `require('handlebars/runtime')` to disable fallback compilation.

3. **Restrict partial context scope using explicitPartialContext**

Set `explicitPartialContext` to `true` in compiler options to prevent partials from implicitly inheriting higher-scope parent evaluation context across boundaries.

4. **Use precompiled templates and partials in runtime-only environments**

Compile templates and partials during the build step using precompilation tools and register the resulting functions before rendering, since runtime-only bundles do not include the compiler.

5. **Safely serialize identifiers in custom compiler extensions**

Format name identifiers using `JSON.stringify` rather than raw string concatenation when extending `Handlebars.JavaScriptCompiler` or overriding `nameLookup` to prevent code injection.

6. **Enforce strict compilation mode for required data bindings**

Pass `{ strict: true }` to `Handlebars.compile()` when rendering templates that require explicit data bindings, causing missing path references or undefined objects to throw an exception instead of silently failing.

7. **Reject raw unvalidated AST objects during compilation**

Pass raw string templates directly into `Handlebars.compile()` and reject untrusted pre-parsed AST structures to prevent parser bypass and arbitrary code execution.

8. **Sanitize helper output and enforce HTML escaping**

Sanitize dynamic helper inputs using `Handlebars.Utils.escapeExpression` before wrapping in `Handlebars.SafeString`, keep `noEscape` set to `false`, and ensure programmatically built `MustacheStatement` nodes include `escaped: true`.

9. **Restrict helper execution using knownHelpersOnly**

Pass `knownHelpersOnly: true` and define an explicit `knownHelpers` whitelist during compilation of untrusted templates to ensure the compiler rejects unknown helper expressions.
