# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: input contract definition

## input contract definition

### Constrain input values and ranges using Choice and numeric ranges

**Use when**

Defining command-line parameters and options that require strict allowlists, explicit enumerations, or bounded numerical values.

**Secure rules**

**Rule 1: Constrain string inputs to explicit allowlists or Enum members using click.Choice.**

Use `click.Choice` to restrict user inputs to a strict allowlist of explicit string values or Enum members. This ensures that arbitrary and unvalidated strings are rejected before entering application logic.

```python
import enum
import click

class HashType(enum.Enum):
    MD5 = enum.auto()
    SHA1 = enum.auto()

@click.command()
@click.option("--hash-type", type=click.Choice(HashType, case_sensitive=False))
def digest(hash_type: HashType):
    click.echo(hash_type)
```

**Rule 2: Enforce strict numerical boundaries using IntRange and FloatRange.**

Use `click.IntRange` or `click.FloatRange` to enforce explicit lower and upper bounds on numerical arguments, preventing out-of-range values or resource allocation spikes.

```python
@click.command()
@click.option("--count", type=click.IntRange(0, 20))
def repeat(count: int):
    click.echo(str(count))
```


### Secure Unsafe Parameter Defaults and Explicitly Handle Unset Configurations

**Use when**

Configuring Click command options, default values, environment variable bindings, and flag parameters to prevent unsafe configuration stomping and unvalidated fallbacks.

**Secure rules**

**Rule 1: Sanitize empty environment variable fallbacks for path parameters**

Rely on Click to normalize empty environment variable strings to `None` when defining options that accept file paths or system resources bound to environment variables via `envvar`. Explicitly handle `None` default values rather than assuming an empty environment variable provides a valid string path.

```python
@click.command()
@click.option("--config-path", type=click.Path(exists=True), envvar="CONFIG_PATH")
def cli(config_path):
    if config_path is None:
        return
    # Process valid config path
```

**Rule 2: Verify parameter source before overriding environment settings with option defaults**

Check `ctx.get_parameter_source(param.name)` to verify whether a parameter value was explicitly passed on the command line or derived from defaults. If the value source is a default, avoid overwriting pre-existing environment variables or external security settings.

```python
def set_debug(ctx, param, value):
    source = ctx.get_parameter_source(param.name)
    if source in (click.core.ParameterSource.DEFAULT, click.core.ParameterSource.DEFAULT_MAP):
        return None
    os.environ["APP_DEBUG"] = "1" if value else "0"
    return value

@click.command()
@click.option("--debug/--no-debug", default=False, is_eager=True, expose_value=False, callback=set_debug)
def cli():
    pass
```

**Rule 3: Explicitly define boolean flag defaults when binding environment variables**

Ensure boolean flag options bound to environment variables default safely to `False` or an explicit non-privileged state when environment variables are unset, empty, or whitespace-padded.

```python
@click.command()
@click.option("--enable-audit/--no-enable-audit", default=False, envvar="ENABLE_AUDIT")
def cli(enable_audit):
    if enable_audit:
        pass
```

**Rule 4: Specify explicit literal defaults for non-boolean flag options**

Avoid using `default=True` on options configured with a non-boolean `flag_value`. Explicitly set `default` to the concrete value expected by the application to prevent unexpected parameter substitution.

```python
@click.command()
@click.option('--upper', 'transformation', flag_value='upper', default='upper')
@click.option('--lower', 'transformation', flag_value='lower')
def info(transformation):
    click.echo(transformation)
```

**Rule 5: Define explicit defaults or required flags for options**

Explicitly specify safe default values using `default` or enforce mandatory parameter input using `required=True` to avoid relying on unsafe implicit `None` defaults in application logic.

```python
@click.command()
@click.option('--mode', default='secure', help='Operating mode')
@click.option('--key', required=True, help='Access key')
def cli(mode, key):
    click.echo(f'Mode: {mode}')
```
