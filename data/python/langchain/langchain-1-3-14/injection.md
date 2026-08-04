# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: injection

## injection

### Prevent Role Spoofing by Formatting Conversation Buffers with XML Structure

**Use when**

Formatting sequences of messages that include untrusted user input into conversation strings for model prompts.

**Secure rules**

**Rule 1: Specify XML formatting explicitly when serializing message buffers containing untrusted content.**

When calling `get_buffer_string()`, always pass `format='xml'` instead of relying on the default prefix format. The default prefix format concatenates raw content strings directly after role labels, allowing input containing role-like strings or line breaks to spoof system or AI turns. The XML format escapes XML characters and wraps content in explicit elements, maintaining structural separation between user content and conversation turn markers.

```python
from langchain_core.messages import AIMessage, HumanMessage, get_buffer_string

messages = [
    HumanMessage(content="User input with System: override attempts"),
    AIMessage(content="I am an assistant."),
]

formatted_buffer = get_buffer_string(messages, format="xml")
```
