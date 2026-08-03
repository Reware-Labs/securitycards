# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: input interpretation safety

## input interpretation safety

### Enforce Strict Content Type Checking for Request Bodies

**Use when**

Developing route handlers and request parsing where input content types and payload formats must be strictly validated.

**Secure rules**

**Rule 1: Keep strict_content_type enabled when configuring route handlers and request parsing.**

Ensure `strict_content_type` is kept enabled or explicitly set to `True` to prevent FastAPI from attempting to parse JSON bodies when the `Content-Type` header is missing or non-JSON, thereby avoiding content-type confusion and unintentional request interpretation.

```python
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel

app = FastAPI()
router = APIRouter()

class ItemPayload(BaseModel):
    name: str

@router.post("/items/")
async def create_item(payload: ItemPayload):
    return {"status": "ok", "name": payload.name}

app.include_router(router)
```
