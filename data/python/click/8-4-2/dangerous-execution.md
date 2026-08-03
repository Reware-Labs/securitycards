# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: dangerous execution

## dangerous execution

### Prevent shell execution by avoiding untrusted shell interpretation in subprocess and pager utilities

**Use when**

When passing dynamic filenames, environment variables, or external command parameters to Click utilities like `click.edit()` or pager implementations that invoke external binaries.

**Secure rules**

**Rule 1: Avoid shell interpretation and ensure subprocess execution uses direct argument tokenization instead of evaluating command strings through a system shell.**

When launching external editors via `click.edit()` or handling external pager commands, Click tokenizes argument lists and passes parameters directly with `shell=False`. Ensure that custom subprocess or command execution workflows follow this pattern and never evaluate untrusted strings through shell interpreters.

```python
import click

untrusted_filename = 'user_file.txt'
click.edit(filename=untrusted_filename)
```
