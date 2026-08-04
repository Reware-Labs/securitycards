# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`
Category: resource exhaustion

## resource exhaustion

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
