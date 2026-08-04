# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: runtime environment hardening

## runtime environment hardening

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
