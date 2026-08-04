# Security cards

Repository: `https://github.com/spf13/cobra#v1.10.2`
Documentation repository: `https://github.com/spf13/cobra.dev#master`
Category: runtime environment hardening

## runtime environment hardening

### Disable ActiveHelp in Restricted Execution Environments

**Use when**

Deploying and executing Cobra CLI applications in automated, containerized, or restricted production environments.

**Secure rules**

**Rule 1: Disable ActiveHelp globally via environment variables in restricted environments to reduce the runtime attack surface and prevent unexpected interactive output.**

Cobra processes global and application-level environment variables to determine whether `ActiveHelp` messages should be rendered. In automated environments, CI/CD runners, or privilege-restricted shells, set `COBRA_ACTIVE_HELP=0` to globally turn off ActiveHelp evaluation and prevent diagnostic terminal outputs or script side effects.

```bash
export COBRA_ACTIVE_HELP=0
```
