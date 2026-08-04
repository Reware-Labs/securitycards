# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`

## Category: access control

### Enforce Ownership and Authorization Checks on Document and Chat Storage

**Use when**

When building retrieval-augmented generation apps or chat storage workflows that load indexes, vectors, or chat histories based on user-supplied parameters.

**Secure rules**

**Rule 1: Validate user ownership and permissions before loading document indexes or chat storage entries.**

Always verify that the authenticated user or API key has explicit permissions to access a specific collection or index object before invoking loading methods. Similarly, map and validate that session IDs belong to the current user before constructing storage keys for `SQLAlchemyChatStore` operations.

```python
collection = await Collection.objects.aget(id=collection_id, api_key=request_api_key)
index = VectorStoreIndex.load_from_disk(cache_file_path)
```


## Category: authentication

### Configure cloud-native and OAuth token-based authentication for service integrations

**Use when**

Integrating LlamaIndex with cloud services, vector stores, and readers where identity and credentials must be established via tokens, service accounts, or managed identities.

**Secure rules**

**Rule 1: Authenticate cloud storage and retrieval services using scoped OAuth service accounts or managed identities instead of static keys.**

When configuring integrations like Google Semantic Retrieval, prefer initializing `set_google_config` using service account credentials with strictly required scopes rather than relying on default API key sharing.

```python
from google.oauth2 import service_account
from llama_index.vector_stores.google import set_google_config

credentials = service_account.Credentials.from_service_account_file(
    "service_account_key.json",
    scopes=[
        "https://www.googleapis.com/auth/generative-language.retriever",
    ],
)

set_google_config(auth_credentials=credentials)
```

**Rule 2: Use token-based authentication credentials for database and cloud model connections.**

When connecting to cloud databases or model deployments, use token credentials such as `DefaultAzureCredential` or cloud-native instance and resource principals to avoid hardcoding static secrets.

```python
from azure.identity import DefaultAzureCredential
from llama_index.vector_stores.azure_postgres.common import (
    ConnectionInfo,
    SSLMode,
)

conn_info = ConnectionInfo(
    host="my-db.postgres.database.azure.com",
    dbname="postgres",
    port=5432,
    sslmode=SSLMode.require,
    credentials=DefaultAzureCredential(),
)
```


## Category: boundary control

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


## Category: dangerous execution

### Disable Remote Code Execution When Loading Untrusted Models

**Use when**

Configuring model loaders and initializers where custom scripts or remote execution mechanisms might be enabled.

**Secure rules**

**Rule 1: Set trust_remote_code to False to prevent loading arbitrary code from model repositories.**

When configuring model parameters for model initializers like `GaudiLLM`, ensure `trust_remote_code` is set to `False` unless loading from a thoroughly vetted repository. Enabling remote code execution allows custom scripts hosted on repository hubs to run arbitrary code on the host execution environment.

```python
args = AttributeContainer(
    device="hpu",
    model_name_or_path="meta-llama/Meta-Llama-3-8B-Instruct",
    trust_remote_code=False
)

llm = GaudiLLM(
    args=args,
    model_name="meta-llama/Meta-Llama-3-8B-Instruct",
    tokenizer_name="meta-llama/Meta-Llama-3-8B-Instruct"
)
```


## Category: file handling

### Validate Local Target Paths and Constrain File Access

**Use when**

When accepting local file paths or destination paths from user input or remote tools that interact with the local filesystem, code interpreter downloads, or document parsing blocks.

**Secure rules**

**Rule 1: Resolve and constrain local file paths to a designated safe directory before performing read or write operations.**

Always resolve paths using `pathlib.Path.resolve()` and verify that the target path remains within an authorized base directory to prevent path traversal, arbitrary file reads, and file overwrite vulnerabilities.

```python
from pathlib import Path
from llama_index.core.base.llms.types import ChatMessage, DocumentBlock, MessageRole, TextBlock

def create_safe_doc_message(user_supplied_path: str, allowed_dir: Path) -> ChatMessage:
    target_path = Path(user_supplied_path).resolve()
    if not target_path.is_relative_to(allowed_dir.resolve()):
        raise ValueError("Unauthorized file path access attempt.")
    return ChatMessage(
        role=MessageRole.USER,
        blocks=[
            DocumentBlock(path=target_path),
            TextBlock(text="Please analyze this document."),
        ]
    )
```


## Category: injection

### Prevent SQL Injection in Database Readers and Chat Stores

**Use when**

Building database readers, executing queries, or configuring chat stores with dynamic database parameters.

**Secure rules**

**Rule 1: Avoid manual string concatenation or f-strings when constructing SQL queries and schema names.**

Concatenating untrusted user inputs directly into query strings or schema parameters allows attackers to execute arbitrary SQL commands. Always use static queries, structured parameter bindings, or strict allowlists for table names and database identifiers.

```python
from llama_index.core.storage.chat_store.sql import SQLAlchemyChatStore

chat_store = SQLAlchemyChatStore(
    table_name="chat_history",
    async_database_uri="postgresql+asyncpg://user:pass@localhost/db",
    db_schema="app_chat_schema",
)
```


### Sanitize Dynamic Identifiers and Metadata Filters in Vector Stores

**Use when**

Configuring vector store metadata filters, table names, or search configurations in SQL-backed vector stores.

**Secure rules**

**Rule 1: Use structured metadata filters and validate dynamic identifiers against strict allowlists.**

Libraries that interpolate metadata keys or search configurations directly into SQL queries require strict sanitization of those keys. Pass structured `MetadataFilter` objects and validate filter keys and search configurations against a strict allowlist to prevent SQL injection.

```python
from llama_index.core.vector_stores.types import (
    FilterOperator,
    MetadataFilter,
    MetadataFilters,
    VectorStoreQuery,
)
from llama_index.vector_stores.alibabacloud_mysql import AlibabaCloudMySQLVectorStore

filters = MetadataFilters(
    filters=[
        MetadataFilter(key="category", value=user_input, operator=FilterOperator.EQ),
    ],
    condition="and",
)

query = VectorStoreQuery(
    query_embedding=[0.1, 0.2, 0.3],
    filters=filters,
)

result = vector_store.query(query)
```


## Category: input interpretation safety

### Prevent unexpected string formatting vulnerabilities by setting formatted to true

**Use when**

Passing prompt templates or completion strings containing literal curly braces or untrusted user input to LLM completion methods.

**Secure rules**

**Rule 1: Set formatted to true when invoking completion methods with prompt text containing curly braces or user-controlled input.**

By default, prompt strings are formatted using string formatting via `prompt.format(**kwargs)`. Untrusted input or templates containing unescaped braces can cause parsing errors or improper string manipulation. Explicitly set `formatted=True` when passing such prompts to prevent unexpected Python string formatting.

```python
user_input = "Process this JSON object: {\"key\": \"value\"}"
response = llm.complete(user_input, formatted=True)
```


## Category: network boundary

### Enforce TLS Certificate Verification and Secure Endpoints for Network Connections

**Use when**

Configuring LLMs, vector stores, and external data connectors that establish outbound network connections over HTTPS or TLS.

**Secure rules**

**Rule 1: Enable TLS certificate verification and secure transport for all external client integrations.**

Always maintain TLS certificate validation by explicitly setting `verify=True` or providing a valid CA bundle file path, and ensure `use_ssl=True` is configured where supported. Never disable SSL or verification in production to prevent man-in-the-middle attacks.

```python
import os
from llama_index.llms.ibm import WatsonxLLM

watsonx_llm = WatsonxLLM(
    model_id="ibm/granite-4-h-small",
    url=os.getenv("WATSONX_URL"),
    apikey=os.getenv("WATSONX_APIKEY"),
    project_id=os.getenv("WATSONX_PROJECT_ID"),
    verify=True,
)
```

**Rule 2: Validate custom base URLs and restrict endpoints to trusted HTTPS destinations.**

Ensure custom base URLs, API endpoints, and server configurations use secure HTTPS transport and originate strictly from trusted static configurations rather than unvalidated user input to prevent credential leakage.

```python
from llama_index.llms.sambanovasystems import SambaNovaCloud

llm = SambaNovaCloud(
    sambanova_url="https://api.sambanova.ai/v1/chat/completions"
)
```


### Prevent Model Provider Data Exposure via PII Stripping and Local Processing

**Use when**

Developing applications that ingest private documents or user inputs and interact with external LLMs or third-party model providers.

**Secure rules**

**Rule 1: Sanitize retrieved document nodes using postprocessors to strip personally identifiable information before transmitting context to external model providers.**

Use `NERPIINodePostprocessor` or `PIINodePostprocessor` from `llama_index.core.postprocessor` to process retrieved nodes and remove PII before sending context to LLMs. Ensure `service_context` is configured with a locally hosted or trusted LLM during entity extraction if required.

```python
from llama_index.core.postprocessor import NERPIINodePostprocessor

pii_postprocessor = NERPIINodePostprocessor()
sanitized_nodes = pii_postprocessor.postprocess_nodes(nodes)
```

**Rule 2: Use in-database embedding models to process sensitive enterprise data and prevent external data exposure.**

When processing sensitive enterprise data with Oracle AI Vector Search, use in-database ONNX models via `OracleEmbeddings.load_onnx_model` instead of external third-party providers like HuggingFace or OCI to keep text data within the internal database boundary.

```python
from llama_index.embeddings.oracleai import OracleEmbeddings

OracleEmbeddings.load_onnx_model(
    conn=conn,
    dir="DEMO_PY_DIR",
    onnx_file="tinybert.onnx",
    model_name="demo_model"
)
```


## Category: resource exhaustion

### Enforce Size Limits on User Input Before Processing

**Use when**

Handling raw user-supplied strings or inputs before submitting them to ingestion pipelines or query components.

**Secure rules**

**Rule 1: Validate payload sizes and string lengths before calling LlamaIndex query or ingestion components.**

Implement explicit input size checks in hosting applications to restrict raw text length before invocation, mitigating potential high computational load or Denial of Service.

```python
MAX_INPUT_LENGTH = 4096

def process_user_text(raw_text: str, query_engine):
    if len(raw_text) > MAX_INPUT_LENGTH:
        raise ValueError(f"Input size exceeds maximum threshold of {MAX_INPUT_LENGTH} characters")

    return query_engine.query(raw_text)
```


## Category: runtime environment hardening

### Enable production security features when deploying Elasticsearch vector stores

**Use when**

Configuring Elasticsearch vector store backends in production environments for LlamaIndex applications.

**Secure rules**

**Rule 1: Enable authentication and SSL/TLS transport encryption on production Elasticsearch vector store instances.**

When instantiating `ElasticsearchStore`, ensure that security features and TLS are enabled rather than disabled. Pass proper credentials and secure endpoints such as `es_user`, `es_password`, and an `es_url` utilizing `https` to prevent unauthenticated access or sniffing.

```python
import os
from llama_index.vector_stores.elasticsearch import ElasticsearchStore

vector_store = ElasticsearchStore(
    index_name="llm-project",
    es_url="https://elasticsearch.internal:9200",
    es_user=os.getenv("ES_USER"),
    es_password=os.getenv("ES_PASSWORD"),
)
```


## Category: secret handling

### Configure Cloud Mode and Persistent Storage for OAuth Tokens

**Use when**

Instantiating cloud tools and readers that acquire and store OAuth access and refresh tokens.

**Secure rules**

**Rule 1: Enable cloud configuration parameters to prevent persisting OAuth tokens to local disk.**

When running in shared, serverless, or cloud container environments, explicitly set `is_cloud=True` when initializing tool specifications or readers to prevent sensitive user tokens from being written to unmanaged local JSON files.

```python
from llama_index.tools.google import GoogleCalendarToolSpec

tool_spec = GoogleCalendarToolSpec(
    service_account_key=service_account_info_dict,
    is_cloud=True
)
```

**Rule 2: Provide secure persistent token storage for client OAuth authentication.**

Avoid relying on default in-memory token storage that loses credentials or increases exposure in process dumps. Provide a secure, persistent implementation when configuring clients requiring OAuth token management.

```python
from llama_index.tools.mcp import BasicMCPClient

client = BasicMCPClient.with_oauth(
    command_or_url="https://mcp.example.com/sse",
    client_name="my_app",
    redirect_uris=["https://app.example.com/callback"],
    redirect_handler=my_redirect_fn,
    callback_handler=my_callback_fn,
    token_storage=MySecureEncryptedTokenStorage()
)
```


### Prevent Hardcoded API Keys and Credentials in Source Files

**Use when**

Configuring LLMs, vector stores, readers, tools, and data connectors with third-party service credentials or database passwords.

**Secure rules**

**Rule 1: Avoid hardcoding API keys, passwords, and tokens in source code or notebooks.**

Do not embed secret credentials or plaintext keys directly into Python scripts, configuration parameters, or Jupyter notebooks. Always fetch sensitive values dynamically from environment variables or secure secret managers.

```python
import os
from llama_index.llms.openai import OpenAI

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is missing")

llm = OpenAI(api_key=openai_api_key)
```

**Rule 2: Pass session-specific API keys directly to client constructors instead of mutating global environment state.**

When handling user-provided credentials in web or multi-tenant applications, pass the API key directly to the provider client constructor rather than writing it to global process variables via `os.environ` to prevent credential leaks across threads or sessions.

```python
from llama_index.llms.openai import OpenAI

def get_llm(llm_name, model_temperature, api_key, max_tokens=256):
    return OpenAI(
        api_key=api_key,
        temperature=model_temperature,
        model=llm_name,
        max_tokens=max_tokens,
    )
```


## Category: session management

### Use Unique Session Identifiers for Tenant Isolation

**Use when**

Developing multi-tenant applications using LlamaIndex chat memory or tool specifications where distinct user sessions must be isolated.

**Secure rules**

**Rule 1: Specify unique session identifiers when instantiating chat memory or executing tools to prevent cross-tenant state pollution and data leakage.**

Always pass a fresh UUID or securely generated user-session-bound identifier when calling `Memory.from_defaults()` or when providing `thread_id` parameters to tool specifications. Relying on default or hardcoded session identifiers causes chat history and session context to be shared across distinct users.

```python
import uuid
from llama_index.core.memory.memory import Memory

def create_user_memory(user_session_id: str) -> Memory:
    return Memory.from_defaults(
        session_id=user_session_id,
        async_database_uri="sqlite+aiosqlite:///:memory:"
    )
```
