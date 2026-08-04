# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: input contract definition

## input contract definition

### Enforce route parameter validation using typed path converters

**Use when**

Defining URL route patterns and path parameters in Starlette to ensure malformed inputs are rejected before reaching endpoint handlers.

**Secure rules**

**Rule 1: Define path parameters with explicit type converters in Starlette route patterns**

Use explicit type converters such as `{param:int}` or `{param:uuid}` in your Starlette `Route` definitions. Starlette's router enforces these type constraints during URL matching and automatically rejects invalid parameter types early at the routing layer with a `404` response.

```python
from starlette.routing import Route
from starlette.responses import JSONResponse
from starlette.requests import Request

def get_user(request: Request) -> JSONResponse:
    user_id = request.path_params["user_id"]
    return JSONResponse({"user_id": str(user_id)})

routes = [
    Route("/users/{user_id:uuid}", endpoint=get_user, name="get-user")
]
```
