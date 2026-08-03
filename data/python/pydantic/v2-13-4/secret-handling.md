# Security cards

Repository: `https://github.com/pydantic/pydantic#v2.13.4`
Category: secret handling

## secret handling

### Protect sensitive fields and credentials using Pydantic secret types and model configuration

**Use when**

Defining Pydantic models that process or store sensitive data like API keys, passwords, tokens, or personal information.

**Secure rules**

**Rule 1: Use SecretStr or SecretBytes for sensitive fields to prevent accidental exposure**

Wrap sensitive parameters using `SecretStr` or `SecretBytes` so Pydantic automatically masks these values in string representations, repr outputs, and model dumps, requiring explicit calls to `.get_secret_value()` to expose the unmasked payload.

```python
from pydantic import BaseModel, SecretStr

class SecurityConfig(BaseModel):
    api_key: SecretStr

config = SecurityConfig(api_key='super-secret-token')
print(config)
raw_key = config.api_key.get_secret_value()
```

**Rule 2: Configure hide input in errors to prevent credential leakage in validation exceptions**

Set `hide_input_in_errors=True` in model configuration to ensure raw input data is not embedded directly into `ValidationError` messages when validation fails on sensitive fields.

```python
from pydantic import BaseModel, ConfigDict

class LoginRequest(BaseModel):
    model_config = ConfigDict(hide_input_in_errors=True)
    username: str
    password: str
```
