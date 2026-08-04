# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: security control integrity

## security control integrity

### Rely on Schema Immutability and Store Chained Instance Results

**Use when**

Building and configuring Joi validation schemas using method chaining.

**Secure rules**

**Rule 1: Store or return the result of chained Joi method calls to ensure validation constraints remain active.**

Joi schema chain methods do not mutate schema instances in place; they return new schema instances. Developers must store or return the result of chained method calls such as `.valid()`, `.required()`, or `.email()` to ensure validation constraints are active. Assuming that Joi schema methods mutate existing instances in place leaves schemas unconstrained, causing endpoints to accept invalid or malicious input.

```javascript
const baseSchema = Joi.string();

// Correct: store the newly created schema instance
const restrictedSchema = baseSchema.valid('admin', 'user');

// Incorrect (leaves baseSchema unconstrained):
// baseSchema.valid('admin', 'user');
```


### Secure custom validators and extension rules in Joi schemas

**Use when**

Building custom validation extensions, asynchronous hooks, or custom methods for Joi schemas.

**Secure rules**

**Rule 1: Execute asynchronous validation for custom external rules**

Always use `schema.validateAsync()` when schemas contain asynchronous custom validators registered via `any.external()`, as synchronous validation calls will either fail or skip critical checks when `externals: false` is configured.

```javascript
const schema = Joi.object({
  userId: Joi.string().external(async (value, helpers) => {
    const valid = await verifyUserExists(value);
    if (!valid) {
      throw new Error('User does not exist');
    }
    return value;
  })
});

const result = await schema.validateAsync(inputData);
```

**Rule 2: Safely handle errors inside custom schema validators**

Wrap custom validation logic inside `try-catch` blocks and use helper methods like `helpers.error()` or `helpers.message()` to signal validation failures rather than letting uncaught exceptions propagate.

```javascript
const schema = Joi.string().custom((value, helpers) => {
  try {
    const decoded = JSON.parse(value);
    if (!decoded.allowed) {
      return helpers.error('any.invalid');
    }
    return value;
  } catch (err) {
    return helpers.error('string.json');
  }
});
```

**Rule 3: Validate rule parameters inside custom extension methods**

Validate user-provided configuration arguments inside method implementations using `Joi.assert()` or explicit type checks before assigning flags or mutating custom schema state.

```javascript
const CustomJoi = Joi.extend({
  type: 'special',
  base: Joi.any(),
  rules: {
    customRule: {
      method(argName, refOption) {
        Joi.assert(argName, Joi.string());
        Joi.assert(refOption, Joi.object().ref().optional());
        return this.$_setFlag('customRuleData', { argName, refOption });
      }
    }
  }
});
```

**Rule 4: Apply standard schema constraints before custom validator callbacks**

Chain standard built-in Joi validation rules before custom external or custom validators so that execution halts on validation failure before invoking custom hooks.

```javascript
const schema = Joi.object({
  id: Joi.string().min(10).alphanum().external(async (value) => {
    return await externalServiceCheck(value);
  })
});

await schema.validateAsync({ id: 'valid123456' });
```

**Rule 5: Define error messages for all custom error codes in extensions**

Map every custom error code returned via `helpers.error()` to a message template in the extension's `messages` map to prevent unhandled runtime errors during validation.

```javascript
const CustomJoi = Joi.extend({
  type: 'special',
  base: Joi.string(),
  messages: {
    'special.hello': '{{#label}} must say hello'
  },
  rules: {
    hello: {
      validate(value, helpers) {
        if (!value.includes('hello')) {
          return helpers.error('special.hello');
        }
        return value;
      }
    }
  }
});
```

**Rule 6: Return standard error structures in custom schema extension validators**

Inspect schema rules and flags using official methods such as `schema.$_getRule()` and `schema.$_getFlag()`, and return standard result objects containing `{ value, errors }` via the error helper.

```javascript
const CustomJoi = Joi.extend({
    type: 'million',
    base: Joi.number(),
    messages: {
        'million.base': '{{#label}} must be at least a million'
    },
    coerce(value, { schema }) {
        if (schema.$_getRule('round')) {
            return { value: Math.round(value) };
        }
    },
    validate(value, { schema, error }) {
        if (value < 1000000) {
            return { value, errors: error('million.base') };
        }
    }
});
```
