# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: authentication

## authentication

### Use dynamic token providers and verified credentials for authentication

**Use when**

Configuring chat models and authentication providers that require dynamic tokens instead of static API keys or unverified claims.

**Secure rules**

**Rule 1: Authenticate Codex and Azure chat models using dynamic token providers rather than static API keys.**

Pass authentication credentials strictly using a valid token provider instance such as `token_provider` or `azure_ad_token_provider` to fetch short-lived tokens on demand and avoid static credential risks.

```python
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from langchain_openai import AzureChatOpenAI

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

model = AzureChatOpenAI(
    azure_deployment="my-deployment",
    api_version="2024-05-01-preview",
    azure_ad_token_provider=token_provider
)
```
