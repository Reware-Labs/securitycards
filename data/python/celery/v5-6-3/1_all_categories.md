# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`

## Category: access control

### Restrict Access to Destructive Worker Management Commands

**Use when**

When operators manage Celery workers, monitor task queues, or execute administrative commands like `celery purge` and `celery shell`.

**Secure rules**

**Rule 1: Scope Celery purge operations to the intended queues**

Because `celery purge` permanently deletes queued messages and cannot be undone, specify the queues to purge with `-Q` or protect queues from purging with `-X` instead of unintentionally purging every configured task queue.

```bash
celery -A proj purge -Q specific_queue
celery -A proj purge -X sensitive_queue
```


## Category: api contract misuse

### Avoid Re-executing Frozen Task Signatures Multiple Times

**Use when**

Developing workflows that construct, freeze, and asynchronously execute Celery signature instances.

**Secure rules**

**Rule 1: Clone an unfrozen task signature before each frozen dispatch**

Do not dispatch the same `Signature` more than once after calling `.freeze()`, because each dispatch will use the same task ID. When multiple independently tracked executions are required, create a separate clone from an unfrozen base signature, then freeze and dispatch each clone once.

```python
base_sig = my_task.s(arg1)

exec1_sig = base_sig.clone()
exec1_sig.freeze()
res1 = exec1_sig.apply_async()

exec2_sig = base_sig.clone()
exec2_sig.freeze()
res2 = exec2_sig.apply_async()
```


## Category: authentication

### Configure Explicit Credentials and Authentication Parameters for Result Backends and Brokers

**Use when**

Setting up Celery connection URIs or transport options with external database and cache backends requiring authentication.

**Secure rules**

**Rule 1: Provide complete credentials and authentication parameters in connection URIs for external result backends and brokers.**

Ensure that usernames, passwords, and explicit parameters like `authMechanism` and `authSource` are fully supplied when configuring backends such as MongoDB, Redis, Cassandra, or Elasticsearch to prevent unauthenticated access or client initialization failures.

```python
app.conf.result_backend = 'mongodb://user:password@example.com:27017/?authSource=the_database&authMechanism=SCRAM-SHA-256'
```


## Category: boundary control

### Disable set_as_current for tenant-specific Celery application instances

**Use when**

Instantiating dynamic, per-tenant Celery app instances to segregate broker URLs, virtual hosts, or result backends in multi-threaded environments.

**Secure rules**

**Rule 1: Disable implicit current-app changes for dynamically created Celery applications**

When dynamically creating multiple Celery application instances, set `set_as_current=False` so construction does not replace the current application for the executing thread. Keep and use the returned application instance explicitly rather than relying on Celery’s implicit `current_app` selection.

```python
from celery import Celery

def create_app(name: str, broker_url: str) -> Celery:
    return Celery(
        main=name,
        broker=broker_url,
        set_as_current=False,
    )
```


## Category: cryptography

### Configure RSA Message Signing and Verify Task Integrity

**Use when**

Configuring Celery message serialization, task signing, and public-key signature verification using RSA certificates and private keys.

**Secure rules**

**Rule 1: Use PEM-formatted RSA certificates and private keys for cryptographic message verification and signing.**

Ensure that private keys and certificates supplied to `celery.security.key.PrivateKey` and `celery.security.certificate.Certificate` are valid, uncorrupted RSA keys in PEM format. Non-RSA keys or unsupported formats will cause initialization to fail or raise errors.

```python
from celery.security.key import PrivateKey

with open('/path/to/private_key.pem', 'rb') as f:
    pem_data = f.read()

private_key = PrivateKey(pem_data, password=b'key_passphrase')
```

**Rule 2: Configure the SHA-256 digest for signed Celery messages**

When using Celery's `auth` serializer for message signing, configure `security_digest` as `sha256`. Use the public configuration setting rather than calling the internal `get_digest_algorithm()` utility directly.

```python
from celery import Celery

app = Celery()
app.conf.update(
    security_key="/etc/ssl/private/worker.key",
    security_certificate="/etc/ssl/certs/worker.pem",
    security_cert_store="/etc/ssl/certs/*.pem",
    security_digest="sha256",
    task_serializer="auth",
    event_serializer="auth",
    accept_content=["auth"],
)
app.setup_security()
```


## Category: dangerous execution

### Avoid dynamic function invocation and arbitrary callable execution from task arguments

**Use when**

Defining Celery tasks and handling incoming task message payloads that could otherwise lead to arbitrary code execution if dynamic callables are evaluated.

**Secure rules**

**Rule 1: Accept only safe serialization formats for task messages**

Avoid the pickle serializer when task producers may be untrusted or unauthenticated, because it can deserialize executable Python objects, including functions. Use JSON for task arguments and restrict workers to accepting JSON-serialized messages.

```python
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
)
```


## Category: deserialization

### Restrict Accepted Serializers and Content Types to Safe Formats

**Use when**

Configuring Celery workers, custom message consumers, and client applications to deserialize task messages and results securely.

**Secure rules**

**Rule 1: Restrict accepted content types to safe formats such as JSON and avoid untrusted message payloads using Python pickle.**

Configure Celery to explicitly require and accept only safe serialization formats by setting `accept_content` and task serializers to secure formats like `json`. Avoid using `application/x-python-serialize` or allowing unvalidated formats.

```python
app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json']
)
```

**Rule 2: Explicitly restrict accepted content types when defining custom message consumers.**

When instantiating `Consumer` objects inside custom consumer bootsteps, use the `accept` parameter to restrict message serialization to safe formats such as `json` and prevent processing of arbitrary or dangerous payloads.

```python
from celery import bootsteps
from kombu import Consumer, Exchange, Queue

my_queue = Queue('custom', Exchange('custom'), 'routing_key')

class MyConsumerStep(bootsteps.ConsumerStep):
    def get_consumers(self, channel):
        return [Consumer(channel,
                         queues=[my_queue],
                         callbacks=[self.handle_message],
                         accept=['json'])]

    def handle_message(self, body, message):
        message.ack()
```


## Category: file handling

### Use create_pidlock and restrictive umask settings for safe file creation and permissions

**Use when**

Writing daemon process lock files or launching detached background Celery worker processes.

**Secure rules**

**Rule 1: Utilize create_pidlock or Pidfile objects when writing daemon process lock files.**

Use `create_pidlock` or `Pidfile` objects rather than implementing custom file writing logic. The `Pidfile` class uses strict file creation flags (`O_CREAT | O_EXCL`) and explicit mode permissions to prevent race conditions and symlink exploitation.

```python
from celery.platforms import create_pidlock

pidlock = create_pidlock('/var/run/celery/worker.pid')
```

**Rule 2: Specify a restrictive umask when launching detached Celery worker processes.**

Explicitly specify a restrictive umask such as `--umask=022` or integer `18` when launching detached or background Celery worker processes to prevent worker tasks from creating world-writable files and directories.

```bash
celery -A my_app worker --detach --umask=022
```


## Category: input contract definition

### Enforce Strict Type Validation on Celery Task Parameters

**Use when**

Defining and validating input parameters received from broker messages using Pydantic models in Celery tasks.

**Secure rules**

**Rule 1: Maintain strict type validation when wrapping task execution with Pydantic models.**

When using `pydantic_wrapper` to validate Celery task parameters, ensure `strict=True` is explicitly set. This prevents implicit type coercion during deserialization and ensures that unexpected input types from broker messages are rejected before application processing.

```python
from celery.app.base import pydantic_wrapper
from pydantic import BaseModel

class UserPayload(BaseModel):
    user_id: int
    action: str

def my_task_func(payload: UserPayload):
    return payload.user_id

wrapped_task = pydantic_wrapper(
    app=app,
    task_fun=my_task_func,
    task_name='tasks.my_task',
    strict=True
)
```


## Category: interface protocol hardening

### Exclude Broker Dead-Letter Headers When Re-publishing Task Messages

**Use when**

When converting task request contexts into task signatures during retries or manually forwarding message headers.

**Secure rules**

**Rule 1: Ensure broker-specific dead-letter headers are excluded when manually constructing task execution signatures from raw message contexts.**

When converting task request contexts into task signatures during retries, Celery automatically strips broker dead-letter headers such as `x-death`, `x-first-death-*`, and `x-last-death-*`. Developers must ensure broker-specific death headers are excluded when manually forwarding headers to prevent routing conflicts and unexpected messaging transport behavior.

```python
@app.task(bind=True)
def safe_retry_task(self):
    try:
        do_work()
    except Exception as exc:
        sig = self.signature_from_request()
        raise self.retry(exc=exc)
```


## Category: network boundary

### Configure SSL and HTTPS for Message Broker and Backend Connections

**Use when**

Configuring transport and result backend connections in Celery across network boundaries to prevent interception and unauthorized access.

**Secure rules**

**Rule 1: Enforce SSL encryption and certificate verification for message broker communications.**

Isolate the message broker from untrusted network access using network firewalls, enable broker access control lists, and encrypt broker communication by configuring `broker_use_ssl` with required certificate verification.

```python
import ssl

app.conf.update(
    broker_use_ssl={
        'keyfile': '/etc/ssl/private/client.key',
        'certfile': '/etc/ssl/certs/client.pem',
        'ca_certs': '/etc/ssl/certs/ca.pem',
        'cert_reqs': ssl.CERT_REQUIRED
    }
)
```


## Category: resource exhaustion

### Configure Timeouts, Memory Safeguards, and Result Limits to Prevent Resource Exhaustion

**Use when**

When defining tasks, configuring workers, and handling long-running or unbounded operations in Celery applications.

**Secure rules**

**Rule 1: Set explicit execution time limits on tasks and task signatures.**

Define explicit hard `time_limit` and soft `soft_time_limit` attributes on task definitions or when invoking tasks via `apply_async` to enforce execution boundaries and prevent worker starvation.

```python
from celery import Task

class TimeBoundedTask(Task):
    soft_time_limit = 60
    time_limit = 120

my_task.apply_async(args=[payload], time_limit=120, soft_time_limit=60)
```

**Rule 2: Configure worker resource limits and task retention policies.**

Prevent memory and queue exhaustion by configuring `worker_eta_task_limit`, `worker_max_memory_per_child`, and `worker_max_tasks_per_child`, and bound result retention globally using `result_expires` while ignoring unneeded results with `ignore_result=True`.

```python
@app.task(ignore_result=True)
def process_log_entry(data):
    pass

app.conf.update(
    worker_eta_task_limit=10000,
    worker_max_memory_per_child=200000,
    worker_max_tasks_per_child=1000,
    result_expires=3600,
)
```

**Rule 3: Configure explicit I/O network timeouts inside tasks.**

Always configure explicit connection and read timeouts on external network requests and I/O operations performed inside Celery tasks to prevent tasks from hanging indefinitely and exhausting worker pool capacity.

```python
import requests

@app.task
def fetch_remote_resource(url):
    connect_timeout, read_timeout = 5.0, 30.0
    response = requests.get(url, timeout=(connect_timeout, read_timeout))
    return response.status_code
```


## Category: runtime environment hardening

### Run Celery worker processes under unprivileged user accounts and sandboxed environments

**Use when**

Configuring production runtime environments and process privileges for Celery background workers to minimize attack surface and prevent host compromise.

**Secure rules**

**Rule 1: Execute Celery worker services under dedicated, unprivileged operating system users rather than the root user account.**

Configure process managers or container entrypoints to execute background tasks under a non-root user. This ensures that a compromised task or deserialization vulnerability does not result in full administrative access to the host operating system.

```ini
[program:celery]
command=celery -A myproj worker --loglevel=INFO
user=celeryworker
```

**Rule 2: Drop root privileges programmatically using maybe_drop_privileges before initializing worker tasks.**

Use `celery.platforms.maybe_drop_privileges` to relinquish root privileges to an unprivileged user and group prior to running worker loops. Catch `SecurityError` to refuse execution if the privilege transition fails.

```python
from celery.platforms import maybe_drop_privileges
from celery.exceptions import SecurityError

try:
    maybe_drop_privileges(uid='celery', gid='celery')
except SecurityError as err:
    raise SystemExit(f"Refusing to run process with elevated privileges: {err}")
```


## Category: secret handling

### Load Broker and Backend Credentials Securely from Environment Variables

**Use when**

Configuring Celery message brokers, database result backends, or cloud storage connections.

**Secure rules**

**Rule 1: Avoid hardcoding default credentials or embedded connection URIs in project settings.**

Retrieve connection strings and keys dynamically from environment variables or secure secret managers rather than hardcoding them into source code or configuration files.

```python
import os

CELERY_BROKER_URL = os.environ['CELERY_BROKER_URL']
SECRET_KEY = os.environ['DJANGO_SECRET_KEY']
```

**Rule 2: Use external credential resolution for the S3 result backend**

When credentials are provided through the boto3 credential resolver, leave `s3_access_key_id` and `s3_secret_access_key` unset instead of storing credentials in Celery configuration. Configure only the S3 backend properties Celery requires; startup fails if no credentials can be resolved.

```python
app.conf.update(
    result_backend="s3://",
    s3_bucket="my-celery-results-bucket",
    s3_region="us-east-1",
)
```


### Redact Sensitive Arguments and Sanitize URIs in Logs

**Use when**

Dispatching tasks containing sensitive information or inspecting and logging connection URIs and configuration states.

**Secure rules**

**Rule 1: Mask sensitive task arguments when dispatching tasks to prevent clear-text logging.**

Override argument representations using `argsrepr` or `kwargsrepr` when invoking tasks with sensitive data to prevent plain-text secrets from being recorded in worker logs and monitoring events.

```python
process_payment.s(account_id, card_token='secret-token').set(
    kwargsrepr=repr({'card_token': '****-****-****'})
).delay()
```

**Rule 2: Prevent sensitive credentials from leaking when rendering backend connection URIs.**

Pass `include_password=False` when calling `.as_uri()` on result backends to sanitize connection strings and redact passwords from logs and diagnostic outputs.

```python
backend = app.backends['cassandra']
safe_uri = backend.as_uri(include_password=False)
```


## Category: security control integrity

### Fail Closed During Certificate Store Initialization

**Use when**

When initializing certificate stores and loading security credentials for message signing or verification in Celery.

**Secure rules**

**Rule 1: Fail closed and halt initialization when certificate expiration or duplicate certificate identifiers are encountered.**

Wrap certificate store initialization in a try-except block catching `SecurityError`, ensuring that expired certificates or overlapping identifier combinations prevent startup rather than bypassing security control requirements.

```python
from celery.security.certificate import FSCertStore
from celery.exceptions import SecurityError

try:
    cert_store = FSCertStore('/etc/celery/certs/*.pem')
except SecurityError as exc:
    raise SystemExit(f'Failed to initialize certificate store: {exc}')
```
