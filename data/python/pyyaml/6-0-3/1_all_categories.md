# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`

## Category: api contract misuse

### Enforce Correct Serializer Lifecycle State When Processing Streams

**Use when**

When managing direct serializer lifecycles to emit YAML events from AST nodes.

**Secure rules**

**Rule 1: Strictly follow the serializer lifecycle contract by invoking `open()` prior to serialization and `close()` upon completion.**

When invoking `Serializer` directly to emit YAML events, ensure that `open()` is called before passing any nodes to `serialize()`. Place `close()` in a cleanup block to prevent unhandled `SerializerError` exceptions and malformed YAML streams.

```python
from yaml.serializer import Serializer

serializer = Serializer()
serializer.open()
try:
    serializer.serialize(node)
finally:
    serializer.close()
```


## Category: deserialization

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


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: resource exhaustion

### Limit Input Payload Size and Handle Recursion Exceptions

**Use when**

Parsing untrusted YAML documents using PyYAML to prevent resource exhaustion from deeply nested structures.

**Secure rules**

**Rule 1: Enforce maximum input payload size limits and handle recursion and parsing exceptions during YAML loading**

Check the length of the input string before processing to bound input size, and catch yaml.YAMLError and RecursionError exceptions.

```python
import yaml

def parse_user_yaml(yaml_input: str):
    if len(yaml_input) > 65536:
        raise ValueError("YAML payload exceeds maximum allowable length")
    try:
        return yaml.safe_load(yaml_input)
    except (yaml.YAMLError, RecursionError) as exc:
        raise ValueError(f"Invalid or overly complex YAML structure: {exc}")
```


## Category: secret handling

### Sanitize YAML error exceptions to prevent sensitive snippet leakage

**Use when**

Catching parsing errors when processing YAML documents containing secrets, credentials, or sensitive path names.

**Secure rules**

**Rule 1: Sanitize or suppress exception string outputs when handling YAML parsing errors to avoid leaking secrets from input buffers.**

When catching `YAMLError`, avoid directly outputting `str(error)` in user-facing error messages or external logs because exception representations extract text snippets from the input buffer. Log a generic error or a sanitized message instead.

```python
import yaml

try:
    config = yaml.safe_load(sensitive_yaml_input)
except yaml.YAMLError as exc:
    logger.error("YAML parsing error occurred: %s", type(exc).__name__)
    raise ValueError("Invalid configuration provided.")
```


## Category: security control integrity

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
