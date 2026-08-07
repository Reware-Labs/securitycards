# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: network boundary

## network boundary

### Configure trusted proxy environment variables with explicit loopback exemptions

**Use when**

When configuring HTTP proxy environment variables for Flutter CLI workflows and development tools to ensure local loopback traffic bypasses the external proxy.

**Secure rules**

**Rule 1: Define `NO_PROXY` or `no_proxy` explicitly with standard comma-separated entries including all loopback interfaces.**

Ensure that loopback addresses such as `localhost`, `127.0.0.1`, and `::1` are explicitly included in proxy exemption configurations using proper comma separation. Avoid non-standard delimiters like semicolons to prevent parsing failures that could route internal traffic through external proxies.

```bash
export HTTP_PROXY="http://proxy.example.com:8080"
export NO_PROXY="localhost,127.0.0.1,::1"
```
