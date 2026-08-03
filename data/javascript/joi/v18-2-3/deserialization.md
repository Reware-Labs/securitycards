# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: deserialization

## deserialization

### Safely Validate and Cleanse Deserialized JSON Objects

**Use when**

Validating untrusted JSON payloads or parsed objects using `Joi.object()` schemas to protect against prototype pollution and mass assignment vulnerabilities.

**Secure rules**

**Rule 1: Use Joi.object() schemas to validate deserialized JSON objects and strip prototype key pollution vectors like __proto__.**

When handling untrusted deserialized data, pass the parsed object to a defined `Joi.object()` schema to ensure prototype keys are strictly denied and stripped from the validated output.

```javascript
const schema = Joi.object({
  name: Joi.string().required()
});
const payload = JSON.parse(untrustedJsonInput);
const { value, error } = schema.validate(payload);
if (!error) {
  // value is safe from __proto__ prototype pollution vectors
}
```

**Rule 2: Pass stripUnknown to schema validation to remove unvalidated properties from deserialized objects.**

Pass `{ stripUnknown: true }` during validation to automatically strip unvalidated properties and prevent mass assignment attacks when binding deserialized inputs to application models.

```javascript
const schema = Joi.object({
  itemName: Joi.string().required()
});
const { value, error } = schema.validate(deserializedPayload, { stripUnknown: true });
if (!error) {
  // value only includes fields explicitly defined in the schema
}
```
