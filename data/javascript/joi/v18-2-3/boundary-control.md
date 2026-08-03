# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: boundary control

## boundary control

### Enforce temporal boundary checks at data validation time

**Use when**

Validating incoming date and time payloads against relative thresholds and dynamic state transitions using Joi schemas.

**Secure rules**

**Rule 1: Validate relative temporal boundaries and field interdependencies using boundary methods and references.**

Ensure temporal security constraints are enforced by utilizing methods like `.greater()` or `.less()` combined with `'now'` or dynamic references via `Joi.ref()` to prevent invalid state transitions.

```javascript
const schema = Joi.object({
  startDate: Joi.date().greater('now').required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required()
});
```
