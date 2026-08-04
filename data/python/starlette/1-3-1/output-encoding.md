# Security cards

Repository: `https://github.com/Kludex/starlette#1.3.1`
Category: output encoding

## output encoding

### Configure Jinja2 Environment with Explicit Autoescaping in Starlette

**Use when**

Rendering dynamic user input into HTML templates using Starlette templates and a custom `jinja2.Environment`.

**Secure rules**

**Rule 1: Use Starlette’s autoescaping template configuration for HTML templates**

Initialize `Jinja2Templates` with the `directory` argument when using Starlette’s standard template configuration. Starlette enables autoescaping by default for `.html`, `.htm`, and `.xml` templates, escaping user-provided content before rendering it and protecting against Cross-Site Scripting vulnerabilities.

```python
from starlette.templating import Jinja2Templates

templates = Jinja2Templates(directory="templates")
```
