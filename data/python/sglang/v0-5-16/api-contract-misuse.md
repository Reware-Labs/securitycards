# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: api contract misuse

## api contract misuse

### Specify Only One Output Constraint Parameter Per Request

**Use when**

Configuring structured generation requests with constraints such as json_schema, regex, or ebnf.

**Secure rules**

**Rule 1: Provide at most one constraint parameter per structured generation request.**

When configuring structured generation requests, specify a single constraint parameter type per request payload. Combining multiple constraint options in a single request violates the SGLang structured generation contract and can cause request handling failures or grammar compilation errors.

```python
response = client.chat.completions.create(
    model="meta-llama/Meta-Llama-3.1-8B-Instruct",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    extra_body={"regex": "(Paris|London)"}
)
```
