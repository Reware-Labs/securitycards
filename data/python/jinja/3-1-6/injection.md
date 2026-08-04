# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: injection

## injection

### Validate dictionary keys for safe HTML attribute rendering

**Use when**

Rendering dynamic HTML or XML attributes using the `xmlattr` filter in templates to prevent attribute injection.

**Secure rules**

**Rule 1: Ensure dictionary keys passed to the xmlattr filter contain only valid attribute names without invalid characters.**

Pass trusted key names in dictionary objects when rendering HTML attributes via `xmlattr` to prevent unexpected template execution errors and protect against attribute injection attacks.
