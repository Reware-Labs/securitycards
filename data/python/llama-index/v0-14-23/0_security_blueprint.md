# Security blueprint

Repository: `https://github.com/run-llama/llama_index#v0.14.23`

## Security posture

The llama_index repository handles sensitive workflows including data ingestion, external model integrations, database interactions, and tool executions. Developers must assume that user inputs, external documents, and remote tool outputs are untrusted and potentially malicious. Security mechanisms such as authorization checks, prompt input validation, secure credential management, and TLS transport encryption must be explicitly enforced, failing closed when configuration is incomplete.

## Essential implementation rules

1. **Enforce Ownership and Authorization Checks on Storage**

Always verify that the authenticated user or API key has explicit permissions to access a specific collection, index object, or chat storage entry before invoking loading methods or constructing storage keys.

2. **Use Scoped OAuth and Token-Based Credentials**

Authenticate cloud storage, vector stores, and model connections using scoped OAuth service accounts, managed identities, or token credentials like `DefaultAzureCredential` instead of static keys.

3. **Validate and Sanitize Inputs and Outputs**

Invoke input scanners before query processing and inspect model responses using output scanners or server-side guardrail identifiers to prevent untrusted content and prompt injections.

4. **Disable Remote Code Execution on Model Loaders**

Set `trust_remote_code=False` when configuring model initializers to prevent arbitrary code execution from untrusted model repositories.

5. **Constrain Local File Paths to Safe Directories**

Resolve local file paths using `pathlib.Path.resolve()` and verify that the target path remains within an authorized base directory before performing read or write operations.

6. **Prevent SQL Injection Using Parameterized Queries and Structured Filters**

Avoid manual string concatenation or f-strings for SQL queries, table names, and schema parameters. Use static queries, structured parameter bindings, and structured `MetadataFilter` objects.

7. **Set Formatted to True for Prompts with Curly Braces**

Explicitly set `formatted=True` when invoking completion methods with prompt text containing curly braces or user-controlled input to prevent unexpected Python string formatting vulnerabilities.

8. **Enforce TLS Verification and Secure Endpoints**

Maintain TLS certificate validation by explicitly setting `verify=True`, using secure HTTPS endpoints, and ensuring `use_ssl=True` is configured for all external client integrations.

9. **Prevent Model Provider Data Exposure**

Sanitize retrieved document nodes using postprocessors to strip personally identifiable information before transmitting context to external model providers, or use in-database embedding models.

10. **Enforce Size Limits on User Input**

Implement explicit input size checks and restrict raw text length before invocation to mitigate potential high computational load or denial of service.

11. **Enable Production Security Features on Vector Stores**

Enable authentication and SSL/TLS transport encryption on production database and vector store instances such as Elasticsearch rather than disabling them.

12. **Configure Cloud Mode and Secure Token Storage**

Set `is_cloud=True` when initializing tool specifications in shared or serverless environments to prevent persisting sensitive OAuth tokens to unmanaged local JSON files, and provide secure persistent token storage implementations.

13. **Avoid Hardcoding API Keys and Environment Mutation**

Do not embed secret credentials directly into source code. Fetch sensitive values dynamically from environment variables and pass session-specific API keys directly to client constructors.

14. **Isolate Tenant Sessions Using Unique Identifiers**

Specify unique session identifiers and thread IDs when instantiating chat memory or executing tools to prevent cross-tenant state pollution and data leakage.
