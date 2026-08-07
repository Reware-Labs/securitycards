# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: escape hatch

## escape hatch

### Restrict Validation Failure Callback Overrides and Restrict Unsafe Scoped Flag Usage

**Use when**

Configuring or testing rendering validation error handlers and error suppression mechanisms in low-level graphics subsystems.

**Secure rules**

**Rule 1: Avoid returning true unconditionally from custom validation failure callbacks to prevent suppressing rendering errors.**

Do not return true unconditionally from validation failure callbacks registered with `ImpellerValidationErrorsSetCallback`, as this bypasses default error handling and process termination. Restrict the override strictly to targeted tests and handle expected error messages explicitly while failing fast on unexpected states.

```cpp
impeller::ImpellerValidationErrorsSetCallback([](const char* message, const char* file, int line) {
  if (std::string(message).find("Expected test error") != std::string::npos) {
    return true;
  }
  return false;
});
```
