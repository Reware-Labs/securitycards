# Security cards

Repository: `https://github.com/handlebars-lang/handlebars.js#v4.7.9`
Category: access control

## access control

### Restrict prototype access options during template compilation and rendering

**Use when**

Rendering templates with context objects where prototype properties and methods must be restricted to prevent unauthorized access or prototype pollution.

**Secure rules**

**Rule 1: Keep prototype access restrictions enabled during template execution and explicitly whitelist individual properties if required.**

Ensure that `allowProtoMethodsByDefault` and `allowProtoPropertiesByDefault` are set to `false` in the runtime options when rendering templates, and explicitly whitelist only approved properties.

```javascript
const template = Handlebars.compile(templateSource);
const result = template(context, {
  allowProtoMethodsByDefault: false,
  allowProtoPropertiesByDefault: false,
  allowedProtoProperties: {
    allowedProperty: true
  }
});
```
