# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: secret handling

## secret handling

### Hide user input when prompting for secrets and passwords

**Use when**

Prompting command-line interface users for sensitive information such as passwords, tokens, or API keys.

**Secure rules**

**Rule 1: Hide input when prompting for passwords**

When using `click.prompt()` to collect a password, set `hide_input=True` so Click reads the value through its hidden input prompt instead of visibly echoing the entered value.

```python
import click

password = click.prompt("Enter password", hide_input=True)
```
