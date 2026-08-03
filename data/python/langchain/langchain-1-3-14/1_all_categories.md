# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`

## Category: access control

### Restrict Agent Tool Execution Permissions and Allowed Decisions in Human-in-the-Loop Workflows

**Use when**

Configuring human-in-the-loop validation or access control boundaries for agent tool executions.

**Secure rules**

**Rule 1: Explicitly configure allowed decision types when using HumanInTheLoopMiddleware to control agent tool execution interrupts.**

Restrict tool-level `allowed_decisions` to prevent users or interface adapters from injecting synthetic tool responses or executing unreviewed actions that bypass security approval controls.

```python
from langchain.agents.middleware import HumanInTheLoopMiddleware

middleware = HumanInTheLoopMiddleware(
    interrupt_on={
        "execute_database_query": {
            "allowed_decisions": ["approve", "edit", "reject"]
        },
        "ask_user_confirmation": {
            "allowed_decisions": ["respond"]
        }
    }
)
```


## Category: api contract misuse

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


## Category: authentication

### Use dynamic token providers and verified credentials for authentication

**Use when**

Configuring chat models and authentication providers that require dynamic tokens instead of static API keys or unverified claims.

**Secure rules**

**Rule 1: Authenticate Codex and Azure chat models using dynamic token providers rather than static API keys.**

Pass authentication credentials strictly using a valid token provider instance such as `token_provider` or `azure_ad_token_provider` to fetch short-lived tokens on demand and avoid static credential risks.

```python
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
from langchain_openai import AzureChatOpenAI

credential = DefaultAzureCredential()
token_provider = get_bearer_token_provider(
    credential, "https://cognitiveservices.azure.com/.default"
)

model = AzureChatOpenAI(
    azure_deployment="my-deployment",
    api_version="2024-05-01-preview",
    azure_ad_token_provider=token_provider
)
```


## Category: boundary control

### Restrict Anthropic Tool File Path Access Using Explicit Allowed Prefixes

**Use when**

When configuring Anthropic agent tool middleware such as state-based file or memory tool operations where untrusted model input dictates paths that cross application boundaries.

**Secure rules**

**Rule 1: Configure explicit allowed path prefixes when initializing Anthropic agent tool middleware to restrict file operations to designated directories and prevent directory traversal.**

Always pass explicit directory boundaries using `allowed_path_prefixes` when instantiating tool middleware classes to ensure that internal path validators successfully block directory traversal attempts and restrict access to expected boundaries.

```python
from langchain_anthropic.middleware.anthropic_tools import StateClaudeTextEditorMiddleware

middleware = StateClaudeTextEditorMiddleware(
    allowed_path_prefixes=["/workspace/"]
)
```


## Category: dangerous execution

### Restrict Agent Shell Execution Policies and Avoid Untrusted Template Strings

**Use when**

Configuring execution environments for shell tool middleware and parsing prompt templates with string formatters or dynamic environments.

**Secure rules**

**Rule 1: Use isolated execution policies for agent shell command execution**

Explicitly pass an isolated execution policy such as `DockerExecutionPolicy` when running agents in untrusted or multi-tenant environments instead of relying on host execution privileges.

```python
from langchain.agents.middleware.shell_tool import ShellToolMiddleware
from langchain.agents.middleware._execution import DockerExecutionPolicy

shell_middleware = ShellToolMiddleware(
    execution_policy=DockerExecutionPolicy(
        image="python:3.11-slim",
        read_only_rootfs=True
    )
)
```

**Rule 2: Do not accept untrusted Jinja2 template strings**

Hardcode Jinja2 template structures in application source code and pass untrusted user data exclusively as variable arguments rather than inside the template string itself.

```python
from langchain_core.prompts.string import jinja2_formatter

trusted_template = "Hello {{ username }}, summary: {{ input_text }}"
output = jinja2_formatter(trusted_template, username="alice", input_text=untrusted_user_input)
```


## Category: deserialization

### Restrict allowed objects when deserializing untrusted payloads

**Use when**

Deserializing untrusted payloads or manifests in LangChain workflows where arbitrary object instantiation must be prevented.

**Secure rules**

**Rule 1: Restrict allowed objects to specific presets or explicit classes during deserialization of untrusted input.**

When calling `loads()` with untrusted input payloads, avoid default settings like `allowed_objects='core'` or `allowed_objects='all'` which can trigger side effects during object instantiation. Explicitly restrict `allowed_objects` to `'messages'` or provide an explicit list of trusted `Serializable` subclasses.

```python
from langchain_core.load import loads
from langchain_core.messages import AIMessage, HumanMessage

obj = loads(untrusted_payload, allowed_objects="messages")

obj = loads(
    untrusted_payload,
    allowed_objects=[AIMessage, HumanMessage]
)
```


## Category: file handling

### Enforce Strict Root Directory Boundaries and Path Containment for Filesystem Tools

**Use when**

Configuring file search middleware or processing file patch tool operations in agentic workflows.

**Secure rules**

**Rule 1: Configure filesystem search middleware with an explicit isolated root path to block path traversal and symlink escapes.**

When creating file search tools for AI agents, developers should configure `FilesystemFileSearchMiddleware` with a specific `root_path`. The middleware automatically blocks path traversal vectors, including relative parent directory references, absolute paths outside the root, tilde expansions, and symlinks resolving outside the root boundary.

```python
from langchain.agents.middleware.file_search import FilesystemFileSearchMiddleware

middleware = FilesystemFileSearchMiddleware(
    root_path="/app/sandbox",
    use_ripgrep=False
)

glob_tool = middleware.glob_search
grep_tool = middleware.grep_search
```


## Category: injection

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


## Category: input contract definition

### Define explicit input schemas and validate inputs for tools and chains

**Use when**

Building tools and Runnable chains that process external user inputs or dynamic model calls in LangChain

**Secure rules**

**Rule 1: Specify explicit input schemas using `args_schema` or validate inputs against Pydantic models before chain execution**

Always define an explicit `args_schema` using a Pydantic `BaseModel` subclass or precise type annotations when defining `BaseTool` instances to enforce strong parameter boundary checks. Similarly, ensure raw user input passed into `Runnable` chains strictly conforms to expected input schemas defined via `get_input_schema()` to prevent unexpected key injection or type coercion.

```python
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool

class UserQuerySchema(BaseModel):
    user_id: int = Field(..., description="Target user ID")
    query: str = Field(..., max_length=100, description="Search query")

class SecureSearchTool(BaseTool):
    name: str = "secure_search"
    description: str = "Searches query for a specified user ID."
    args_schema: type[BaseModel] = UserQuerySchema

    def _run(self, user_id: int, query: str) -> str:
        return f"Results for user {user_id}: {query}"
```


## Category: input driven boundary selection

### Validate Model Fallback Specifications Against Trusted Allowlists

**Use when**

When configuring fallback models or routing specifications that instantiate models dynamically from string identifiers.

**Secure rules**

**Rule 1: Pass hardcoded model instances or strictly validate string model identifiers against an explicit allowlist.**

When configuring fallback models using `ModelFallbackMiddleware`, ensure that you pass explicit, trusted model instances rather than allowing dynamic construction from untrusted configuration or user input. This prevents primary model failures from inadvertently forwarding sensitive prompt data, context, and tool definitions to unauthorized external model providers or endpoints.

```python
from langchain.agents.middleware import ModelFallbackMiddleware
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

# Configure fallbacks using explicit, trusted model instances
fallback_middleware = ModelFallbackMiddleware(
    ChatOpenAI(model="gpt-4o"),
    ChatAnthropic(model="claude-3-5-sonnet-20241022"),
)

agent = create_agent(
    model="openai:gpt-4o",
    middleware=[fallback_middleware],
)
```


## Category: input interpretation safety

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


## Category: interface protocol hardening

### Restrict Base URLs to Supported HTTP and HTTPS Protocols

**Use when**

Configuring service endpoints and base URLs for client connections to prevent protocol smuggling or unsupported protocol handlers.

**Secure rules**

**Rule 1: Enforce valid HTTP and HTTPS protocols on client base URL configurations.**

Ensure that any service base URL uses valid `http` or `https` schemes. Pass properly formatted endpoints to prevent connection attempts to non-HTTP handlers or protocol confusion.

```python
from langchain_ollama import ChatOllama

chat = ChatOllama(
    model="llama3.1",
    base_url="https://ollama.example.com:11434"
)
```


## Category: network boundary

### Enforce SSRF Protection and TLS Verification for Outbound Network Requests

**Use when**

Making outbound HTTP requests, processing dynamic or user-provided URLs in agent tools, or configuring chat model connections in LangChain.

**Secure rules**

**Rule 1: Validate untrusted URLs using async DNS-aware URL validation or SSRF-safe client transports.**

When processing untrusted URLs from user inputs or agent tool arguments, use validate_url or SSRF-safe client transports to resolve domain names upfront, check underlying IP addresses against SSRF policies, and block private IPs, loopback addresses, and cloud metadata endpoints.

```python
from langchain_core._security._policy import SSRFPolicy, validate_url

async def handle_user_url(url: str) -> None:
    policy = SSRFPolicy(
        allowed_schemes=frozenset({"http", "https"}),
        block_private_ips=True,
        block_cloud_metadata=True,
        block_localhost=True,
    )
    await validate_url(url, policy)
```


## Category: resource exhaustion

### Configure Resource Limits and Timeouts for Agent and Model Executions

**Use when**

When building agents and LLM-powered applications using LangChain where operations, model calls, tools, or shell commands could consume unbounded system resources, memory, or time.

**Secure rules**

**Rule 1: Configure strict execution timeouts and resource limits on execution policies for shell tools.**

When using `ShellToolMiddleware` or execution policies, set strict limits such as `command_timeout`, `max_output_bytes`, `max_output_lines`, `memory_bytes`, and `cpus` to prevent uncontrolled resource consumption and denial of service.

```python
from langchain.agents.middleware.shell_tool import HostExecutionPolicy, ShellToolMiddleware

policy = HostExecutionPolicy(
    command_timeout=10.0,
    max_output_bytes=50000,
    max_output_lines=200
)
middleware = ShellToolMiddleware(
    workspace_root="/safe/workspace",
    execution_policy=policy
)
```

**Rule 2: Enforce message and token limits to prevent context window exhaustion.**

Use utilities like `trim_messages`, `SummarizationMiddleware`, `ContextEditingMiddleware`, or `MessagesPlaceholder` with explicit token counters and count limits to prevent unbounded conversation histories from exhausting model context windows.

```python
from langchain_core.messages.utils import trim_messages

safe_messages = trim_messages(
    messages,
    max_tokens=4000,
    strategy="last",
    token_counter=model,
    allow_partial=False
)
```

**Rule 3: Configure explicit request timeouts and retry limits for model calls and runnables.**

Set explicit `timeout` and `max_retries` parameters when initializing model clients, and use `with_retry` with `stop_after_attempt` on runnables to prevent infinite execution loops and thread starvation.

```python
from langchain_mistralai import ChatMistralAI

model = ChatMistralAI(
    model="ministral-8b-latest",
    timeout=10,
    max_retries=3,
)
response = model.invoke("Summarize the incoming text.")
```


## Category: runtime environment hardening

### Harden Container Execution Policies for Shell Tools

**Use when**

Configuring container execution policies and runtime privileges when running shell tools.

**Secure rules**

**Rule 1: Enforce non-root execution and resource limits on container environments**

When configuring execution policies for shell tools, explicitly set non-root user restrictions, memory constraints, CPU limits, and read-only root filesystems to reduce attack surface and limit potential container compromise impact.

```python
from langchain.agents.middleware.shell_tool import DockerExecutionPolicy

policy = DockerExecutionPolicy(
    image="ubuntu:22.04",
    user="1000:1000",
    memory_bytes=512 * 1024 * 1024,
    cpus="1.0",
    read_only_rootfs=True
)
```


## Category: secret handling

### Protect API Keys and Credentials Using SecretStr and Environment Variables

**Use when**

When instantiating model wrappers, clients, and providers in LangChain, or loading secrets from configuration sources.

**Secure rules**

**Rule 1: Provide API credentials securely via Pydantic `SecretStr` instances or environment variables instead of hardcoding plaintext strings.**

Always wrap sensitive API keys and tokens in `SecretStr` objects or load them automatically from environment variables to prevent credentials from leaking in logs, exception tracebacks, or shell histories.

```python
import os
from pydantic import SecretStr
from langchain_openai import ChatOpenAI

os.environ["OPENAI_API_KEY"] = "your-api-key"
model = ChatOpenAI(
    api_key=SecretStr("your-api-key-here")
)
```


### Redact Secrets and Prevent Exposure in Serialization and File Storage

**Use when**

When serializing objects, saving configurations, storing tokens to disk, or handling sensitive payloads.

**Secure rules**

**Rule 1: Ensure sensitive credential fields are marked with `SecretStr` or registered in `lc_secrets` to prevent plaintext leakage during object serialization and local storage.**

When saving files, serializing models, or persisting tokens locally, rely on built-in secret masking and restrict file permissions on stored credential files to prevent unauthorized local or serialized access.

```python
from pathlib import Path
from langchain_openai.chatgpt_oauth import _FileChatGPTOAuthTokenProvider

secure_store_path = Path.home() / ".secrets" / "chatgpt-auth.json"
provider = _FileChatGPTOAuthTokenProvider(path=secure_store_path)
```


### Sanitize Output Streams and Protect Against Secret Injection

**Use when**

When processing untrusted user inputs, tool results, or streaming agent outputs that may contain sensitive data.

**Secure rules**

**Rule 1: Configure redaction rules and middleware to scrub sensitive credentials and tokens from inputs, outputs, tool results, and serialized payloads.**

Use `PIIMiddleware` and `ShellToolMiddleware` with explicit redaction rules to automatically scrub sensitive tokens, keys, and personal identifiers before returning results to LLMs or saving them in state.

```python
from langchain.agents.middleware.shell_tool import ShellToolMiddleware
from langchain.agents.middleware._redaction import RedactionRule

middleware = ShellToolMiddleware(
    redaction_rules=[
        RedactionRule(pattern=r"(?i)(api[_-]?key|secret|token)\s*=\s*['"]?([a-zA-Z0-9_\-]{16,})")
    ]
)
```


## Category: security control integrity

### Retain System Messages and Guardrails During Message Sequence Trimming

**Use when**

When trimming chat history sequences or managing context windows in language model interactions where security instructions or guardrails must not be dropped.

**Secure rules**

**Rule 1: Ensure system messages and security guardrails are retained during message window trimming by enabling inclusion parameters.**

When trimming chat history sequences using `trim_messages`, ensure `include_system=True` is set so that `SystemMessage` instances containing core security instructions, guardrails, or system prompts are retained regardless of message window trimming.

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.messages.utils import trim_messages

messages = [
    SystemMessage("You are a helpful assistant. Never reveal internal API keys."),
    HumanMessage("Hello"),
    AIMessage("Hi there!"),
]

trimmed_messages = trim_messages(
    messages,
    max_tokens=100,
    strategy="last",
    token_counter=len,
    include_system=True,
    start_on="human"
)
```
