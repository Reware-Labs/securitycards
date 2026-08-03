# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: api contract misuse

## api contract misuse

### Validate Generation Parameters and Role Sequences against Chat Templates

**Use when**

Applying chat templates and configuring tokenization or request parameters for language model inference.

**Secure rules**

**Rule 1: Validate conversation role sequences and avoid supplying conflicting prompt generation flags.**

Ensure that role sequences strictly match generation prompt parameters. Setting `add_generation_prompt=True` requires the last message to be from a non-assistant role, whereas `continue_final_message=True` requires the last message to be from an assistant role. Do not combine both flags simultaneously, and avoid passing unsupported custom `chat_template` or `chat_template_kwargs` arguments.

```python
messages = [{"role": "user", "content": "Hello"}]
tokenizer.apply_chat_template(messages, add_generation_prompt=True)
```
