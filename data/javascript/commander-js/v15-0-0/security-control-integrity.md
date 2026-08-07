# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: security control integrity

## security control integrity

### Override default exit behavior to fail closed in long-running processes

**Use when**

Embedding Commander inside long-running process environments, web services, or test runners where process.exit() should not be invoked on validation failure or help output.

**Secure rules**

**Rule 1: Use `exitOverride()` to replace automatic `process.exit()` with a thrown `CommanderError`, and make sure the callback (or default handler) throws**

Calling `.exitOverride()` tells Commander to invoke an override callback instead of exiting. Because Commander will still call `process.exit()` if that callback **returns**, the callback (or the default override which throws) must throw a `CommanderError`. Wrap `program.parse()` in a `try … catch` so your application can handle the error safely and decide the final exit status.

```javascript
import { Command, CommanderError } from 'commander';

const program = new Command();

// Default override throws CommanderError for all exits.
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
  if (err instanceof CommanderError) {
    // Help/version exits are not fatal.
    if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
      process.exitCode = 0;
    } else {
      console.error('CLI error:', err.message);
      process.exitCode = err.exitCode;   // fail closed with the reported exit code
    }
  } else {
    throw err; // propagate unexpected errors
  }
}
```
