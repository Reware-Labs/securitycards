# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: file handling

## file handling

### Validate File Paths and Containment for FileResponse

**Use when**

Handling user-influenced file paths when serving files via `FileResponse`.

**Secure rules**

**Rule 1: Serve request-addressable files from a configured directory with `StaticFiles`**

When files are exposed under a URL prefix, mount `StaticFiles` with the directory from which they may be served. `StaticFiles` rejects absolute request paths and verifies that resolved paths remain inside the configured directory before returning a file response. Requests that do not resolve to an available file receive a 404 response.

```python
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles

routes = [
    Mount(
        "/downloads",
        app=StaticFiles(directory="/app/storage/uploads"),
        name="downloads",
    )
]

app = Starlette(routes=routes)
```
