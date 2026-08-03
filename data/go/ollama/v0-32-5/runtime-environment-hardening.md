# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: runtime environment hardening

## runtime environment hardening

### Disable Developer Tools in Production Webview Builds

**Use when**

When configuring production builds that utilize webview interfaces to ensure developer inspection tools and context menus are disabled.

**Secure rules**

**Rule 1: Set the debug parameter to zero when creating production webview instances to disable internal developer tools.**

Ensure that the `debug` parameter passed to `webview_create` is explicitly set to `0` in production builds. This prevents attackers from inspecting internal application state, manipulating the webview context, or executing bound native host APIs interactively.

```c
#ifdef NDEBUG
int debug_mode = 0;
#else
int debug_mode = 1;
#endif

webview_t w = webview_create(debug_mode, NULL);
```

**Rule 2: Regularly update Ollama deployments to the latest official release version**

Keep Ollama deployments updated to the latest official release or Docker image to maintain runtime security and incorporate necessary vulnerability patches.

```bash
# Update Ollama using the official installer on Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Or update a Docker-based deployment:
docker pull ollama/ollama:latest
```
