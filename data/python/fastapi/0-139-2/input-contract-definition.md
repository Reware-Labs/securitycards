# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: input contract definition

## input contract definition

### Enforce Strict Schema, Type, and Length Validation for FastAPI Request Parameters and Form Models

**Use when**

Building FastAPI endpoints and validating incoming request parameters, query strings, headers, cookies, and form bodies.

**Secure rules**

**Rule 1: Declare explicit type annotations and Pydantic models for input validation across all parameters**

Use native Python type hints and Pydantic `BaseModel` classes to automatically validate input payloads, verify types, and deserialize request bodies, path parameters, query parameters, headers, cookies, and forms before route handlers execute.

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float
    is_offer: bool | None = None

@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    return {"item_name": item.name, "item_id": item_id}
```

**Rule 2: Declare validation constraints for request parameters**

Use `Path()` and `Query()` to declare numeric and string validation constraints for request parameters. Numeric constraints include `gt`, `ge`, `lt`, and `le`.

```python
from typing import Annotated
from fastapi import FastAPI, Path

app = FastAPI()

@app.get("/items/{item_id}")
async def read_item(
    item_id: Annotated[int, Path(gt=0, le=100000)],
):
    return {"item_id": item_id}
```

**Rule 3: Forbid extra input fields in Pydantic models to prevent mass assignment and parameter pollution**

Configure Pydantic models handling form bodies or cookies with `model_config = ConfigDict(extra='forbid')` so that unexpected or unauthorized extra fields trigger an HTTP `422 Unprocessable Entity` response instead of being ignored.

```python
from fastapi import FastAPI, Form
from pydantic import BaseModel, ConfigDict

class UserForm(BaseModel):
    model_config = ConfigDict(extra="forbid")
    username: str
    password: str

app = FastAPI()

@app.post("/login/")
def login(form_data: UserForm = Form()):
    return {"username": form_data.username}
```

**Rule 4: Explicitly specify element types when accepting list query parameters**

Always declare explicit element types such as `list[str]` or `list[int]` instead of using bare `list` to ensure element-level data validation and proper OpenAPI schema definitions.

```python
from typing import Annotated
from fastapi import FastAPI, Query

app = FastAPI()

@app.get("/items/")
async def read_items(q: Annotated[list[str], Query()] = ["foo", "bar"]):
    return {"q": q}
```
