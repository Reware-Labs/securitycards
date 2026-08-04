# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: input contract definition

## input contract definition

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
