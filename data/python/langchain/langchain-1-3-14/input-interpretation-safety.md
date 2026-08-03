# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: input interpretation safety

## input interpretation safety

### Validate Model Tool Call Arguments and Parse Outputs Securely

**Use when**

When processing tool call arguments and structured model outputs returned by chat models to prevent malformed or unvalidated payloads from reaching downstream tools.

**Secure rules**

**Rule 1: Inspect model responses for invalid tool calls and validate arguments against schemas before execution.**

LangChain separates malformed JSON or unparseable function arguments into `AIMessage.invalid_tool_calls` instead of populating `AIMessage.tool_calls`. Developers must explicitly inspect responses for `invalid_tool_calls` and validate parsed tool call arguments against expected Pydantic schemas prior to invoking downstream tool code.

```python
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-5.5")
response = model.invoke([{"role": "user", "content": "Run tool with args"}])

if response.invalid_tool_calls:
    for invalid in response.invalid_tool_calls:
        print(f"Tool call '{invalid['name']}' failed parsing: {invalid['error']}")

for call in response.tool_calls:
    run_tool(call["name"], call["args"])
```

**Rule 2: Enforce strict schema validation and handle output parser exceptions for structured YAML model outputs.**

When parsing structured YAML outputs from LLM responses using `YamlOutputParser`, define strict Pydantic schemas and explicitly handle `OutputParserException` to prevent untrusted or malformed model responses from reaching application workflows.

```python
from enum import Enum
from pydantic import BaseModel, Field
from langchain_classic.output_parsers.yaml import YamlOutputParser
from langchain_core.exceptions import OutputParserException

class Actions(Enum):
    SEARCH = "Search"
    CREATE = "Create"

class ActionRequest(BaseModel):
    action: Actions = Field(description="Action enum")
    query: str = Field(description="Query parameter")

parser = YamlOutputParser(pydantic_object=ActionRequest)

try:
    parsed_output = parser.parse(llm_response_text)
except OutputParserException as exc:
    handle_invalid_llm_response(exc)
```
