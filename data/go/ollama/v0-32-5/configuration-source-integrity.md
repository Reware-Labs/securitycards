# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: configuration source integrity

## configuration source integrity

### Enforce Strict Loopback Restrictions and Secure Provenance for Ollama Configuration Sources

**Use when**

When configuring base URLs, environment variables, model tokenizer files, or integration settings for Ollama to prevent untrusted or ambiguous sources from altering security behavior.

**Secure rules**

**Rule 1: Restrict cloud base URL overrides to secure loopback enclaves in production modes.**

When configuring `OLLAMA_CLOUD_BASE_URL`, ensure the URL uses HTTPS and contains no path, query, fragment, or user credentials to prevent unauthorized redirection of proxied cloud requests.

```bash
export OLLAMA_CLOUD_BASE_URL="https://localhost:8443"
```

**Rule 2: Verify tokenizer and model configuration files before import and conversion.**

Verify the checksums and origin of all model configuration files such as `tokenizer.json`, `tokenizer_config.json`, and `generation_config.json` prior to parsing to prevent prompt injection or context misalignment.

```go
func convertModelSafely(modelDir string) (*Tokenizer, error) {
    if err := verifyFileHashes(modelDir); err != nil {
        return nil, fmt.Errorf("untrusted model files: %w", err)
    }
    return parseTokenizer(os.DirFS(modelDir), []string{"bos", "eos"})
}
```

**Rule 3: Control configuration directory environment variables to prevent path hijacking.**

Applications invoking agent configuration logic must validate or explicitly override environment variables such as `PI_CODING_AGENT_DIR` and `PI_CONFIG_DIR` to prevent file redirection and tampering.

```go
t.Setenv("PI_CODING_AGENT_DIR", filepath.Join(trustedDir, "agent"))
t.Setenv("PI_CONFIG_DIR", "")

o := &OMP{}
if err := o.ConfigureWithModels("new-model", models); err != nil {
    log.Fatalf("Configuration failed: %v", err)
}
```
