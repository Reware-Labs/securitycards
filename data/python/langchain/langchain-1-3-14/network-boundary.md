# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: network boundary

## network boundary

### Enforce SSRF Protection and TLS Verification for Outbound Network Requests

**Use when**

Making outbound HTTP requests, processing dynamic or user-provided URLs in agent tools, or configuring chat model connections in LangChain.

**Secure rules**

**Rule 1: Validate untrusted URLs using async DNS-aware URL validation or SSRF-safe client transports.**

When processing untrusted URLs from user inputs or agent tool arguments, use validate_url or SSRF-safe client transports to resolve domain names upfront, check underlying IP addresses against SSRF policies, and block private IPs, loopback addresses, and cloud metadata endpoints.

```python
from langchain_core._security._policy import SSRFPolicy, validate_url

async def handle_user_url(url: str) -> None:
    policy = SSRFPolicy(
        allowed_schemes=frozenset({"http", "https"}),
        block_private_ips=True,
        block_cloud_metadata=True,
        block_localhost=True,
    )
    await validate_url(url, policy)
```
