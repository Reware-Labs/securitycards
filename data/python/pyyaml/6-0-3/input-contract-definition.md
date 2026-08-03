# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`
Category: input contract definition

## input contract definition

### Enforce Single Document Structure for YAML Inputs

**Use when**

When parsing untrusted YAML input streams that are expected to contain exactly one document structure.

**Secure rules**

**Rule 1: Reject YAML streams containing multiple documents when a single-document structure is expected.**

Use yaml.safe_load() to parse configuration inputs and handle ComposerError to reject streams containing unexpected multiple documents.

```python
import yaml
from yaml.composer import ComposerError

def load_single_config(raw_yaml: str):
    try:
        return yaml.safe_load(raw_yaml)
    except ComposerError:
        raise ValueError("Expected exactly one YAML document in stream")
```


### Enforce Strict Schema and Type Validation on YAML Input and Custom Constructors

**Use when**

Parsing untrusted YAML documents or defining custom constructors, path resolvers, and implicit resolvers where input structure and data types must be strictly enforced.

**Secure rules**

**Rule 1: Validate AST node types and restrict state keys in custom constructors.**

When creating custom YAML node constructors, explicitly verify expected node types such as `ScalarNode`, `SequenceNode`, or `MappingNode` and raise `ConstructorError` when node structures violate the expected schema contract. Additionally, extend `get_state_keys_blacklist()` on custom loaders to reject unauthorized object state keys.

```python
import yaml
from yaml.constructor import SafeConstructor, ConstructorError
from yaml.nodes import ScalarNode

class CustomConstructor(SafeConstructor):
    def construct_custom_tag(self, node):
        if not isinstance(node, ScalarNode):
            raise ConstructorError(None, None, f'expected scalar node, got {node.id}', node.start_mark)
        value = self.construct_scalar(node)
        return value

CustomConstructor.add_constructor('!custom', CustomConstructor.construct_custom_tag)
```

**Rule 2: Configure path resolvers to enforce structural document constraints.**

Use `BaseResolver.add_path_resolver` to define structural path rules for incoming YAML data, binding target tags, node types, and explicit path element selectors explicitly to a safe loader class derived from `yaml.SafeLoader`.

```python
import yaml

class SecureSchemaLoader(yaml.SafeLoader):
    pass

yaml.add_path_resolver('!user_node', ['user', None], dict, Loader=SecureSchemaLoader)

with open('input.yaml', 'rb') as f:
    data = yaml.load(f, Loader=SecureSchemaLoader)
```

**Rule 3: Perform post-load schema validation and type assertion on parsed objects.**

After parsing YAML input with `yaml.safe_load()`, perform post-load schema validation and type assertions to verify that implicit scalar type resolutions match the application's required input contract.

```python
import math
import yaml

raw_data = yaml.safe_load(user_input)

if not isinstance(raw_data, dict):
    raise TypeError("Expected YAML mapping at root")

timeout = raw_data.get("timeout")
if not isinstance(timeout, (int, float)) or math.isinf(timeout) or math.isnan(timeout):
    raise ValueError("Invalid schema: timeout must be a finite number")
```


### Enforce Strict Unknown Field and Tag Rejection During YAML Construction

**Use when**

When parsing and constructing objects from untrusted YAML documents using PyYAML loaders, and unknown fields or tags must be strictly rejected or validated.

**Secure rules**

**Rule 1: Reject unrecognized YAML tags and unknown fields by relying on SafeConstructor defaults or implementing strict fallback validation.**

By default, `SafeConstructor` maps unknown tags to `construct_undefined`, which raises a `ConstructorError`. When registering custom fallback constructors via `add_constructor(None, ...)`, validate all incoming unknown tag identifiers and node structures before processing to prevent unintended behavior.

```python
import yaml
from yaml.constructor import SafeConstructor, ConstructorError

def custom_unknown_tag_handler(constructor, node):
    raise ConstructorError(None, None, f'Unexpected tag {node.tag}', node.start_mark)

class StrictLoader(yaml.SafeLoader):
    pass

StrictLoader.add_constructor(None, custom_unknown_tag_handler)
```

**Rule 2: Blacklist disallowed object state keys in custom FullLoader classes to prevent unauthorized attribute injection.**

When reconstructing Python objects from YAML streams using `FullLoader` subclasses, enforce strict field validation by overriding `get_state_keys_blacklist()`. Return regex patterns for unrecognized, private, or prohibited attribute names to ensure PyYAML raises a `yaml.YAMLError` whenever blacklisted or unexpected state keys are present.

```python
import yaml

class CustomLoader(yaml.FullLoader):
    def get_state_keys_blacklist(self):
        return super().get_state_keys_blacklist() + ['^restricted_.*$', '^internal_method$']

try:
    obj = yaml.load(yaml_stream, Loader=CustomLoader)
except yaml.YAMLError:
    pass
```
