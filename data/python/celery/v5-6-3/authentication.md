# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: authentication

## authentication

### Configure Explicit Credentials and Authentication Parameters for Result Backends and Brokers

**Use when**

Setting up Celery connection URIs or transport options with external database and cache backends requiring authentication.

**Secure rules**

**Rule 1: Provide complete credentials and authentication parameters in connection URIs for external result backends and brokers.**

Ensure that usernames, passwords, and explicit parameters like `authMechanism` and `authSource` are fully supplied when configuring backends such as MongoDB, Redis, Cassandra, or Elasticsearch to prevent unauthenticated access or client initialization failures.

```python
app.conf.result_backend = 'mongodb://user:password@example.com:27017/?authSource=the_database&authMechanism=SCRAM-SHA-256'
```
