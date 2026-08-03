# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: api contract misuse

## api contract misuse

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
