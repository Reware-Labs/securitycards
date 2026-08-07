# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: input contract definition

## input contract definition

### Validate Android build numbers against integer and store limits

**Use when**

Configuring Android build settings and supplying build numbers in Flutter tooling.

**Secure rules**

**Rule 1: Ensure that buildNumber inputs are validated as positive integers within allowed store limits before processing.**

Constrain build number inputs to positive integers within the allowed range prior to invoking build tooling to prevent build exits and disrupted CI/CD pipelines.

```dart
const BuildInfo buildInfo = BuildInfo(
  BuildMode.release,
  '',
  treeShakeIcons: false,
  buildNumber: '42',
  packageConfigPath: '.dart_tool/package_config.json',
);
```


### Validate Untrusted Form Field Input Using Validator Properties

**Use when**

Handling untrusted user input via `TextFormField` or `FormField` components before saving or processing form state.

**Secure rules**

**Rule 1: Define input validation contracts on form fields and invoke state validation prior to saving.**

Attach a validator function to `TextFormField` props to check input constraints and ensure `FormState.validate()` is called before invoking `FormState.save()`.

```dart
final formKey = GlobalKey<FormState>();
Form(
  key: formKey,
  child: TextFormField(
    validator: (String? value) {
      if (value == null || value.isEmpty) {
        return 'Input required';
      }
      return null;
    },
    onSaved: (String? value) {
      // Process validated value
    },
  ),
);

if (formKey.currentState!.validate()) {
  formKey.currentState!.save();
}
```
