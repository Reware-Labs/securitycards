# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: input contract definition

## input contract definition

### Explicitly map JSON properties using SerializedName to define strict input contracts

**Use when**

When defining Java classes that will be populated via JSON deserialization and you need to enforce strict field contracts and allowed input keys.

**Secure rules**

**Rule 1: Bind Java fields explicitly to expected JSON keys using @SerializedName and specify allowed aliases via the alternate element.**

Use `@SerializedName` to explicitly bind Java fields to expected JSON keys rather than relying on field naming reflection or dynamic field naming policies. When accepting legacy or alternative keys during deserialization, use the alternate element to specify allowed aliases explicitly.

```java
public class UserProfile {
  @SerializedName(value = "user_id", alternate = {"userId", "id"})
  private String userId;

  @SerializedName("email_address")
  private String email;

  public UserProfile(String userId, String email) {
    this.userId = userId;
    this.email = email;
  }
}
```
