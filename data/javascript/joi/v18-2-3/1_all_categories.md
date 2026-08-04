# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`

## Category: api contract misuse

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


## Category: boundary control

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


## Category: deserialization

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


## Category: input contract definition

### Construct and Validate Attribute-Based Models Securely Using Strict Schemas

**Use when**

Building, extending, and compiling attribute-based object models or dynamic validation schemas from untrusted inputs and custom type definitions.

**Secure rules**

**Rule 1: Disallow or strip unknown object attributes during model construction.**

When validating untrusted input to construct object models, enforce strict property controls by setting `allowUnknown` to `false` or enabling `stripUnknown`. Allowing arbitrary unknown keys into model structures enables mass assignment vulnerabilities.

```javascript
import Joi from 'joi';

const userModelSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required()
});

const { value, error } = userModelSchema.validate(untrustedInput, {
  allowUnknown: false,
  stripUnknown: true
});
```

**Rule 2: Compile raw attribute structures safely into formal validation models.**

When constructing validation schemas dynamically from attribute-based plain JavaScript objects, array specs, or literals, use `Joi.compile()` to safely cast raw object specifications into formal executable validation models. Ensure schema boundaries do not implicitly mix incompatible Joi schema instances across major dependency versions without intentional handling.

```javascript
const rawAttributeModel = {
  username: Joi.string().alphanum().min(3).max(30).required(),
  status: 'active'
};

const schema = Joi.compile(rawAttributeModel);
const { error, value } = schema.validate(userData);
```

**Rule 3: Construct object schemas only from plain object attribute definitions.**

When dynamically building object schemas from key-value definition structures, ensure that schema attributes are specified using plain JavaScript objects. Joi enforces strict prototype checks during schema compilation, rejecting non-plain objects to preserve schema integrity.

```javascript
const attributeDefinitions = {
  username: Joi.string().alphanum().min(3).required(),
  email: Joi.string().email().required()
};

const schema = Joi.compile(attributeDefinitions);
```

**Rule 4: Enforce strict type validation during model attribute construction.**

When constructing schemas for model attribute validation, call `.strict()` or configure `convert: false` preferences to disable automatic type coercion. Disabling implicit type conversion ensures that model attributes strictly match expected data types rather than coercing malformed or unexpected input into valid domain model values.

```javascript
const Joi = require('joi');

const userModelSchema = Joi.object({
    username: Joi.string().required(),
    age: Joi.number().integer().strict(),
    isActive: Joi.boolean().strict()
});
```

**Rule 5: Contextualize model schemas to prevent attribute injection.**

Use schema manipulation methods like `.fork()` or `.alter()` to adjust attribute presence controls (`required`, `optional`, or `forbidden`) based on application contexts such as model creation versus updates. Explicitly marking sensitive or read-only attributes as `forbidden()` in user-facing construction contexts prevents mass-assignment vulnerabilities.

```javascript
const Joi = require('joi');

const baseUserSchema = Joi.object({
    id: Joi.string().required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('user', 'admin').required()
});

const registrationSchema = baseUserSchema.fork(['id', 'role'], (schema) => schema.forbidden());
```

**Rule 6: Inherit base types explicitly when constructing custom model extensions.**

When creating custom extended validation models using `Joi.extend()`, explicitly specify a strict `base` schema (e.g. `Joi.string().min(2)` or `Joi.object()`) so basic type enforcement and constraints run before custom validation rules execute.

```javascript
const custom = Joi.extend({
    type: 'special',
    base: Joi.string().min(2),
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


### Enforce Strict Base Types and Element Validation for All Input Schemas

**Use when**

Building and validating incoming data schemas using `joi` to prevent type confusion, arbitrary input injection, and unvetted payload properties.

**Secure rules**

**Rule 1: Avoid generic untyped schemas and explicitly configure strict base types and unknown property rejection.**

Define specific schema types rather than generic `Joi.any()` schemas, and ensure object schema validation keeps `allowUnknown` as `false` to prevent unvetted payload properties and arbitrary types from being processed.

```javascript
const schema = Joi.object({
  username: Joi.string().required()
});

const { error, value } = schema.validate(input, { allowUnknown: false });
```

**Rule 2: Enforce explicit string and type constraints to block unexpected non-string primitives.**

Enforce explicit type boundaries using `Joi.string()` to prevent untrusted payloads from supplying arbitrary non-string types such as booleans, numbers, or null into string processing paths.

```javascript
const schema = Joi.object({
  username: Joi.string().min(3).required(),
  bio: Joi.string().allow('').max(500)
});
```

**Rule 3: Enforce strict element schemas on arrays to reject arbitrary input types.**

Call `.items()` with specific `Joi` schemas on array definitions to ensure every element is validated against allowed types, preventing arbitrary objects or unexpected primitives from bypassing validation.

```javascript
const schema = Joi.array().items(Joi.string(), Joi.number());
const { value, error } = schema.validate(['allowedString', 42]);
```

**Rule 4: Restrict polymorphic inputs using explicit schema alternatives.**

When handling fields that accept multiple data types, define an explicit list of allowed schemas using `Joi.alternatives()` or array schema notation to reject any arbitrary types falling outside the configured set.

```javascript
const schema = Joi.object({
  auth: Joi.alternatives([
    Joi.object({
      mode: Joi.string().valid('required', 'optional', 'try').allow(null)
    }).allow(null),
    Joi.string(),
    Joi.boolean()
  ])
});

const { error, value } = schema.validate(input);
```

**Rule 5: Enforce strict object schemas and specific class instances to block arbitrary object types.**

Use `Joi.object().instance(Constructor)` when validating JavaScript object inputs that must belong to a specific class or constructor to ensure arbitrary object types or incompatible instances are rejected.

```javascript
const Joi = require('joi');

class UserProfile {
    constructor(name) {
        this.name = name;
    }
}

const schema = Joi.object().instance(UserProfile);
const result = schema.validate(new UserProfile('Alice'));
```

**Rule 6: Enforce strict date validation to reject non-finite numbers and booleans.**

Validate date fields using `Joi.date()` and explicitly disable implicit type conversion using `.prefs({ convert: false })` when strict type boundaries are required to prevent type confusion.

```javascript
const Joi = require('joi');

const strictSchema = Joi.date().prefs({ convert: false });
```


### Enforce Strict Input Contracts and Type Boundaries Using Joi Schemas

**Use when**

Validating incoming request payloads, form data, or external data structures to ensure they adhere to strict input contracts before application processing.

**Secure rules**

**Rule 1: Explicitly allow empty strings when empty inputs are valid.**

By default, `Joi.string()` rejects empty strings. When empty string values are acceptable inputs, developers must explicitly allow them using `.allow('')` rather than assuming empty strings will pass string validation.

```javascript
const schema = Joi.object({
  username: Joi.string().min(3).required(),
  bio: Joi.string().allow('').max(500)
});
```

**Rule 2: Enforce strict array element types and forbidden item constraints.**

Define explicit element schemas using `Joi.array().items()` and enforce negative constraints on array elements using `Joi.schema().forbidden()` to prevent unvalidated or unauthorized array elements from passing schema validation.

```javascript
const schema = Joi.array().items(
  Joi.string().valid('admin').forbidden(),
  Joi.string()
);

const { value, error } = schema.validate(['user', 'guest']);
```

**Rule 3: Enforce explicit CIDR constraints on IP address schemas.**

When defining IP address schemas with `Joi.string().ip()`, explicitly set the `cidr` option to 'forbidden', 'required', or 'optional' to strictly constrain allowed network formats.

```javascript
const hostIpSchema = Joi.string().ip({
  version: ['ipv4', 'ipv6'],
  cidr: 'forbidden'
});

const subnetSchema = Joi.string().ip({
  version: ['ipv4'],
  cidr: 'required'
});
```

**Rule 4: Use Joi.override to safely reset permitted values.**

When extending or refining base schemas, calling `.allow()` appends new values to the existing whitelist by default. To replace previously permitted values or remove unwanted baseline defaults, pass `Joi.override` as the first argument to `.allow()`.

```javascript
const baseSchema = Joi.object().allow('legacy-bypass');

const strictSchema = baseSchema.allow(Joi.override, 'prod-token');
```

**Rule 5: Define polymorphic contracts explicitly with conditional schemas.**

When validating polymorphic data structures with `Joi.alternatives()` or `.conditional()`, ensure all expected branches explicitly define input schemas and valid references to prevent runtime errors or insecure handling of dynamic payload types.

```javascript
const schema = Joi.object({
  type: Joi.string().valid('user', 'admin').required(),
  profile: Joi.alternatives().conditional('type', {
    is: 'admin',
    then: Joi.object({ adminRole: Joi.string().required() }),
    otherwise: Joi.object({ userRole: Joi.string().required() })
  })
});
```

**Rule 6: Explicitly define custom truthy and falsy input values.**

By default, `Joi.boolean()` rejects common web/form boolean string representations. When parsing inputs from form submissions or non-standard external interfaces, explicitly declare acceptable non-boolean representations using `.truthy()` and `.falsy()` rather than disabling validation.

```javascript
const Joi = require('joi');

const schema = Joi.boolean()
  .truthy('yes', '1', 'on')
  .falsy('no', '0', 'off');

const { value } = schema.validate('on');
```

**Rule 7: Validate ES6 class constructors with Joi class schema.**

Use `Joi.function().class()` when a configuration or API specifically expects an ES6 class constructor rather than a standard callable function to prevent runtime type errors or unexpected execution behavior.

```javascript
const schema = Joi.object({
  HandlerClass: Joi.function().class().required()
});
```

**Rule 8: Enforce strict number validation to prevent boolean type confusion.**

Use `Joi.number()` to strictly validate numeric input without implicit boolean coercion. Joi rejects `true` and `false` values for numeric schemas, preventing type-confusion bugs.

```javascript
const schema = Joi.object({
  quantity: Joi.number().integer().min(1).required()
});

const { error, value } = schema.validate({ quantity: true });
```


### Enforce strict object property validation and prevent mass assignment

**Use when**

Validating untrusted object payloads prior to database storage or internal variable assignment to prevent unauthorized property injection.

**Secure rules**

**Rule 1: Disallow unknown keys and strip unvalidated properties during validation**

Ensure that `allowUnknown` is set to `false` (the default) or explicitly set `stripUnknown` to `true` to prevent unvetted input fields from passing through validation to downstream assignment operations.

```javascript
const { value, error } = schema.validate(input, {
  allowUnknown: false,
  stripUnknown: true
});
```

**Rule 2: Configure explicit presence constraints for required assignment fields**

Use the `presence` option set to `'required'` or `'forbidden'` on validation options to ensure missing or unexpectedly present keys do not bypass assignment validation checks.

```javascript
const { value, error } = schema.validate(input, {
  presence: 'required'
});
```

**Rule 3: Disable implicit type coercion and enforce strict data types**

Chain `.strict()` or set `{ convert: false }` via schema preferences to ensure assigned inputs conform strictly to declared data types rather than undergoing automatic type coercion.

```javascript
const schema = Joi.object({
  age: Joi.number().strict(),
  isActive: Joi.boolean().strict()
});
const { value, error } = schema.validate(input);
```

**Rule 4: Restrict property assignment using valid values and forbidden fields**

Use `.valid(...values)` to enforce strict whitelists of acceptable values for assigned fields, and use `.forbidden()` to explicitly block unauthorized attribute modifications.

```javascript
const updateProfileSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive'),
  role: Joi.forbidden()
});
const { value, error } = updateProfileSchema.validate(input);
```


### Strictly Validate and Filter Unknown Fields in Object and Array Schemas

**Use when**

Defining object and array input schemas in `joi` to process untrusted payloads safely and prevent unvalidated properties or elements from reaching internal functions.

**Secure rules**

**Rule 1: Reject or explicitly strip unknown keys on object schemas to prevent mass assignment and unauthorized data processing.**

Avoid using bare `Joi.object()` without key definitions on untrusted inputs because empty object schemas permit arbitrary unknown keys. Instead, explicitly define object schemas to reject unknown fields by default or configure `stripUnknown: true` in validation options to remove unvalidated properties.

```javascript
const schema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required()
});

const { error, value } = schema.validate(req.body);
const { value: cleanData } = schema.validate(req.body, { stripUnknown: true });
```

**Rule 2: Configure explicit array strip options to safely filter out non-matching elements from untrusted array inputs.**

When validating arrays using `Joi.array().items()`, passing a simple boolean `stripUnknown: true` preference does not automatically discard non-matching elements and instead causes validation to fail. Set `stripUnknown: { arrays: true }` in the preferences to correctly filter out unknown or unexpected array items.

```javascript
const schema = Joi.array()
  .items(Joi.number(), Joi.string())
  .prefs({ stripUnknown: { arrays: true } });

const { value } = schema.validate([1, { unknown: 'object' }, 'a']);
```


### Validate Complex Nested Models and Arrays with Explicit Schemas and Path References

**Use when**

Building schemas for structured, nested, or hierarchical data payloads where validation requires precise type definitions, unknown property rejection, and inter-field dependency checks across object levels.

**Secure rules**

**Rule 1: Define explicit nested structures and restrict unknown fields to prevent malformed payloads and injection vectors.**

Explicitly compose nested schemas using `Joi.object()` and `Joi.array().items()`, setting rules like `.required()` on mandatory nested fields. Use options such as `allowUnknown: false` and `stripUnknown: { objects: true, arrays: true }` to reject or strip unexpected properties and enforce strict schema bounds.

```javascript
const schema = Joi.object({
  user: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required()
  })
});

const { value, error } = schema.validate(payload, {
  allowUnknown: false,
  stripUnknown: { objects: true, arrays: true }
});
```

**Rule 2: Enforce inter-field dependencies across parent and nested schemas using validated relative path references.**

Use relative path references such as `Joi.ref('...parentField')` or `Joi.ref('..0')` within nested array items or child objects to validate dependencies against upper hierarchy levels. Ensure relative references stay within the bounds of the schema hierarchy to prevent runtime exceptions.

```javascript
const schema = Joi.object({
  limit: Joi.number().required(),
  list: Joi.array().items(
    Joi.object({
      score: Joi.number().max(Joi.ref('...limit')).required()
    })
  )
});

const { value, error } = schema.validate(inputData);
```

**Rule 3: Use asynchronous validation for nested models containing external validation rules.**

When defining nested object models that include custom asynchronous verification rules using `.external()`, always perform validation using `validateAsync()` rather than synchronous validation methods to prevent runtime errors.

```javascript
const schema = Joi.object({
  user: Joi.object({
    id: Joi.string().external(async (value, helpers) => {
      const exists = await db.checkUserExists(value);
      if (!exists) {
        throw new Error('User ID does not exist');
      }
      return value;
    })
  })
});

const validated = await schema.validateAsync(payload);
```

**Rule 4: Manage nested schema variations immutably using explicit IDs and forks.**

Assign explicit IDs using `.id('identifier')` to target sub-schemas contained within complex structures, and use `schema.fork()` with property paths to adjust validation requirements contextually without mutating shared base schemas.

```javascript
const itemSchema = Joi.object({
    id: Joi.string().required()
}).id('item');

const listSchema = Joi.array().items(itemSchema);

const strictListSchema = listSchema.fork('item', (schema) => schema.append({
    quantity: Joi.number().min(1).required()
}));
```


### Validate and Restrict Schema Default Values

**Use when**

Defining schema default values and processing inputs where automatic default substitution must be explicitly controlled or disabled.

**Secure rules**

**Rule 1: Disable schema defaults when validation must not add missing values**

Joi applies a schema default when the original value is `undefined`. Pass `noDefaults: true` to `validate()` when the validated result must preserve missing values instead of populating them from schema defaults.

```javascript
const Joi = require('joi');

const schema = Joi.object({
    role: Joi.string().valid('user', 'admin').default('user')
});

const inputData = {};
const { value, error } = schema.validate(inputData, { noDefaults: true });
```


## Category: input interpretation safety

### Enforce Strict Type Checking and Input Conversion Settings

**Use when**

Validating untrusted input where exact types and unambiguous string interpretations are security-critical.

**Secure rules**

**Rule 1: Disable implicit type casting on schemas to prevent unexpected data coercion.**

By default, `joi` attempts to coerce input types to match schema definitions. When validating untrusted input where exact types are security-critical, call `.strict()` on the schema or configure `{ convert: false }` in validation preferences to disable implicit type casting.

```javascript
const Joi = require('joi');

const schema = Joi.object({
    userId: Joi.number().strict()
});

const { error, value } = schema.validate({ userId: '123' });
```

**Rule 2: Disable input conversion for strict symbol mapping to prevent untrusted key execution.**

When using `Joi.symbol().map()` to convert string or numeric input keys into internal Symbol instances, recognize that `joi` automatically coerces matching keys by default. To prevent untrusted string inputs from being translated into internal application Symbols, explicitly configure schema preferences with `convert` set to `false`.

```javascript
const PRIVILEGED_SYMBOL = Symbol('PRIVILEGED');

const symbolSchema = Joi.symbol()
  .map(new Map([['admin_key', PRIVILEGED_SYMBOL]]))
  .prefs({ convert: false });

const { error, value } = symbolSchema.validate('admin_key');
```


### Manage Object Key Aliasing and Renaming Explicitly

**Use when**

Renaming or aliasing object properties during schema validation to ensure unambiguous and canonical data interpretation.

**Secure rules**

**Rule 1: Configure explicit alias options when renaming keys to prevent parameter ambiguity and unexpected data loss.**

When using `.rename(from, to, options)`, `joi` defaults to removing the source property key. Explicitly set `alias: true` in the rename options if downstream handlers require preserving the original property key alongside the renamed key, or leave it as false to eliminate legacy keys.

```typescript
import Joi from 'joi';

const schema = Joi.object({
  userId: Joi.string().required(),
  user_id: Joi.string()
}).rename('user_id', 'userId', { alias: true, override: true });
```

**Rule 2: Isolate property alias transformations within schema alternative branches.**

Ensure that key renaming operations inside schema alternatives are scoped safely. `joi` guarantees that key renaming side effects from a failed schema branch are discarded and not applied to subsequent alternative evaluations.

```javascript
const schema = Joi.object({
  a: Joi.alternatives([
    Joi.object({ c: Joi.any(), d: Joi.number() }).rename('b', 'c'),
    Joi.object({ b: Joi.any(), d: Joi.string() })
   الموضوع
});
```


### Prevent Prototype Pollution by Validating Untrusted Objects with Joi Schemas

**Use when**

Parsing and validating untrusted input objects and JSON payloads to ensure prototype properties like `__proto__` are securely stripped or rejected.

**Secure rules**

**Rule 1: Pass untrusted input objects through `Joi.object()` schemas to safely strip or ignore injected `__proto__` properties.**

When handling untrusted data, always run parsed input through explicit Joi object schemas using `schema.validate()` so that internal prototype properties and injected prototype pollution vectors are not preserved in validated output objects.

```javascript
const Joi = require('joi');

const schema = Joi.object({
  name: Joi.string().required()
});

const payload = JSON.parse(untrustedInput);
const { value, error } = schema.validate(payload);
if (!error) {
  // value is safely validated and Object.prototype is preserved
}
```

**Rule 2: Enforce strict key boundaries and disallow unknown keys on object validation schemas.**

Explicitly specify expected properties using `.keys()` and strictly enforce boundaries with `.unknown(false)` to prevent unvalidated properties such as `__proto__` or `constructor` from persisting in validated output objects.

```javascript
const Joi = require('joi');

const userSchema = Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string().email().required()
}).unknown(false);
```


## Category: output encoding

### Enable HTML escaping for validation error messages and templates

**Use when**

Rendering Joi validation error messages or dynamic templates in HTML user interfaces where user-supplied input may be present.

**Secure rules**

**Rule 1: Set errors.escapeHtml to true when validating inputs to ensure error messages containing user input are safely HTML-escaped.**

By default, `escapeHtml` is `false`. When validation error messages containing user-supplied input are rendered directly into HTML without escaping, malicious input can lead to Cross-Site Scripting (XSS) vulnerabilities. Configure `errors.escapeHtml` to `true` within the `validate` options.

```javascript
const schema = Joi.object({
  username: Joi.string().alphanum().min(3)
});

const { error, value } = schema.validate(req.body, {
  errors: {
    escapeHtml: true
  }
});
```


## Category: resource exhaustion

### Limit recursive link schema depth

**Use when**

Defining recursive validation schemas using Joi.link() to validate nested object hierarchies.

**Secure rules**

**Rule 1: Configure maxRecursion on recursive link schemas to prevent excessive stack allocation and CPU consumption.**

When defining recursive schemas using `Joi.link()`, always configure `maxRecursion()` to explicitly limit the depth of nested object validation and protect against Denial of Service conditions.

```javascript
const schema = Joi.object({
    name: Joi.string().required(),
    children: Joi.array().items(
        Joi.link('...').maxRecursion(5)
    )
});
```


## Category: security control integrity

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
