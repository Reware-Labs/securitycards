# Security cards

Repository: `https://github.com/pallets/click#8.4.2`
Category: runtime environment hardening

## runtime environment hardening

### Configure Explicit UTF-8 Locales in Deployment Environments

**Use when**

When deploying Click applications to automated or headless runtime environments that default to ASCII.

**Secure rules**

**Rule 1: Explicitly set and export UTF-8 locale variables prior to executing Click CLI applications.**

Ensure deployment environments, init scripts, background jobs, and containers explicitly set and export a UTF-8 locale such as LANG=C.UTF-8 and LC_ALL=C.UTF-8 before running Click CLI applications. Automated or headless environments defaulting to ASCII prevent clean Unicode input parsing, cause surrogate escape corruption, or trigger execution aborts.

```bash
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
python3 application.py
```
