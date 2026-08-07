# Security cards

Repository: `https://github.com/tj/commander.js#v15.0.0`
Category: access control

## access control

### Enforce explicit authorization checks inside action handlers instead of relying on hidden flags

**Use when**

Developing administrative or internal CLI subcommands and options where sensitive actions must be restricted regardless of whether help documentation suppresses their display.

**Secure rules**

**Rule 1: Guard sensitive commands and options inside the action handler, not with `hideHelp` or `hidden` settings**

`Option.hideHelp()` and the `hidden: true` flag only remove items from generated help text—they do **not** block users from invoking those commands or options. For operations that should be restricted (administrative, destructive, tenant-scoped, etc.), implement explicit authorization logic inside the command’s `.action()` callback.

```javascript
import { Command, Option } from 'commander';

const program = new Command();

program
  .command('internal-reset', { hidden: true })        // hidden from help, still executable
  .description('Dangerous maintenance task')
  .addOption(new Option('--force-purge').hideHelp())  // also hidden from help
  .action((options) => {
    // Robust runtime check – do not rely on help hiding
    if (process.env.NODE_ENV === 'production' && !isAuthorizedAdmin()) {
      throw new Error('Unauthorized attempt to execute internal-reset');
    }

    // …secure reset logic…
    console.log('System state purged.');
  });

program.parse();
```
