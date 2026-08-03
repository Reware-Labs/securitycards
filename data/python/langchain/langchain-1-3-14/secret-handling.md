# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: secret handling

## secret handling

### Protect API Keys and Credentials Using SecretStr and Environment Variables

**Use when**

When instantiating model wrappers, clients, and providers in LangChain, or loading secrets from configuration sources.

**Secure rules**

**Rule 1: Provide API credentials securely via Pydantic `SecretStr` instances or environment variables instead of hardcoding plaintext strings.**

Always wrap sensitive API keys and tokens in `SecretStr` objects or load them automatically from environment variables to prevent credentials from leaking in logs, exception tracebacks, or shell histories.

```python
import os
from pydantic import SecretStr
from langchain_openai import ChatOpenAI

os.environ["OPENAI_API_KEY"] = "your-api-key"
model = ChatOpenAI(
    api_key=SecretStr("your-api-key-here")
)
```


### Redact Secrets and Prevent Exposure in Serialization and File Storage

**Use when**

When serializing objects, saving configurations, storing tokens to disk, or handling sensitive payloads.

**Secure rules**

**Rule 1: Ensure sensitive credential fields are marked with `SecretStr` or registered in `lc_secrets` to prevent plaintext leakage during object serialization and local storage.**

When saving files, serializing models, or persisting tokens locally, rely on built-in secret masking and restrict file permissions on stored credential files to prevent unauthorized local or serialized access.

```python
from pathlib import Path
from langchain_openai.chatgpt_oauth import _FileChatGPTOAuthTokenProvider

secure_store_path = Path.home() / ".secrets" / "chatgpt-auth.json"
provider = _FileChatGPTOAuthTokenProvider(path=secure_store_path)
```


### Sanitize Output Streams and Protect Against Secret Injection

**Use when**

When processing untrusted user inputs, tool results, or streaming agent outputs that may contain sensitive data.

**Secure rules**

**Rule 1: Configure redaction rules and middleware to scrub sensitive credentials and tokens from inputs, outputs, tool results, and serialized payloads.**

Use `PIIMiddleware` and `ShellToolMiddleware` with explicit redaction rules to automatically scrub sensitive tokens, keys, and personal identifiers before returning results to LLMs or saving them in state.

```python
from langchain.agents.middleware.shell_tool import ShellToolMiddleware
from langchain.agents.middleware._redaction import RedactionRule

middleware = ShellToolMiddleware(
    redaction_rules=[
        RedactionRule(pattern=r"(?i)(api[_-]?key|secret|token)\s*=\s*['"]?([a-zA-Z0-9_\-]{16,})")
    ]
)
```
