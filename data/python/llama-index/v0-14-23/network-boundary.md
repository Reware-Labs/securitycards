# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: network boundary

## network boundary

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
