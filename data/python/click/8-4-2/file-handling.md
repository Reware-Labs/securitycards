# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: file handling

## file handling

### Validate File Paths and Permissions Using Specialized Click Types

**Use when**

Developing command-line interfaces that accept file paths or file objects as arguments or options and require strict validation of existence, permissions, and file types.

**Secure rules**

**Rule 1: Use dedicated parameter types instead of raw strings to enforce file and path validation boundaries.**

Avoid defining file or directory path parameters as raw string arguments. Instead, use Click's dedicated parameter types like `click.Path()` or `click.File()` to enforce strict path and file lifecycle validation.

```python
@click.command()
@click.argument("src", envvar="SRC", type=click.File("r"))
def echo(src):
    click.echo(src.read())
```

**Rule 2: Configure explicit validation flags on path parameters to check existence and permissions.**

Use `click.Path` with explicit validation flags such as `exists=True`, `readable=True`, `writable=True`, `executable=True`, `file_okay`, and `dir_okay` to enforce input file boundaries and check permissions prior to application processing. Always render undecodable paths safely using `click.format_filename`.

```python
@click.command()
@click.argument('config_path', type=click.Path(exists=True, readable=True, file_okay=True, dir_okay=False))
def load_config(config_path):
    click.echo(f"Loading: {click.format_filename(config_path)}")
```

**Rule 3: Enable atomic writes when updating files that may be read concurrently.**

Configure `click.File` with `atomic=True` when writing files that may be concurrently read by other users or processes. Retain lazy opening mode unless early truncation is explicitly desired.

```python
@click.command()
@click.argument('output', type=click.File('w', atomic=True))
def export_report(output):
    output.write("Report contents\n")
```
