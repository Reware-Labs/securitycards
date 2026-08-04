# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: runtime environment hardening

## runtime environment hardening

### Configure Explicit Home and XDG Environment Variables for Production Runtime Storage

**Use when**

Deploying Caddy as a system service or container manifest in production environments to ensure runtime storage resolves to secure absolute paths instead of falling back to working directories.

**Secure rules**

**Rule 1: Explicitly define standard home and application data environment variables in deployment service files prior to execution.**

Set environment variables such as HOME, USERPROFILE, XDG_DATA_HOME, XDG_CONFIG_HOME, and XDG_CACHE_HOME explicitly in systemd service definitions or container configurations. This prevents Caddy from falling back to storing sensitive cryptographic assets, private TLS keys, and internal state in a relative `./caddy` folder within the current working directory.

```ini
[Service]
Environment=HOME=/var/lib/caddy
Environment=XDG_DATA_HOME=/var/lib/caddy/.local/share
ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile
```
