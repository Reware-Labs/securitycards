# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: input contract definition

## input contract definition

### Validate Resource Types and ACL Enum Attributes Before Submission

**Use when**

When building ACL bindings, filters, or administrative configuration requests in Kafka applications to ensure all resource types, pattern types, operations, and permission types are explicitly specified and validated before processing.

**Secure rules**

**Rule 1: Validate all resource types, pattern types, and ACL enum values against explicit enums to reject unknown or malformed inputs.**

Ensure that bindings, filters, and configuration definitions do not contain `UNKNOWN` enum attributes or unrecognized resource types. Explicitly check attributes such as `ResourceType`, `PatternType`, `AclOperation`, and `AclPermissionType` before passing them to controller managers or admin clients, rejecting any out-of-contract inputs with an `IllegalArgumentException`.

```java
if (binding.pattern().resourceType() == ResourceType.UNKNOWN ||
    binding.pattern().patternType() == PatternType.UNKNOWN ||
    binding.entry().operation() == AclOperation.UNKNOWN ||
    binding.entry().permissionType() == AclPermissionType.UNKNOWN) {
    throw new IllegalArgumentException("ACL binding contains UNKNOWN attributes");
}
```
