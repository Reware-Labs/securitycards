# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: configuration source integrity

## configuration source integrity

### Map Environment Variables Explicitly Using Node-Config Mappings

**Use when**

Configuring application settings and environment variables in Feathers v5 applications where implicit automatic environment variable substitution is no longer supported by `@feathersjs/configuration`.

**Secure rules**

**Rule 1: Explicitly map environment variables using node-config mappings to ensure trusted and unambiguous configuration sources.**

Define configuration mappings explicitly using `config/custom-environment-variables.json` or the `NODE_CONFIG` environment variable to prevent applications from silently falling back to unencrypted or default values.

```json
{
  "port": "PORT",
  "authentication": {
    "secret": "AUTH_SECRET"
  }
}
```
