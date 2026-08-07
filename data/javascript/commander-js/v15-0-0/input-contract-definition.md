# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: input contract definition

## input contract definition

### Restrict Option Input Using Strict Choices and Mandatory Flags

**Use when**

Defining command-line options and arguments that require strict input validation boundaries and enumerated value allowlisting.

**Secure rules**

**Rule 1: Constrain options and command arguments to expected input spaces by defining strict string choices and required flags.**

Enforce strict input validation boundaries by calling `.choices()` to limit inputs to a predefined array of allowed values. Additionally, use `.conflicts()` and `.implies()` to declare mutually exclusive options and option dependencies, and declare required flags using `.makeOptionMandatory()` or argument required syntax.

```javascript
import { Command, Option } from 'commander';

const program = new Command();
const envOption = new Option('-e, --environment <env>', 'target environment')
  .choices(['development', 'staging', 'production'])
  .makeOptionMandatory();

program.addOption(envOption);

program
  .addOption(
    new Option('-d, --drink <size>', 'drink cup size').choices([
      'small',
      'medium',
      'large'
    ])
  )
  .addOption(
    new Option('--disable-server', 'disables the server').conflicts('port')
  );

program.parse();
```
