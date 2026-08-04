# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: input contract definition

## input contract definition

### Enforce valid enumerated values for policy options

**Use when**

When configuring cross-origin policy settings such as crossOriginOpenerPolicy to ensure allowed input values conform to explicit specifications.

**Secure rules**

**Rule 1: Provide exact lowercase policy strings to policy options to satisfy input contract validation.**

Ensure that settings like `crossOriginOpenerPolicy` receive only explicitly allowed lowercase policy strings such as 'same-origin', 'same-origin-allow-popups', 'noopener-allow-popups', or 'unsafe-none'. Passing invalid types, empty strings, or uppercase values results in runtime setup errors.

```typescript
import helmet from "helmet";

app.use(
  helmet.crossOriginOpenerPolicy({
    policy: "same-origin-allow-popups",
  })
);
```
