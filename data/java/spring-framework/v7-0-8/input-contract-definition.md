# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: input contract definition

## input contract definition

### Enforce Deep Bean Validation and Cascading Checks Across Complex Structures

**Use when**

When developers need to enforce Jakarta Bean Validation rules, nested object checks, and container element constraints across services, domain objects, and message payloads.

**Secure rules**

**Rule 1: Annotate nested objects and collection elements with @Valid to enforce deep structural validation.**

When validating domain objects or method arguments, ensure that nested structures and container elements (such as `List` or `Map`) are explicitly annotated with `@Valid` on the field declaration to prevent container element constraints from being bypassed.

```java
public class UserDTO {
    @Valid
    private List<@NotNull String> roles;

    @Valid
    private Map<@NotNull String, @NotNull String> attributes;
}
```

**Rule 2: Configure method-level validation on service classes and components using @Validated.**

Use class-level `@Validated` annotations and constraint annotations on method parameters and return types to ensure parameters strictly conform to Jakarta Validation constraints before core business logic executes.

```java
@Service
@Validated
public class AccountService {
    public Account createAccount(@NotNull @Valid AccountDto accountDto) {
        return repository.save(accountDto);
    }
}
```

**Rule 3: Pass explicit validation group classes as validation hints to SmartValidator.**

When using `SmartValidator` or validating with hints, pass explicit Jakarta Validation group classes as validation hints to ensure group-specific security and operational constraints are fully enforced.

```java
// Safe: Pass validation group Class types as validation hints
validator.validate(userDto, bindingResult, OnUpdateGroup.class, AdminGroup.class);
```


### Enforce Input Boundaries and Type Validation on Controller Parameters

**Use when**

When developers are implementing Spring MVC or WebFlux controllers and need to enforce required parameters, expected types, and constraints on incoming request bindings.

**Secure rules**

**Rule 1: Validate request parameters and path variables using explicit Java types and annotation constraints.**

Use annotations like `@RequestParam`, `@PathVariable`, and explicit types on controller method parameters to enforce input boundaries. Spring automatically validates required parameters and performs strong type conversion, returning HTTP 400 Bad Request when validation fails.

```java
@RestController
public class UserAccountController {

    @GetMapping("/account")
    public ResponseEntity<String> getAccount(@RequestParam(name = "id", required = true) Long id) {
        // Executed only if 'id' parameter is present and parseable as Long
        return ResponseEntity.ok("Account: " + id);
    }
}
```

**Rule 2: Inspect binding errors explicitly when Errors or BindingResult parameters are declared.**

When an `Errors` or `BindingResult` parameter is declared immediately following a validated argument, Spring does not automatically throw validation exceptions. Controllers must explicitly inspect `errors.hasErrors()` and handle validation failures before processing input.

```java
@PostMapping("/person")
public ResponseEntity<String> handlePerson(@Valid @ModelAttribute Person person, Errors errors) {
    if (errors.hasErrors()) {
        return ResponseEntity.badRequest().body("Validation failed");
    }
    return ResponseEntity.ok("Processed successfully");
}
```

**Rule 3: Disable model binding to mitigate mass assignment vulnerabilities on model attributes.**

Set `@ModelAttribute(binding = false)` on parameters that should not be populated directly from untrusted request data. This disables automatic parameter binding from form or query data while still allowing Spring to resolve the object and apply validation checks via `@Validated`.

```java
@PostMapping("/update")
public Mono<String> handleUser(
    @ModelAttribute(binding = false) @Validated UserProfile profile,
    BindingResult bindingResult) {
    if (bindingResult.hasErrors()) {
        return Mono.just("errorView");
    }
    return userService.save(profile).thenReturn("successView");
}
```


### Restrict DataBinder Property Binding and Prevent Unrestricted Mass Assignment

**Use when**

When configuring property binding settings or data binders to restrict which object properties can be modified via HTTP request parameters.

**Secure rules**

**Rule 1: Configure DataBinder with allowed fields or declarative binding to restrict property modification.**

Configure `DataBinder` with explicit allowed fields or enable declarative binding to prevent mass assignment vulnerabilities where incoming parameters modify unintended model properties.

```java
DataBinder binder = new DataBinder(target);
binder.setAllowedFields("firstName", "lastName", "email");
// Or enable declarative binding to restrict to explicit constructor/allowed fields:
binder.setDeclarativeBinding(true);
binder.bind(propertyValues);
```
