# Security cards

Repository: `https://github.com/pallets/flask#3.1.3`
Category: resource exhaustion

## resource exhaustion

### Configure request size limits and form parsing thresholds

**Use when**

Configuring Flask application settings to restrict incoming payload sizes and multipart form parsing consumption.

**Secure rules**

**Rule 1: Set global or per-request payload limits and form parsing thresholds.**

Use `MAX_CONTENT_LENGTH` globally or `Request.max_content_length` per request to restrict total request payload size. Additionally, configure `MAX_FORM_MEMORY_SIZE` and `MAX_FORM_PARTS` to control memory usage when parsing non-file multipart form fields.

```python
app.config.update(
    MAX_CONTENT_LENGTH=16 * 1024 * 1024,
    MAX_FORM_MEMORY_SIZE=500 * 1024,
    MAX_FORM_PARTS=1000
)
```
