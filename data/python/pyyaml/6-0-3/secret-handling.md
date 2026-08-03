# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`
Category: secret handling

## secret handling

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
