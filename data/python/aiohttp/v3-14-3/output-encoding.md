# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: output encoding

## output encoding

### Prevent Cross-Site Scripting by Encoding HTML and Setting Content Types

**Use when**

Rendering dynamic user input or serving static files in `aiohttp` web applications to prevent browser-based script execution.

**Secure rules**

**Rule 1: Rely on built-in HTML escaping when enabling static directory indexing**

When configuring directory indexing via `app.router.add_static(..., show_index=True)`, `aiohttp` automatically escapes HTML entities in file and directory names. Rely on this built-in mechanism instead of generating manual, unescaped index pages.

```python
app = web.Application()
app.router.add_static('/static', '/path/to/static', show_index=True)
```

**Rule 2: Set explicit content types and properly escape dynamic response text**

When returning HTTP responses containing user-controlled input using `Response`, `StreamResponse`, or `json_response`, explicitly define the `content_type` and `charset` properties. Ensure HTML content is properly escaped using standard escaping libraries like `html.escape` before writing it to response text.

```python
from aiohttp import web
import html

async def handle_user_input(request: web.Request) -> web.Response:
    user_name = request.query.get('name', '')
    escaped_name = html.escape(user_name)
    return web.Response(
        text=f'<h1>Hello {escaped_name}</h1>',
        content_type='text/html',
        charset='utf-8'
    )
```
