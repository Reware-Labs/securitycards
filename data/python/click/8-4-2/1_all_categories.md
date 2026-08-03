# Security cards

Repository: `https://github.com/pallets/click#8.4.2`

## Category: api contract misuse

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


## Category: configuration source integrity

### Secure Configuration Loading and Path Validation in Click

**Use when**

Loading configuration files, default maps, and path parameters in Click CLI applications to prevent untrusted input from altering security behavior.

**Secure rules**

**Rule 1: Validate configuration file paths using click.Path and load settings only from trusted locations.**

When accepting configuration paths via command options, configure `click.Path` with `exists=True`, `dir_okay=False`, and `resolve_path=True` to prevent path traversal and working-directory hijacking. Additionally, use `click.get_app_dir()` to locate standard OS-specific per-user configuration directories rather than loading configuration files from current working directory relative paths.

```python
import os
import click
import configparser

APP_NAME = 'my_app'

def load_config():
    config_dir = click.get_app_dir(APP_NAME)
    config_path = os.path.join(config_dir, 'config.ini')
    parser = configparser.ConfigParser()
    if os.path.exists(config_path):
        parser.read(config_path)
    return parser
```


### Secure Environment Variable Sources and Parameter Validation

**Use when**

Use when configuring Click commands, options, and arguments that consume parameters or flags from environment variables.

**Secure rules**

**Rule 1: Configure distinct auto envvar prefixes on contexts to prevent variable collision**

Set `auto_envvar_prefix` in `context_settings` when creating groups or commands to restrict automatic environment variable parameter lookups to application-specific namespaces.

```python
@click.group(context_settings=dict(auto_envvar_prefix="MY_APP"))
def cli():
    pass

@cli.command()
@click.option("--port", type=int)
def serve(port):
    pass
```

**Rule 2: Audit parameter sources to validate environment variable inputs**

Use `ctx.get_parameter_source()` to inspect whether a parameter originated from `ParameterSource.ENVIRONMENT` before executing sensitive operations.

```python
@click.command()
@click.option("--api-key", envvar="API_KEY")
@click.pass_context
def main(ctx, api_key):
    source = ctx.get_parameter_source("api_key")
    if source == click.ParameterSource.ENVIRONMENT:
        pass
```

**Rule 3: Account for environment variable splitting and empty value interpretation**

Explicitly define option types like `click.Path()` when expecting path lists, and account for whitespace versus path-separator splitting behavior.

```python
@click.command()
@click.option('--path', multiple=True, type=click.Path(), envvar='APP_PATHS')
@click.option('--arg', multiple=True, envvar='APP_ARGS')
def cli(path, arg):
    pass
```

**Rule 4: Configure environment variable sources for arguments via envvar**

Explicitly specify allowed environment variable names for CLI arguments using the `envvar` parameter in `click.argument` to restrict fallback exclusively to declared variable names.

```python
@click.command()
@click.argument('src', envvar=['SRC', 'SRC_2'], type=click.File('r'))
def echo(src):
    click.echo(src.read())
```

**Rule 5: Understand option resolution precedence when using environment variables**

Explicitly define `envvar` parameters on options and account for the fixed precedence where explicit command-line input overrides environment variables.

```python
@click.command()
@click.option('--api-key', envvar='API_KEY', help='API key source')
def cli(api_key):
    pass
```

**Rule 6: Safely inspect os.environ for shell completion environment variables**

When configuring shell completion or creating custom `ShellComplete` subclasses that read from environment variables, safely query `os.environ` using defaults.

```python
import os
from click.shell_completion import ShellComplete
from click.parser import split_arg_string

class SecureMyshComplete(ShellComplete):
    def get_completion_args(self):
        comp_words = os.environ.get("COMP_WORDS", "")
        args = split_arg_string(comp_words)
        return args, ""
```

**Rule 7: Check parameter source before updating environment variables in option callbacks**

Inspect the parameter source using `ctx.get_parameter_source(param.name)` and do not overwrite pre-existing environment variables if the source is `ParameterSource.DEFAULT` or `ParameterSource.DEFAULT_MAP`.

```python
import os
import click
from click.core import ParameterSource

def set_debug(ctx, param, value):
    source = ctx.get_parameter_source(param.name)
    if source in (ParameterSource.DEFAULT, ParameterSource.DEFAULT_MAP):
        return None
    os.environ["APP_DEBUG"] = "1" if value else "0"
    return value

@click.command()
@click.option("--debug/--no-debug", default=False, is_eager=True, expose_value=False, callback=set_debug)
def cli():
    pass
```


### Verify Parameter Sources and Precedence for Configuration Inputs

**Use when**

Developing command-line applications that accept security-sensitive options from multiple precedence levels such as prompts, command-line arguments, environment variables, and defaults.

**Secure rules**

**Rule 1: Use parameter source introspection to verify the origin of sensitive inputs and guard against unexpected fallback values.**

Call `ctx.get_parameter_source(param_name)` to inspect whether parameters originated from trusted sources like explicit command line flags, prompts, environment variables, or fallback defaults. Enforce strict checks to ensure sensitive settings or ports do not inadvertently rely on unsafe fallback configurations or override expectations.

```python
import click

@click.command()
@click.option('--port', default=8080, envvar='APP_PORT')
@click.pass_context
def cli(ctx, port):
    source = ctx.get_parameter_source('port')
    if source >= click.ParameterSource.DEFAULT_MAP:
        click.echo('Warning: Using fallback default port setting.')
```


## Category: dangerous execution

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


## Category: file handling

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


## Category: injection

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


## Category: input contract definition

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


## Category: input interpretation safety

### Validate Command-Line Inputs Using Custom Parameter Types and Callbacks

**Use when**

Parsing, converting, and validating untrusted command-line inputs or arguments to ensure they conform to expected formats and ranges before processing.

**Secure rules**

**Rule 1: Validate user input during CLI parameter parsing by defining custom `click.ParamType` subclasses or parameter callbacks.**

Implement custom conversion logic using `click.ParamType` subclasses or parameter callbacks, and invoke `self.fail()` or raise `click.BadParameter` with sanitized error messages when input validation fails.

```python
class PortNumber(click.ParamType):
    name = "port"

    def convert(self, value, param, ctx):
        if isinstance(value, int):
            val = value
        else:
            try:
                val = int(value)
            except ValueError:
                self.fail(f"{value!r} is not a valid integer.", param, ctx)

        if not (1 <= val <= 65535):
            self.fail(f"Port {val} is outside allowed range (1-65535).", param, ctx)
        return val
```


## Category: runtime environment hardening

### Configure Explicit UTF-8 Locales in Deployment Environments

**Use when**

When deploying Click applications to automated or headless runtime environments that default to ASCII.

**Secure rules**

**Rule 1: Explicitly set and export UTF-8 locale variables prior to executing Click CLI applications.**

Ensure deployment environments, init scripts, background jobs, and containers explicitly set and export a UTF-8 locale such as LANG=C.UTF-8 and LC_ALL=C.UTF-8 before running Click CLI applications. Automated or headless environments defaulting to ASCII prevent clean Unicode input parsing, cause surrogate escape corruption, or trigger execution aborts.

```bash
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
python3 application.py
```


## Category: secret handling

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
