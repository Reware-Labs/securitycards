# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: api contract misuse

## api contract misuse

### Validate Target Types and Pass Binding-Capable Errors When Invoking Spring Validators

**Use when**

When validating target objects, invoking validators programmatically, or handling complex nested property paths using Spring validation utilities.

**Secure rules**

**Rule 1: Verify target object support explicitly before invoking validation utilities.**

Check that the target object matches the target class supported by the validator using `validator.supports(target.getClass())` prior to invoking `ValidationUtils.invokeValidator` to prevent runtime `IllegalArgumentException` failures.

```java
if (validator.supports(target.getClass())) {
    ValidationUtils.invokeValidator(validator, target, errors, validationHints);
}
```

**Rule 2: Pass a binding-capable errors implementation when validating nested property paths.**

Avoid using `Validator.validateObject` for complex target objects with nested properties because its default `SimpleErrors` implementation does not support nested paths. Instead, pass a binding-capable `Errors` implementation such as `BeanPropertyBindingResult` to the `validate(Object, Errors)` method.

```java
BeanPropertyBindingResult errors = new BeanPropertyBindingResult(formObject, "formObject");
validator.validate(formObject, errors);
if (errors.hasErrors()) {
    throw new IllegalArgumentException("Validation failed for target: " + errors.getAllErrors());
}
```
