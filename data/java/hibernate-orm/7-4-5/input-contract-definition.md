# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: input contract definition

## input contract definition

### Enforce entity input validation and constraints using Jakarta Bean Validation

**Use when**

When defining entity models and persistence lifecycle operations to ensure input data matches required constraints, allowed types, and length limits.

**Secure rules**

**Rule 1: Apply Jakarta Bean Validation constraints and configure validation groups to validate entity inputs before database persistence.**

Use standard Jakarta Validation annotations such as `NotNull`, `Size`, `Min`, `Max`, `Email`, and `NotEmpty` on entity attributes. Configure validation operation groups in persistence settings to ensure validation executes during pre-persist and pre-update events.

```java
@Entity
public class UserAccount {
    @NotNull
    @Size(min = 3, max = 50)
    private String username;

    @NotNull
    @Email
    private String email;
}
```
