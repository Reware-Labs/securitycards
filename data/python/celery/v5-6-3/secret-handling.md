# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: secret handling

## secret handling

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
