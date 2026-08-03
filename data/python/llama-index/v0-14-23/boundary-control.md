# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: boundary control

## boundary control

### Validate and Scan Inputs and Outputs in Custom Query Pipelines

**Use when**

Integrating guardrails, scanners, or server-side safety filters to validate user prompts and inspect LLM outputs when processing queries in multimodal RAG applications.

**Secure rules**

**Rule 1: Validate and sanitize user prompts using input scanners before query processing and inspect responses using output scanners prior to final output presentation.**

Invoke input and output guardrails within custom query pipelines to prevent untrusted content, prompt injections, or unsafe model outputs from compromising system reliability or end users. Ensure validation happens before query processing and check model responses before returning context-aware data.

```python
def execute_guarded_query(query_str, query_engine, input_scanner, output_scanner):
    sanitized_prompt, is_valid, _ = input_scanner.scan(query_str)
    if not is_valid:
        raise ValueError("Query rejected by input guardrail")

    response = query_engine.query(sanitized_prompt)
    sanitized_response, is_output_valid, _ = output_scanner.scan(str(response))
    if not is_output_valid:
        raise ValueError("Response rejected by output guardrail")

    return sanitized_response
```

**Rule 2: Configure server-side guardrail identifiers and versions when instantiating model integration clients.**

Utilize server-side safety filters, prompt injection preventions, and content moderation policies by setting `guardrail_identifier` and `guardrail_version` parameters directly when instantiating model clients such as `BedrockConverse`.

```python
llm = BedrockConverse(
    model="anthropic.claude-3-haiku-20240307-v1:0",
    guardrail_identifier="gr-1234567890",
    guardrail_version="1",
    region_name="us-east-1",
)
```
