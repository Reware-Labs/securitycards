# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: resource exhaustion

## resource exhaustion

### Limit Request Body and Form Parsing Size to Prevent Resource Exhaustion

**Use when**

Handling incoming HTTP requests, JSON payloads, or multipart/form-data uploads in Starlette endpoints.

**Secure rules**

**Rule 1: Configure explicit limits when parsing form data**

Pass appropriate `max_files`, `max_fields`, and `max_part_size` limits to `request.form()`. Starlette enforces these limits while parsing form submissions, preventing an unlimited number of files or fields from consuming excessive CPU and memory.

```python
from starlette.responses import JSONResponse

async def submit_form(request):
    async with request.form(
        max_files=5,
        max_fields=20,
        max_part_size=512 * 1024,
    ) as form:
        return JSONResponse({"parsed_items": len(form)})
```
