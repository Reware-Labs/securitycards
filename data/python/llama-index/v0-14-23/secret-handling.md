# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: secret handling

## secret handling

### Configure Cloud Mode and Persistent Storage for OAuth Tokens

**Use when**

Instantiating cloud tools and readers that acquire and store OAuth access and refresh tokens.

**Secure rules**

**Rule 1: Enable cloud configuration parameters to prevent persisting OAuth tokens to local disk.**

When running in shared, serverless, or cloud container environments, explicitly set `is_cloud=True` when initializing tool specifications or readers to prevent sensitive user tokens from being written to unmanaged local JSON files.

```python
from llama_index.tools.google import GoogleCalendarToolSpec

tool_spec = GoogleCalendarToolSpec(
    service_account_key=service_account_info_dict,
    is_cloud=True
)
```

**Rule 2: Provide secure persistent token storage for client OAuth authentication.**

Avoid relying on default in-memory token storage that loses credentials or increases exposure in process dumps. Provide a secure, persistent implementation when configuring clients requiring OAuth token management.

```python
from llama_index.tools.mcp import BasicMCPClient

client = BasicMCPClient.with_oauth(
    command_or_url="https://mcp.example.com/sse",
    client_name="my_app",
    redirect_uris=["https://app.example.com/callback"],
    redirect_handler=my_redirect_fn,
    callback_handler=my_callback_fn,
    token_storage=MySecureEncryptedTokenStorage()
)
```


### Prevent Hardcoded API Keys and Credentials in Source Files

**Use when**

Configuring LLMs, vector stores, readers, tools, and data connectors with third-party service credentials or database passwords.

**Secure rules**

**Rule 1: Avoid hardcoding API keys, passwords, and tokens in source code or notebooks.**

Do not embed secret credentials or plaintext keys directly into Python scripts, configuration parameters, or Jupyter notebooks. Always fetch sensitive values dynamically from environment variables or secure secret managers.

```python
import os
from llama_index.llms.openai import OpenAI

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is missing")

llm = OpenAI(api_key=openai_api_key)
```

**Rule 2: Pass session-specific API keys directly to client constructors instead of mutating global environment state.**

When handling user-provided credentials in web or multi-tenant applications, pass the API key directly to the provider client constructor rather than writing it to global process variables via `os.environ` to prevent credential leaks across threads or sessions.

```python
from llama_index.llms.openai import OpenAI

def get_llm(llm_name, model_temperature, api_key, max_tokens=256):
    return OpenAI(
        api_key=api_key,
        temperature=model_temperature,
        model=llm_name,
        max_tokens=max_tokens,
    )
```
