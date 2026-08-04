# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`

## Category: access control

### Enforce Sandbox Restrictions and Access Controls for Untrusted Templates

**Use when**

When rendering untrusted user-supplied templates or exposing Python objects and functions to templates where unauthorized actions, side effects, or cross-boundary data access must be prevented.

**Secure rules**

**Rule 1: Use SandboxedEnvironment to restrict dangerous attribute access and methods when executing untrusted templates.**

Initialize templates using `SandboxedEnvironment` to automatically intercept attribute lookups and block access to private dunder attributes like `__class__` and unsafe methods. Limit context data to required objects only.

```python
from jinja2.sandbox import SandboxedEnvironment

env = SandboxedEnvironment()
template = env.from_string('{{ user.name }}')
result = template.render(user=user_object)
```

**Rule 2: Mark state-changing or sensitive functions with the unsafe decorator.**

Decorate sensitive or mutating Python callables exposed to templates using the `@unsafe` decorator or by setting `alters_data = True`. This ensures `SandboxedEnvironment` raises a `SecurityError` if an untrusted template attempts to invoke them.

```python
from jinja2.sandbox import SandboxedEnvironment, unsafe

@unsafe
def delete_user_record(user_id):
    pass

env = SandboxedEnvironment()
env.globals['delete_user'] = delete_user_record
```


## Category: api contract misuse

### Do not store request state on custom extension instances

**Use when**

When creating custom Jinja extensions that need to manage state or configuration across templates.

**Secure rules**

**Rule 1: Store configuration and dynamic state on the Environment object instead of extension instances.**

Custom Jinja extensions must never store environment-specific, request-specific, or user-sensitive data on `self`. Because extensions are shared across templates and bound to environment overlays using `Extension.bind()`, storing dynamic state on the extension instance causes state pollution and information leakage across environments or requests. Instead, place configuration on the `Environment` object using explicit, prefixed attribute names.

```python
class SafeCustomExtension(Extension):
    def __init__(self, environment: Environment):
        super().__init__(environment)
        environment.custom_ext_feature_enabled = True

    def parse(self, parser):
        if self.environment.custom_ext_feature_enabled:
            pass
```


## Category: boundary control

### Use ImmutableSandboxedEnvironment to block state mutation

**Use when**

Rendering untrusted templates where data structures and application state must be protected against modification during execution.

**Secure rules**

**Rule 1: Instantiate `ImmutableSandboxedEnvironment` to prevent templates from calling mutating methods on built-in types.**

When processing untrusted templates that must not modify input data, instantiate `ImmutableSandboxedEnvironment` instead of standard environments. This enforces boundaries by raising a `SecurityError` if any template attempts to execute mutating operations like `append()`, `clear()`, or `pop()` on lists and dictionaries.

```python
from jinja2.sandbox import ImmutableSandboxedEnvironment
from jinja2.exceptions import SecurityError

env = ImmutableSandboxedEnvironment()
template = env.from_string('{{ items.append(1) }}')
try:
    template.render(items=[])
except SecurityError:
    pass
```


## Category: dangerous execution

### Restrict Dynamic Import Paths and Environment Extensions to Static or Allowlisted Values

**Use when**

Configuring Jinja environment extensions or resolving dynamic helper strings that use `import_string` or extension loading mechanisms.

**Secure rules**

**Rule 1: Use explicit extension classes or static import strings instead of passing unvalidated user input into environment extensions**

When creating an `Environment` or calling `add_extension`, always provide explicit extension classes or static, hardcoded import strings. Never pass untrusted user input, attacker-controlled or untrusted strings directly into the extensions argument to prevent attackers from triggering arbitrary Python module imports.

```python
from jinja2 import Environment
from jinja2.ext import i18n

# Pass explicit extension classes or static module paths
env = Environment(
    extensions=[i18n]
)
```

**Rule 2: Validate user input against a strict allowlist before passing it to import_string.**

Do not pass user-supplied strings or unvalidated input directly into `import_string`, as it dynamically imports modules and resolves object attributes using Python builtins. Always check user keys against an explicit allowlist mapping to trusted helper paths before resolution.

```python
from jinja2.utils import import_string

ALLOWED_HELPERS = {
    "date_format": "myapp.helpers.date_format",
    "string_clean": "myapp.helpers.string_clean",
}

def get_helper(user_key: str):
    if user_key not in ALLOWED_HELPERS:
        raise ValueError("Unauthorized helper key")
    return import_string(ALLOWED_HELPERS[user_key])
```


## Category: deserialization

### Secure Bytecode Cache Storage Backends and Avoid Untrusted Deserialization

**Use when**

Configuring Jinja bytecode caches or handling serialized Environment instances where untrusted data or insecure deserialization could lead to arbitrary code execution.

**Secure rules**

**Rule 1: Isolate and write-protect bytecode cache storage backends against untrusted access.**

Ensure that bytecode cache storage backends such as filesystem directories or Memcached instances are strictly write-protected so that untrusted users cannot tamper with cache contents loaded via `pickle.load` or `marshal.load`.

```python
from jinja2 import Environment, FileSystemBytecodeCache

bcc = FileSystemBytecodeCache(directory="/var/app/private_cache")
env = Environment(bytecode_cache=bcc)
```

**Rule 2: Initialize the Jinja environment once with explicit, trusted configuration**

Create the Environment during application initialization, configure its loader and autoescaping explicitly, and avoid modifying it after templates have been loaded because Jinja documents that later modifications cause undefined behavior.

```python
from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
 loader=FileSystemLoader("templates"),
 autoescape=select_autoescape(["html", "htm", "xml"]),
)
```


## Category: injection

### Validate dictionary keys for safe HTML attribute rendering

**Use when**

Rendering dynamic HTML or XML attributes using the `xmlattr` filter in templates to prevent attribute injection.

**Secure rules**

**Rule 1: Ensure dictionary keys passed to the xmlattr filter contain only valid attribute names without invalid characters.**

Pass trusted key names in dictionary objects when rendering HTML attributes via `xmlattr` to prevent unexpected template execution errors and protect against attribute injection attacks.


## Category: input interpretation safety

### Wrap static template syntax in raw blocks

**Use when**

When templates contain literal Jinja delimiters or front-end framework placeholders that should be interpreted strictly as literal text rather than being parsed and executed.

**Secure rules**

**Rule 1: Wrap literal template delimiters in raw blocks to prevent server-side parser interpretation.**

When templates include client-side framework placeholders or literal Jinja delimiters such as `{{` or `{%`, encapsulate those sections inside `{% raw %}` and `{% endraw %}` blocks. This ensures the lexer treats the text literally and avoids unexpected `TemplateSyntaxError` exceptions or parser differential issues during interpretation.

```python
from jinja2 import Environment

env = Environment()
template = env.from_string("{% raw %}Hello {{ client_side_var }}{% endraw %}")
rendered = template.render()
```


## Category: output encoding

### Enable autoescaping and explicit filters for safe HTML output rendering

**Use when**

When rendering dynamic templates or handling untrusted user input within HTML and internationalization contexts to prevent cross-site scripting.

**Secure rules**

**Rule 1: Enable autoescaping explicitly when initializing the Jinja environment.**

Initialize the `Environment` class with `autoescape=True` or use `select_autoescape` to ensure dynamic variable values are automatically sanitized against cross-site scripting vulnerabilities.

```python
from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
    loader=FileSystemLoader("templates"),
    autoescape=select_autoescape(["html", "xml"])
)
```

**Rule 2: Apply manual escaping filters when autoescaping is disabled.**

Explicitly pass untrusted dynamic variable values through the `|e` or `|escape` filter when manual escaping is used or automatic escaping is disabled in the application environment.

```html
<p>User profile: {{ user.username|e }}</p>
```

**Rule 3: Enforce HTML escaping on safe strings using forceescape.**

Use the `forceescape` filter to explicitly enforce HTML escaping on variable values, even when the underlying object implements the `__html__` interface or is already wrapped in a safe `Markup` object.

```html
<div>
  {{ untrusted_user_content | forceescape }}
</div>
```

**Rule 4: Use block-level autoescape directives for contextual output encoding.**

Use the `{% autoescape %}` statement to dynamically override or enforce autoescaping rules for specific sections of a template when handling variable contexts with varying escaping requirements.

```html
{% autoescape true %}
  <p>User bio: {{ user_bio }}</p>
{% endautoescape %}
```

**Rule 5: Enable autoescaping explicitly for templates that render HTML or XML**

Explicitly configure autoescape using autoescape=True or select_autoescape when rendering HTML or XML templates to reduce the risk of unescaped output.

```python
from jinja2 import Environment, select_autoescape

env = Environment(
    autoescape=select_autoescape(["html", "xml"])
)
```


### Sanitize and encode attributes, translations, and sequences securely

**Use when**

When processing attributes, concatenating markup sequences, or using internationalization extensions with dynamic variables in templates.

**Secure rules**

**Rule 1: Sanitize attribute keys when using the xmlattr filter.**

Pass untrusted dynamic data exclusively as dictionary values rather than dictionary keys when generating HTML attributes using the `xmlattr` filter, ensuring keys do not contain illegal characters.

```html
<ul{{ {'class': 'user-list', 'id': user_provided_id}|xmlattr }}>
  <li>User item</li>
</ul>
```

**Rule 2: Enable autoescaping for dynamic variables in i18n translation functions.**

Keep autoescaping enabled and use newstyle gettext callables via `install_gettext_callables(..., newstyle=True)` so that dynamic variable arguments passed to translation functions inside templates are safely HTML-encoded.

```python
from jinja2 import Environment

env = Environment(extensions=["jinja2.ext.i18n"], autoescape=True)
env.install_gettext_callables(
    gettext_func,
    ngettext_func,
    newstyle=True
)
```

**Rule 3: Use markup_join for safely concatenating HTML template sequences.**

Use `markup_join` or `markupsafe.Markup` instead of standard Python string concatenation or `str.join` when custom filters or runtime helpers concatenate sequences containing HTML markup or dynamic template variables.

```python
from jinja2.runtime import markup_join
from markupsafe import Markup

def render_tags(tags):
    items = [Markup("<span>"), tags, Markup("</span>")]
    return markup_join(items)
```

**Rule 4: Enable autoescape when joining list items containing untrusted strings.**

Configure the environment with `autoescape=True` so that the `join` filter automatically HTML-escapes raw string elements in a collection while preserving safe elements.

```python
from markupsafe import Markup
from jinja2 import Environment

env = Environment(autoescape=True, enable_async=True)
tmpl = env.from_string("{{ items|join(', ') }}")
```


## Category: resource exhaustion

### Enforce Range Limits and Intercept Expensive Operations in Sandboxed Environments

**Use when**

Rendering untrusted templates where attackers might trigger excessive CPU or memory consumption using large ranges or expensive operators.

**Secure rules**

**Rule 1: Use SandboxedEnvironment to automatically restrict range allocations and prevent resource exhaustion.**

Always render untrusted template strings using `SandboxedEnvironment` or `ImmutableSandboxedEnvironment` so that Python's built-in range function is safely replaced with `safe_range` which raises an `OverflowError` for ranges exceeding `MAX_RANGE` items.

```python
from jinja2.sandbox import SandboxedEnvironment

env = SandboxedEnvironment()
template = env.from_string('{% for i in range(1000000) %}{{ i }}{% endfor %}')
```


## Category: runtime environment hardening

### Configure StrictUndefined and Sandbox Environments in Production

**Use when**

Configuring Jinja environments in production to restrict runtime behavior and disable unsafe debugging output.

**Secure rules**

**Rule 1: Use StrictUndefined when missing template variables must cause rendering to fail**

Configure `StrictUndefined` as the undefined strategy in production environments to raise an exception on missing variables instead of rendering internal error details and Python object representations.

```python
from jinja2 import Environment, StrictUndefined

# Configure StrictUndefined in production to raise an exception on missing variables
env = Environment(undefined=StrictUndefined)
tmpl = env.from_string('Hello {{ user_name }}')

try:
    rendered = tmpl.render()
except Exception:
    # Handle missing context variables securely
    pass
```

**Rule 2: Combine SandboxedEnvironment with NativeEnvironment for untrusted templates.**

When evaluating native Python types from user-controlled or untrusted templates using Jinja's native rendering features, inherit from both `SandboxedEnvironment` and `NativeEnvironment` to apply attribute access checks and restrict dangerous calls.

```python
from jinja2.sandbox import SandboxedEnvironment
from jinja2.nativetypes import NativeEnvironment

class SandboxedNativeEnvironment(SandboxedEnvironment, NativeEnvironment):
    pass

env = SandboxedNativeEnvironment()
template = env.from_string('{{ x + y }}')
result = template.render(x=4, y=2)
```


## Category: secret handling

### Prevent the Exposure of Sensitive Context Data via Jinja Debug Extensions

**Use when**

Configuring Jinja environments in Python applications where sensitive variables or environment settings might be inadvertently exposed in production.

**Secure rules**

**Rule 1: Restrict the registration of the debug extension to non-production environments to avoid dumping context variables.**

Ensure that the `jinja2.ext.debug` extension is not loaded in production deployments. Conditionally append it based on your application environment variable checks so that template variables, filters, and test states are not dumped to rendered documents.

```python
import os
from jinja2 import Environment

extensions = ['jinja2.ext.i18n']
if os.getenv('APP_ENV') == 'development':
    extensions.append('jinja2.ext.debug')

env = Environment(extensions=extensions)
```


## Category: security control integrity

### Rely on SandboxedEnvironment to intercept format string evaluations and enforce attribute checks

**Use when**

When rendering templates that process untrusted input or use string formatting expressions that could potentially traverse object graphs and bypass standard security checks.

**Secure rules**

**Rule 1: Use SandboxedEnvironment to evaluate format strings and prevent unauthorized attribute lookups.**

Always ensure rendering runs under `SandboxedEnvironment` so that direct and indirect calls to `str.format` and format methods are properly intercepted, preventing access to forbidden properties like `__class__` or `__builtins__`.

```python
from jinja2.sandbox import SandboxedEnvironment

env = SandboxedEnvironment()
template = env.from_string('{{ "Hello {0.name}".format(user) }}')
rendered = template.render(user=user_obj)
```
