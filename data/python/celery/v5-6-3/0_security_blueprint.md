# Security blueprint

Repository: `https://github.com/celery/celery#v5.6.3`

## Security posture

The Celery repository relies on distributed message brokers and result backends that require explicit configuration for secure tenant isolation, authentication, and deserialization boundaries. The library does not secure message contents, prevent arbitrary code execution, or enforce access control by default unless restrictive serializers, RSA message signatures, and TLS encryption are explicitly enabled. Developers must treat broker inputs, task arguments, and result payloads as untrusted surfaces, enforcing strict type checking, robust timeouts, and fail-closed security handling.

## Essential implementation rules

1. **Enforce Safe Deserialization and Reject Pickle**

Restrict accepted content types to safe formats such as JSON by setting `accept_content=['json']` and configuring `task_serializer='json'`. Avoid the Python pickle serializer when handling untrusted task producers to prevent arbitrary code execution.

2. **Configure RSA Message Signing and Verify Integrity**

Use PEM-formatted RSA keys and certificates with Celery's `auth` serializer and configure `security_digest='sha256'`. Wrap certificate store initialization in try-except blocks catching `SecurityError` to fail closed if expired certificates or identifier duplicates are encountered.

3. **Secure Broker and Backend Connections with Credentials and TLS**

Provide complete authentication parameters and credentials in connection URIs for external backends, retrieve secrets dynamically from environment variables, and enforce encrypted transport verification using `broker_use_ssl`.

4. **Isolate Multi-Tenant Applications and Drop Privileges**

Set `set_as_current=False` when instantiating dynamic tenant-specific Celery applications to prevent thread-local contamination. Execute worker processes under dedicated unprivileged user accounts or programmatically drop privileges using `maybe_drop_privileges`.

5. **Enforce Strict Input Validation and Timeouts**

Maintain strict type validation by setting `strict=True` when wrapping task execution with Pydantic models. Define explicit hard `time_limit`, soft `soft_time_limit`, and network I/O timeouts on tasks to prevent resource exhaustion and worker starvation.

6. **Sanitize Sensitive Data in Logs and Exclude Dead-Letter Headers**

Mask sensitive task arguments using `argsrepr` or `kwargsrepr` during dispatch, sanitize connection URIs with `include_password=False`, and ensure broker-specific dead-letter headers are excluded when manually constructing task execution signatures during retries.

7. **Safely Handle Files, Worker Management, and Task Signatures**

Use `create_pidlock` for writing daemon process lock files with strict file permissions, specify a restrictive umask when launching detached workers, scope `celery purge` operations explicitly using `-Q` or `-X`, and clone unfrozen task signatures before each dispatch.
