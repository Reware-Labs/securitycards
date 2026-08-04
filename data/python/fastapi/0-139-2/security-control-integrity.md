# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: security control integrity

## security control integrity

### Order Middleware Correctly to Preserve Security Control Execution

**Use when**

Configuring security, logging, or rate-limiting middleware in a FastAPI application using `app.add_middleware()` or `@app.middleware()`.

**Secure rules**

**Rule 1: Account for middleware stacking order when adding security and processing layers.**

Register middleware so that outermost security controls such as rate limiters, logging, or CORS are added last. This ensures they wrap inner middleware layers and execute first on incoming requests.

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def inner_security_audit(request: Request, call_next):
    response = await call_next(request)
    return response

@app.middleware("http")
async def outer_boundary_check(request: Request, call_next):
    response = await call_next(request)
    return response
```
