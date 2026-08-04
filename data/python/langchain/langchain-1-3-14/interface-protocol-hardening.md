# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: interface protocol hardening

## interface protocol hardening

### Restrict Base URLs to Supported HTTP and HTTPS Protocols

**Use when**

Configuring service endpoints and base URLs for client connections to prevent protocol smuggling or unsupported protocol handlers.

**Secure rules**

**Rule 1: Enforce valid HTTP and HTTPS protocols on client base URL configurations.**

Ensure that any service base URL uses valid `http` or `https` schemes. Pass properly formatted endpoints to prevent connection attempts to non-HTTP handlers or protocol confusion.

```python
from langchain_ollama import ChatOllama

chat = ChatOllama(
    model="llama3.1",
    base_url="https://ollama.example.com:11434"
)
```
