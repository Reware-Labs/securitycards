# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: api contract misuse

## api contract misuse

### Initialize Shared Context State Before Access

**Use when**

Building nested Click groups and subcommands that rely on `ctx.obj` for sharing application state across command hierarchies.

**Secure rules**

**Rule 1: Call ctx.ensure_object() to guarantee that state objects are initialized before setting or accessing keys.**

When passing shared application state across nested group and subcommand invocations via `ctx.obj`, the context object may be uninitialized if the script is invoked directly or programmatically without an explicit dictionary. Always invoke `ctx.ensure_object()` inside top-level parent commands to prevent unexpected runtime `TypeError` or `AttributeError` exceptions when subcommands access context attributes.

```python
@click.group()
@click.option('--debug/--no-debug', default=False)
@click.pass_context
def cli(ctx, debug):
    ctx.ensure_object(dict)
    ctx.obj['DEBUG'] = debug

@cli.command()
@click.pass_context
def sync(ctx):
    debug_status = ctx.obj.get('DEBUG', False)
    click.echo(f"Debug is {'on' if debug_status else 'off'}")
```
