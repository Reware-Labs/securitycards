# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: injection

## injection

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
