# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: input contract definition

## input contract definition

### Enforce Strict Type Validation on Celery Task Parameters

**Use when**

Defining and validating input parameters received from broker messages using Pydantic models in Celery tasks.

**Secure rules**

**Rule 1: Maintain strict type validation when wrapping task execution with Pydantic models.**

When using `pydantic_wrapper` to validate Celery task parameters, ensure `strict=True` is explicitly set. This prevents implicit type coercion during deserialization and ensures that unexpected input types from broker messages are rejected before application processing.

```python
from celery.app.base import pydantic_wrapper
from pydantic import BaseModel

class UserPayload(BaseModel):
    user_id: int
    action: str

def my_task_func(payload: UserPayload):
    return payload.user_id

wrapped_task = pydantic_wrapper(
    app=app,
    task_fun=my_task_func,
    task_name='tasks.my_task',
    strict=True
)
```
