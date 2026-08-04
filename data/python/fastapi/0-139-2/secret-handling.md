# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: secret handling

## secret handling

### Load Secret Keys Securely from Environment Variables

**Use when**

Configuring secret keys, API tokens, or cryptographic signing material for FastAPI applications.

**Secure rules**

**Rule 1: Keep sensitive application settings in environment variables outside the application code**

Provide sensitive settings, such as secret keys and service credentials, through environment variables that the application reads at runtime. Because environment variables are set outside the code, they do not have to be stored or committed to Git with the application files.

```python
import os

from fastapi import FastAPI

app = FastAPI()
secret_key = os.getenv("SECRET_KEY")


@app.get("/status")
async def status():
    return {"secret_configured": secret_key is not None}
```
