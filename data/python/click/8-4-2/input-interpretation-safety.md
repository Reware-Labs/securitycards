# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: input interpretation safety

## input interpretation safety

### Validate Command-Line Inputs Using Custom Parameter Types and Callbacks

**Use when**

Parsing, converting, and validating untrusted command-line inputs or arguments to ensure they conform to expected formats and ranges before processing.

**Secure rules**

**Rule 1: Validate user input during CLI parameter parsing by defining custom `click.ParamType` subclasses or parameter callbacks.**

Implement custom conversion logic using `click.ParamType` subclasses or parameter callbacks, and invoke `self.fail()` or raise `click.BadParameter` with sanitized error messages when input validation fails.

```python
class PortNumber(click.ParamType):
    name = "port"

    def convert(self, value, param, ctx):
        if isinstance(value, int):
            val = value
        else:
            try:
                val = int(value)
            except ValueError:
                self.fail(f"{value!r} is not a valid integer.", param, ctx)

        if not (1 <= val <= 65535):
            self.fail(f"Port {val} is outside allowed range (1-65535).", param, ctx)
        return val
```
