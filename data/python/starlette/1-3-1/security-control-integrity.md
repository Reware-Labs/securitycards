# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: security control integrity

## security control integrity

### Propagate security context across middleware boundaries using request state

**Use when**

When managing authentication states, audit metadata, or security context across middleware boundaries and endpoint handlers in Starlette.

**Secure rules**

**Rule 1: Use request.state instead of contextvars to propagate security context and state changes across middleware boundaries.**

Because contextvars modified inside downstream endpoints or inner middleware do not propagate context changes backward to outer middleware due to async task context copying, developers must rely on `request.state` rather than `contextvars` to reliably propagate security contexts, authentication states, or audit metadata.

```python
class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request.state.user_id = None
        response = await call_next(request)
        user_id = getattr(request.state, "user_id", "anonymous")
        response.headers["X-Audit-User"] = user_id
        return response
```
