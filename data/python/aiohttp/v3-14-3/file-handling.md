# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: file handling

## file handling

### Validate Uploaded Filenames and Restrict Static File Symlinks

**Use when**

Handling file uploads from multipart requests and configuring static file routes in aiohttp web applications.

**Secure rules**

**Rule 1: Sanitize uploaded filenames from multipart fields before performing filesystem operations.**

Always validate and sanitize client-provided filenames extracted from multipart fields such as `field.filename` before passing them into filesystem operations. Use `os.path.basename()` to strip directory path separators and constrain destination paths to the intended storage directory.

```python
import os
from pathlib import Path

async def safe_upload_handler(request):
    reader = await request.multipart()
    field = await reader.next()
    if field and field.name == 'mp3':
        filename = os.path.basename(field.filename)
        destination = Path('/spool/yarrr-media/mp3/') / filename
        with open(destination, 'wb') as f:
            while True:
                chunk = await field.read_chunk()
                if not chunk:
                    break
                f.write(chunk)
    return web.Response(text='Uploaded safely')
```

**Rule 2: Disable symlink traversal when configuring static file routes.**

Do not set `follow_symlinks=True` when configuring static file routes using `web.static()`. Keeping this option disabled prevents clients from escaping the static file sandbox via symbolic links that lead outside the intended directory.

```python
from aiohttp import web

app = web.Application()
app.add_routes([web.static('/static', '/path/to/static')])
```
