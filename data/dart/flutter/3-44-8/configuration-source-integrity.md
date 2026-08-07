# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: configuration source integrity

## configuration source integrity

### Validate upstream repository and mirror URLs from trusted sources

**Use when**

Configuring custom repository mirrors, SDK download locations, or storage endpoints for Flutter and Dart packages.

**Secure rules**

**Rule 1: Ensure all custom host mirror URLs and environment overrides use fully qualified HTTPS URIs and valid TLS configurations.**

When redirecting SDK or package downloads using environment variables such as `PUB_HOSTED_URL`, `FLUTTER_STORAGE_BASE_URL`, or `FLUTTER_GIT_URL`, verify that the endpoints are trusted and properly formatted. Running `flutter doctor` helps verify mirror integrity and catch validation errors.

```bash
export PUB_HOSTED_URL="https://internal-mirror.example.com/pub"
export FLUTTER_STORAGE_BASE_URL="https://internal-mirror.example.com/flutter"
export FLUTTER_GIT_URL="https://internal-mirror.example.com/flutter.git"
flutter doctor
```
