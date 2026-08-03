# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: injection

## injection

### Prevent argument injection when forwarding unprocessed arguments or filenames to external processes

**Use when**

When building command line interfaces with Click that forward unprocessed positional arguments or filenames to subprocesses or external editors.

**Secure rules**

**Rule 1: Pass filenames to Click's editor execution functions as discrete argument items without shell invocation.**

When invoking external utilities using `click.edit()`, rely on Click's built-in argument handling to pass filenames as discrete parameters rather than manually constructing shell execution strings. This ensures filenames containing spaces, quotes, or semicolons are treated strictly as literal file paths.

```python
import click

def edit_user_file(filepath: str) -> None:
    # click.edit passes filepath directly as a discrete argument to the editor process without shell invocation
    click.edit(filename=filepath)
```

**Rule 2: Isolate external command invocation and separate unparsed option-like strings with explicit delimiters.**

When capturing leftover arguments via `nargs=-1` with `click.UNPROCESSED`, raw strings starting with dashes can be misinterpreted as options by downstream utilities. Prevent argument injection by disabling interspersed option parsing using `allow_interspersed_args=False`, or by explicitly prepending `--` to separate command flags from positional user arguments.

```python
import subprocess
import click

@click.command(context_settings=dict(ignore_unknown_options=True))
@click.argument("args", nargs=-1, type=click.UNPROCESSED)
def cli(args):
    # Prepend '--' to separate command flags from positional user arguments when invoking external tools
    subprocess.run(["external-tool", "--", *args], check=True)
```
