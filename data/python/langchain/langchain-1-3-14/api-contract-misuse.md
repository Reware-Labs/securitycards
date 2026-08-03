# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: api contract misuse

## api contract misuse

### Configure valid parameters and arguments when invoking LangChain APIs

**Use when**

When initializing or configuring LangChain models, text splitters, tool bindings, and middleware components that enforce strict argument types, value ranges, and compatibility requirements.

**Secure rules**

**Rule 1: Validate text splitter chunk size and overlap invariants prior to document processing**

Ensure that `chunk_size` is strictly greater than `0` and that `chunk_overlap` is non-negative and strictly smaller than `chunk_size` when configuring text splitters such as `CharacterTextSplitter`. Violating these invariants raises a `ValueError` at runtime.

```python
from langchain_text_splitters import CharacterTextSplitter

splitter = CharacterTextSplitter(
    separator="\n\n",
    chunk_size=1000,
    chunk_overlap=200
)
```

**Rule 2: Validate streaming parameter compatibility before calling language model generation**

When configuring the `OpenAI` LLM with `streaming=True`, set `best_of` and `n` to `1` and avoid passing multiple prompts to `.generate()` to prevent runtime `ValueError` exceptions.

```python
from langchain_openai import OpenAI

llm = OpenAI(
    model_name="gpt-3.5-turbo-instruct",
    streaming=True,
    n=1,
    best_of=1
)

for chunk in llm.stream("Explain the least privilege principle."):
    print(chunk, end="", flush=True)
```

**Rule 3: Ensure tool names in tool choices correspond directly to supplied tools**

When configuring tool bindings on chat models such as `ChatHuggingFace`, ensure `tool_choice` specifies a valid name and structure matching a tool supplied in the `tools` array to avoid unhandled runtime errors.

```python
from langchain_huggingface import ChatHuggingFace
from langchain_core.tools import tool

@tool
def get_time() -> str:
    """Get current time."""
    return "12:00 PM"

chat_model = ChatHuggingFace(llm=llm)
model_with_tools = chat_model.bind_tools(
    tools=[get_time],
    tool_choice={"type": "function", "function": {"name": "get_time"}}
)
```

**Rule 4: Preserve required structural markers when overriding summarization prompts**

When configuring `SummarizationMiddleware`, maintain the required structural contract including the `<messages>` marker and `{messages}` template placeholder to prevent message formatting failures.

```python
from langchain.agents.middleware.summarization import SummarizationMiddleware

custom_prompt = """Extract key context from the following history.

<messages>
Messages to summarize:
{messages}
</messages>"""

middleware = SummarizationMiddleware(
    model="openai:gpt-4o",
    summary_prompt=custom_prompt,
)
```
