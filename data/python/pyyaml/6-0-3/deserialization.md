# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`
Category: deserialization

## deserialization

### Use safe loaders and inherit from SafeLoader to prevent arbitrary object deserialization

**Use when**

Parsing untrusted YAML configuration files or defining custom loader classes and path resolvers.

**Secure rules**

**Rule 1: Use yaml.safe_load or yaml.CSafeLoader instead of unsafe loaders when processing untrusted input.**

When processing YAML files from untrusted or user-modifiable sources, use `yaml.safe_load` or specify `yaml.CSafeLoader` to prevent arbitrary object construction and remote code execution vulnerabilities.

```python
import yaml

with open('config.yaml', 'r', encoding='utf-8') as stream:
    config = yaml.safe_load(stream)
```

**Rule 2: Inherit custom loader classes and path resolvers from yaml.SafeLoader.**

When defining custom loader classes or registering path resolvers, inherit from `yaml.SafeLoader` rather than `yaml.Loader` to ensure that dangerous default object constructors are not preserved.

```python
import yaml

class CustomSafeLoader(yaml.SafeLoader):
    pass

yaml.add_path_resolver('!root/key', ['key'], Loader=CustomSafeLoader)

with open('untrusted_data.yaml', 'rb') as file:
    nodes = list(yaml.compose_all(file, Loader=CustomSafeLoader))
```
