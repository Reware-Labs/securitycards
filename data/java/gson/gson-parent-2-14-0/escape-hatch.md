# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: escape hatch

## escape hatch

### Disable JDK Unsafe Fallback and Provide Explicit Zero-Argument Constructors for Custom Adapters

**Use when**

When defining custom type adapters using `jsonAdapter` annotations or registering type adapter instances that require instantiation without relying on low-level JVM unsafe mechanisms.

**Secure rules**

**Rule 1: Define an explicit zero-argument constructor in custom type adapter classes and configure Gson to disable the JDK Unsafe fallback mechanism.**

Explicitly implement a zero-argument constructor within custom adapter classes to ensure proper object initialization and prevent bypassing security checks. Additionally, harden the Gson instance configuration by calling `disableJdkUnsafe()` through the `GsonBuilder` to restrict raw or low-level instantiation APIs.

```java
public class UserAdapter extends TypeAdapter<User> {
  public UserAdapter() {
    // Explicit constructor initialization
  }

  @Override
  public void write(JsonWriter out, User user) throws IOException {
    // Implementation
  }

  @Override
  public User read(JsonReader in) throws IOException {
    // Implementation
    return null;
  }
}

// Hardening Gson configuration
Gson gson = new GsonBuilder()
    .disableJdkUnsafe()
    .create();
```
