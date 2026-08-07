# Security cards

Repository: `https://github.com/keycloak/keycloak#26.7.0`
Category: configuration source integrity

## configuration source integrity

### Validate configuration attribute integrity during realm import

**Use when**

When importing realm representations programmatically and configuring settings such as brute force protection attributes to ensure configuration integrity and prevent validation failures.

**Secure rules**

**Rule 1: Ensure brute force protection configuration attributes are set to non-negative integers during programmatic realm representation configuration.**

Verify that all configuration attributes like `maxTemporaryLockouts`, `maxFailureWaitSeconds`, `waitIncrementSeconds`, and `failureFactor` contain valid non-negative integer values before executing realm import operations to maintain configuration source integrity and prevent validation exceptions.

```java
RealmRepresentation rep = new RealmRepresentation();
rep.setBruteForceProtected(true);
rep.setMaxTemporaryLockouts(5);
rep.setMaxFailureWaitSeconds(900);
rep.setWaitIncrementSeconds(60);
rep.setFailureFactor(5);
```

**Rule 2: Keep the failure reset time greater than the maximum temporary lockout wait**

When configuring temporary brute-force lockouts, set Failure Reset Time greater than Max Wait. Otherwise, the failure counter resets before the lockout duration can reach the configured maximum wait.
