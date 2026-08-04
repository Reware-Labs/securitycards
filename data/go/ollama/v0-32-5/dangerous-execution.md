# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: dangerous execution

## dangerous execution

### Disable agent shell tool execution in restricted environments

**Use when**

Running Ollama agent sessions in environments where local shell command execution by the model is unsafe or unmonitored.

**Secure rules**

**Rule 1: Set OLLAMA_AGENT_DISABLE_SHELL to restrict the agent runtime from registering and executing shell execution tools.**

Export `OLLAMA_AGENT_DISABLE_SHELL=1` before launching Ollama agent sessions to prevent the model from executing local shell commands.

```bash
export OLLAMA_AGENT_DISABLE_SHELL=1
ollama
```
