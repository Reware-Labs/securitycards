# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: input interpretation safety

## input interpretation safety

### Prevent Parser Desynchronization by Restricting Non-Standard JSON Numeric Formats

**Use when**

Serializing data structures to JSON payloads via the `json` parameter in requests.

**Secure rules**

**Rule 1: Avoid passing out-of-spec numeric values like `float('nan')` or `float('inf')` into JSON request payloads.**

Ensure all dictionary and sequence data passed to the `json` parameter contain valid standard JSON data types and do not include values that trigger an `InvalidJSONError` or break strict backend API parsers.

```python
import requests

payload = {"status": "success", "score": 98.5}
response = requests.post("https://api.example.com/submit", json=payload)
```
