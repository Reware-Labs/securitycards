# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: api contract misuse

## api contract misuse

### Validate Form State Before Saving Inputs

**Use when**

When building forms in Flutter and processing user inputs prior to saving or submission.

**Secure rules**

**Rule 1: Explicitly invoke and verify FormState.validate() before triggering FormState.save().**

Because calling `FormState.save()` invokes `onSaved` callbacks without executing `FormField` validators or confirming input correctness, developers must explicitly call `FormState.validate()` and confirm it returns true before triggering `FormState.save()` or using field inputs in application logic.

```dart
final formKey = GlobalKey<FormState>();

void submitForm() {
  if (formKey.currentState?.validate() ?? false) {
    formKey.currentState?.save();
    // Send or process validated fieldValue
  }
}
```
