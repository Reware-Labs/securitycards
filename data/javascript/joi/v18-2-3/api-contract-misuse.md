# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: api contract misuse

## api contract misuse

### Avoid referencing unsupported API signatures and environment-specific methods

**Use when**

Developing data validation logic across different execution environments where specific library methods may be undefined or unsupported.

**Secure rules**

**Rule 1: Verify API support and avoid calling undefined methods in environment-restricted runtimes.**

Ensure that methods such as `Joi.binary()` are not invoked in browser environments where they are undefined, preventing runtime exceptions that could break validation controls.

```javascript
const browserSchema = Joi.string().base64().required();

const { error, value } = browserSchema.validate(clientPayload);
if (error) {
    // Handle validation failure safely
}
```
