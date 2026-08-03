# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: secret handling

## secret handling

### Prevent the Exposure of Sensitive Context Data via Jinja Debug Extensions

**Use when**

Configuring Jinja environments in Python applications where sensitive variables or environment settings might be inadvertently exposed in production.

**Secure rules**

**Rule 1: Restrict the registration of the debug extension to non-production environments to avoid dumping context variables.**

Ensure that the `jinja2.ext.debug` extension is not loaded in production deployments. Conditionally append it based on your application environment variable checks so that template variables, filters, and test states are not dumped to rendered documents.

```python
import os
from jinja2 import Environment

extensions = ['jinja2.ext.i18n']
if os.getenv('APP_ENV') == 'development':
    extensions.append('jinja2.ext.debug')

env = Environment(extensions=extensions)
```
