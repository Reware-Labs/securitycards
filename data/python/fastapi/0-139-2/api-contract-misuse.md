# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: api contract misuse

## api contract misuse

### Define explicit response models instead of excluding fields at runtime

**Use when**

Defining route handlers and specifying response serialization models for API endpoints.

**Secure rules**

**Rule 1: Use dedicated response models instead of runtime exclusion parameters for sensitive fields.**

When returning data from a path operation, define a dedicated Pydantic model for the output type rather than using parameters like `response_model_exclude` or `response_model_include`. This ensures that FastAPI generates accurate OpenAPI documentation that does not expose internal or sensitive attributes that were meant to be hidden.

```python
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI()

class ItemBase(BaseModel):
    name: str
    description: str | None = None
    price: float

class ItemOut(ItemBase):
    pass

@app.get("/items/{item_id}", response_model=ItemOut)
async def read_item(item_id: str):
    return {"name": "Foo", "description": "A sample item", "price": 45.0, "tax": 3.2}
```
