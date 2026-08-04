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
