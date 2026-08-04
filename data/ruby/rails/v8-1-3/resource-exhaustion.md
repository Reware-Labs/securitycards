# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: resource exhaustion

## resource exhaustion

### Configure Explicit Timeouts and Connection Limits for External Services and Databases

**Use when**

When setting up cloud storage configurations, database connection pools, or query caches in Rails applications to prevent thread and resource exhaustion.

**Secure rules**

**Rule 1: Configure client timeouts and retries for Active Storage S3 services**

For an Active Storage entry using `service: S3`, configure sensible `http_open_timeout`, `http_read_timeout`, and `retry_limit` values to limit prolonged AWS client connections and request queuing. These are S3/AWS client options, not generic settings for every Active Storage cloud backend.

```yaml
amazon:
  service: S3
  bucket: <%= ENV.fetch("ACTIVE_STORAGE_S3_BUCKET") %>
  http_open_timeout: 0
  http_read_timeout: 0
  retry_limit: 0
```

**Rule 2: Cap ActiveRecord query cache size in database configuration.**

Specify a concrete integer limit for `query_cache` in your database pool configuration to cap the maximum number of cached query results per connection and prevent excessive memory consumption.

```yaml
production:
  adapter: postgresql
  encoding: unicode
  pool: 5
  query_cache: 100
```
