# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: secret handling

## secret handling

### Prevent accidental exposure of secrets in CLI help output

**Use when**

Defining options or arguments that handle sensitive values or tokens to ensure they are not leaked in plaintext through automated help documentation.

**Secure rules**

**Rule 1: Mask sensitive default values in help output using description overrides**

When configuring options or arguments with default values containing sensitive data, provide a human-readable replacement description using `defaultValueDescription` or the second argument of `.default()` to mask the secret in help output.

```javascript
import { Command } from 'commander';
const program = new Command();

program
  .addOption(
    program
      .createOption('--token <token>', 'API access token')
      .default(process.env.API_TOKEN || 'fallback-secret', '[REDACTED]')
  );
```
