# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: input contract definition

## input contract definition

### Validate incoming request payloads with RequestValidation and StatusPages

**Use when**

When validating incoming request bodies and handling malformed input data in Ktor applications.

**Secure rules**

**Rule 1: Configure Ktor request validation rules to reject malformed input payloads before application processing.**

Install the `RequestValidation` plugin and define rules using `validate<T>` or filter blocks to enforce strict input boundaries and type constraints. Pair this with `StatusPages` to catch `RequestValidationException` and return an appropriate HTTP error response.

```kotlin
install(RequestValidation) {
    validate<String> { body ->
        if (!body.startsWith("+")) {
            ValidationResult.Invalid("String must start with '+'")
        } else {
            ValidationResult.Valid
        }
    }
}
install(StatusPages) {
    exception<RequestValidationException> { call, cause ->
        call.respond(HttpStatusCode.BadRequest, cause.reasons.joinToString(", "))
    }
}
```
