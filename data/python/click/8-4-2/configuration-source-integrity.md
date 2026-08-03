# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: configuration source integrity

## configuration source integrity

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
