# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: runtime environment hardening

## runtime environment hardening

### Enable ignore-scripts in build environments handling secrets

**Use when**

Configuring build environments, CI/CD pipelines, or package installations that process sensitive credentials and require minimized runtime attack surfaces.

**Secure rules**

**Rule 1: Configure ignore-scripts to true in project configuration or build commands to prevent automatic dependency lifecycle script execution.**

Set `ignore-scripts=true` in the project `.npmrc` file or pass `--ignore-scripts` directly to package manager commands during build and deployment workflows to eliminate automated script execution vectors.

```bash
# In .npmrc:
ignore-scripts=true

# Or via npm command:
npm ci --ignore-scripts
```
