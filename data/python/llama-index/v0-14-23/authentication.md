# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: authentication

## authentication

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
