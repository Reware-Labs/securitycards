# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: dangerous execution

## dangerous execution

### Configure Explicit Executable Names for Stand-Alone Subcommands

**Use when**

Defining stand-alone executable subcommands with `.command(name, description, opts)` where process spawning or binary name resolution occurs.

**Secure rules**

**Rule 1: Explicitly set `executableFile` or `.executableDir()` for stand-alone subcommands to ensure Commander launches the intended executable**

When a subcommand is declared with a description string, Commander treats it as a stand-alone executable and looks for a file named `program-subcommand` in the entry-script directory. To avoid unintentional file resolution, give Commander an explicit target by either:

* Passing the `executableFile` option to `.command()` to name the exact file to run.
* Calling `.executableDir()` on the parent command to restrict the search to a trusted directory.

```javascript
import { Command } from 'commander';

const program = new Command()
  .name('pm')                  // base name for generated filenames
  .executableDir('./bin');     // trusted directory containing executables

program
  .command('update', 'update packages', {
    executableFile: 'pm-update'  // exact executable inside ./bin
  });

program.parse();
```
