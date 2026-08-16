# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: output encoding

## output encoding

### Sanitize JSON embedded in HTML script tags

**Use when**

Customizing interactive API documentation pages that render configuration dictionaries or parameters inside HTML script tags.

**Secure rules**

**Rule 1: Escape JSON values embedded in HTML script tags against script execution.**

When customizing Swagger UI settings, pass parameters directly through `swagger_ui_parameters` in `get_swagger_ui_html()` so that values are safely converted using the internal HTML-safe JSON encoder.

```python
from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html

app = FastAPI(docs_url=None)

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=app.title + " - Swagger UI",
        swagger_ui_parameters={"deepLinking": True, "persistAuthorization": True}
    )
```


### Encode untrusted data for the context the response places it in

**Use when**

Returning text, markup, or stored content that originated from a request, or writing request data into application logs.

**Secure rules**

**Rule 1: Serve stored user content with a non-executable media type.**

`HTMLResponse` and `Response(media_type="text/html")` tell the browser to parse the body as markup, so stored `<script>` runs under your origin the next time somebody views it. Returning the same bytes as JSON or `text/plain` renders them as text. Add `X-Content-Type-Options: nosniff` so the browser does not sniff the body into a richer type, and `Content-Disposition: attachment` where a download is intended.

```python
from fastapi import FastAPI, Response

app = FastAPI()

@app.get("/pages/{slug}")
def read_page(slug: str):
    body = load_submitted_page(slug)   # user-supplied, untrusted
    return Response(
        content=body,
        media_type="text/plain; charset=utf-8",
        headers={"X-Content-Type-Options": "nosniff"},
    )
```

**Rule 2: Escape untrusted values when the response has to be HTML.**

Render markup with `Jinja2Templates`, which autoescapes interpolated values for the HTML context, or call `html.escape(value, quote=True)` on each untrusted value in a hand-built fragment. This covers text and quoted-attribute positions; values landing inside a `<script>` block or a `href`/`src` URL need JSON or URL encoding instead. `markupsafe.Markup` turns escaping off, so keep request data out of it.

```python
import html
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/greet", response_class=HTMLResponse)
def greet(name: str):
    return f"<p>Hello, {html.escape(name, quote=True)}</p>"
```

**Rule 3: Sanitize user-authored markup when the response must be `text/html`.**

An endpoint documented as returning `text/html` has to return it, so Rule 1 does not apply — a security rule hardens a specification rather than amending it. Rule 2 escapes values you interpolate into markup you control, not a whole page a user wrote. Run the stored markup through an allowlist sanitizer: `nh3` keeps the formatting tags the feature needs and drops `<script>`, `onload`-style handler attributes, and `javascript:` URLs. Where no sanitizer is available, `html.escape` makes the page inert at the cost of showing its tags as text.

A sanitizer may legitimately remove everything. Distinguish a missing record with `page is None`; do not treat an empty sanitized string as though the record does not exist.

```python
import nh3
from fastapi import FastAPI, HTTPException, Response

app = FastAPI()

@app.get("/pages/{slug}")
def read_page(slug: str):
    page = load_submitted_page(slug)   # user-authored markup
    if page is None:
        raise HTTPException(status_code=404, detail="Not found")
    return Response(
        content=nh3.clean(page),       # keeps safe tags, drops scripts and handlers
        media_type="text/html; charset=utf-8",
        headers={"X-Content-Type-Options": "nosniff"},
    )
```

**Rule 4: Strip newline and control characters before writing request data to a log.**

A value containing `\n` or `\r` splits one log entry into two, letting a caller forge lines that look like the server wrote them and pushing real events out of view. Replace line breaks and other control characters before logging, cap the length, and prefer parameterized logging calls so the value stays a distinct field.

```python
import logging
from fastapi import FastAPI

app = FastAPI()
logger = logging.getLogger("app")

def sanitize_for_log(value: str, limit: int = 200) -> str:
    cleaned = "".join(ch if ch.isprintable() else " " for ch in value)
    return cleaned[:limit]

@app.post("/events")
def record_event(message: str):
    logger.info("client event: %s", sanitize_for_log(message))
    return {"status": "recorded"}
```
