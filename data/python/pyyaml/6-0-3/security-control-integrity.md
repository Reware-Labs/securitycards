# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`
Category: security control integrity

## security control integrity

### Register custom tag constructors with SafeLoader to ensure consistent security control enforcement

**Use when**

Registering custom tag constructors for YAML parsing where security controls like `yaml.safe_load` must remain consistently applied and enabled across execution paths.

**Secure rules**

**Rule 1: Explicitly specify Loader=yaml.SafeLoader when registering custom constructors for use with yaml.safe_load()**

When registering a custom constructor for use with yaml.safe_load(), supply Loader=yaml.SafeLoader; omitting it registers the constructor on Loader, FullLoader, and UnsafeLoader, but not SafeLoader.

```python
import yaml

def my_constructor(loader, node):
    return loader.construct_scalar(node).lower()

yaml.add_constructor('!my_tag', my_constructor, Loader=yaml.SafeLoader)

parsed_data = yaml.safe_load('key: !my_tag VALUE')
```
