# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: api contract misuse

## api contract misuse

### Validate HTTP Response Status Codes Before Parsing Payloads

**Use when**

Processing response data or parsing payloads returned from HTTP requests.

**Secure rules**

**Rule 1: Always verify the response status code or call raise_for_status() before parsing response payloads.**

Successful execution of `r.json()` only indicates valid JSON formatting, not HTTP success. Error responses such as HTTP 500 or 400 may still contain valid JSON payloads, so calling `r.raise_for_status()` ensures that applications do not ingest error details as successful business data.

```python
import requests

r = requests.get('https://api.github.com/events', timeout=5)
# Check response status before parsing payload
r.raise_for_status()
data = r.json()
```
