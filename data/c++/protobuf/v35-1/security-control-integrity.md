# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: security control integrity

## security control integrity

### Regenerate Outdated Protobuf Code and Enforce Strict Startup Failure

**Use when**

Compiling protocol buffer definitions and launching applications that consume generated message code to ensure that obsolete legacy gencode fails securely on startup.

**Secure rules**

**Rule 1: Fail closed during startup when obsolete generated code is detected by configuring explicit error flags.**

Protobuf runtime detects obsolete generated code calling `makeExtensionsImmutable()`, which can lead to denial of service vulnerabilities. Developers must recompile all `.proto` files using modern compiler versions and pass the system property `-Dcom.google.protobuf.error_on_unsafe_pre22_gencode=true` to fail explicitly rather than allowing vulnerable legacy code to execute.

```bash
java -Dcom.google.protobuf.error_on_unsafe_pre22_gencode=true -jar myapplication.jar
```
