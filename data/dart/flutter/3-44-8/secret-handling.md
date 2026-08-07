# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: secret handling

## secret handling

### Redact and filter sensitive tokens from logs and diagnostic outputs

**Use when**

When building logging mechanisms, handling subprocess execution outputs, or generating system diagnostic reports that might contain sensitive credentials or PII.

**Secure rules**

**Rule 1: Filter sensitive tokens and credentials from logs and exception messages**

Ensure logging mechanisms and custom subprocess wrappers filter sensitive tokens and credentials from exceptions, stdout, stderr, and trace messages by configuring custom filtering functions.

```dart
final stdio = VerboseStdio(
  stdin: stdIn,
  stdout: stdOut,
  stderr: stdErr,
  filter: (String msg) => msg.replaceAll(sensitiveToken, '[REDACTED]'),
);
```

**Rule 2: Strip PII from Diagnostic Logs and Telemetry Outputs**

When collecting system diagnostic logs or submitting environment telemetry, strip sensitive personal identifiable information such as local filesystem usernames and home directory paths using PII-redacted diagnosis channels.

```dart
final DoctorText doctorText = DoctorText(logger, doctor: doctor);
final String sanitizedReport = await doctorText.piiStrippedText;
```
