# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: configuration source integrity

## configuration source integrity

### Secure Environment Variable Configuration and Validation in Commander

**Use when**

When binding CLI options to environment variables using `.env()` or handling ambient process configuration values.

**Secure rules**

**Rule 1: Validate all environment variable inputs using custom option parsers and choice restrictions.**

Treat environment variable inputs as untrusted external sources. Combine `.env()` definitions with explicit validation mechanisms like `.choices()` or custom `.argParser()` functions to validate values before application logic consumes them.

```js
import { Command, Option, InvalidArgumentError } from 'commander';
const program = new Command();

program.addOption(
  new Option('-p, --port <number>', 'port number')
    .env('PORT')
    .argParser((val) => {
      const port = parseInt(val, 10);
      if (isNaN(port) || port < 1024 || port > 65535) {
        throw new InvalidArgumentError('Port must be an integer between 1024 and 65535.');
      }
      return port;
    })
);
```

**Rule 2: Validate environment-derived option values using `.env()` and `.getOptionValueSource()`**

Declare options that may be supplied from the environment with `new Option(...).env(VAR)`.
After parsing, call `command.getOptionValueSource(name)` and apply stricter checks when the source is `'env'`.

```javascript
import { Command, Option } from 'commander';

const program = new Command();

program
  .addOption(
    new Option('--endpoint <url>', 'service endpoint').env('SERVICE_ENDPOINT')
  )
  .action((opts, cmd) => {
    if (cmd.getOptionValueSource('endpoint') === 'env') {
      const url = new URL(opts.endpoint);
      if (url.protocol !== 'https:') {
        cmd.error('SERVICE_ENDPOINT must start with https://');
      }
    }
  });

program.parse();
```

**Rule 3: Enforce option conflict rules on environment variable configurations.**

Define mutual exclusion constraints with `.conflicts()` for options that must not operate together, ensuring contradictory options set via environment variables are correctly rejected.

```js
import { Command, Option } from 'commander';

const program = new Command();
program
  .addOption(new Option('-s, --silent', 'Disable logging').env('SILENT'))
  .addOption(
    new Option('-j, --json', 'Output JSON')
      .env('JSON')
      .conflicts(['silent'])
  );

program.parse();
```
