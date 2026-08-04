# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`
Category: input interpretation safety

## input interpretation safety

### Handle Parsing and Decoding Exceptions When Processing Untrusted YAML Streams

**Use when**

When parsing untrusted YAML data streams, byte sequences, or configuration files in Python applications using PyYAML.

**Secure rules**

**Rule 1: Explicitly catch parsing, scanning, and reader exceptions when processing untrusted YAML input.**

When loading external or untrusted YAML streams with PyYAML, applications must wrap parsing calls in `try...except` blocks handling `yaml.YAMLError`, `yaml.scanner.ScannerError`, `yaml.parser.ParserError`, or `yaml.reader.ReaderError`. This ensures malformed input, invalid tokens, or unexpected control characters do not trigger unhandled exceptions that cause application crashes or leakage of internal stack traces.

```python
import yaml
from yaml.scanner import ScannerError

def parse_user_input(yaml_text: str):
    try:
        return yaml.safe_load(yaml_text)
    except ScannerError:
        return None
    except yaml.YAMLError:
        return None
```


### Validate Node Types and Scalars in Custom PyYAML Constructors and Resolvers

**Use when**

Implementing custom PyYAML constructors, multi-constructors, path resolvers, implicit resolvers, or processing untrusted parsed YAML structures that are vulnerable to type confusion.

**Secure rules**

**Rule 1: Rely on PyYAML construction methods for node-type validation, adding stricter checks only when required**

When extending SafeConstructor or implementing custom tag constructors with add_constructor or add_multi_constructor, do not assume a tag is tied to a specific YAML structure. Invoke the construction method matching the expected structure; construct_mapping and construct_sequence reject mismatched nodes, while SafeConstructor.construct_scalar also supports PyYAML's special YAML value mapping form, so use an explicit ScalarNode check only when that form must be rejected.

```python
from yaml.constructor import SafeConstructor, ConstructorError
from yaml.nodes import ScalarNode

class CustomConstructor(SafeConstructor):
    pass

def my_custom_constructor(loader, node):
    if not isinstance(node, ScalarNode):
        raise ConstructorError(None, None, f"expected a scalar node, but found {node.id}", node.start_mark)
    value = loader.construct_scalar(node)
    return str(value)

CustomConstructor.add_constructor('!custom', my_custom_constructor)
```

**Rule 2: Enforce strict target node kinds and precise regular expressions when registering path resolvers and implicit resolvers.**

When configuring implicit tag resolution using `add_implicit_resolver` or structural path resolution using `add_path_resolver`, explicitly specify Loader classes, strict regular expression patterns, and precise node kinds (such as `str`, `dict`, or `list`) to prevent unintended type coercions and structural mismatches.

```python
import re
import yaml

pattern = re.compile(r'^[A-Z]{3}-\d{4}$')
yaml.add_implicit_resolver('!custom_id', pattern, Loader=yaml.SafeLoader)
```

**Rule 3: Perform explicit post-construction type checks on loaded YAML fields and primitives.**

When parsing untrusted YAML streams using `yaml.safe_load()`, implicitly resolved scalar values can take on unexpected types like booleans, integers, or floats. Always validate that parsed attribute and field types match expected application types using `isinstance` before passing them to business logic.

```python
import yaml

parsed = yaml.safe_load(yaml_string)
account_id = parsed.get("account_id")
if not isinstance(account_id, str):
    raise TypeError(f"Expected account_id to be a string, got {type(account_id).__name__}")
```
