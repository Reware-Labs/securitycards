# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: input interpretation safety

## input interpretation safety

### Throw InvalidArgumentError in Custom Parsers for Input Validation

**Use when**

When writing custom argument or option parser functions in Commander to parse untrusted user input.

**Secure rules**

**Rule 1: Throw an InvalidArgumentError when custom parser validation fails.**

When writing custom argument or option parser functions, throw an instance of InvalidArgumentError or an error with code 'commander.invalidArgument' whenever validation fails. Commander's internal parsing catches this specific error to cleanly stop execution and trigger standard error handling rather than passing unvalidated values into application logic.

```javascript
import { Command, InvalidArgumentError } from 'commander';

const program = new Command();
program
  .option('-p, --port <number>', 'port number', (value) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
      throw new InvalidArgumentError('Port must be an integer between 1 and 65535.');
    }
    return parsed;
  });
```
