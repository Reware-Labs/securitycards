# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: deserialization

## deserialization

### Prevent Binary Deserialization Vulnerabilities by Replacing Default Serialized Mappings with Safe Converters

**Use when**

Mapping basic attributes whose Java types implement `java.io.Serializable` inside Hibernate domain entities.

**Secure rules**

**Rule 1: Avoid relying on default Java binary serialization fallback for basic attributes and use explicit safe converters.**

When mapping basic attributes that implement `java.io.Serializable`, do not rely on Hibernate's default binary serialization fallback to read database records. Instead, explicitly implement an `AttributeConverter` or custom `UserType` to serialize object state safely into standard text formats like JSON.

```java
@Converter
public class UserPreferencesConverter implements AttributeConverter<UserPreferences, String> {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(UserPreferences attribute) {
        if (attribute == null) return null;
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to serialize preferences", e);
        }
    }

    @Override
    public UserPreferences convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            return MAPPER.readValue(dbData, UserPreferences.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to deserialize preferences", e);
        }
    }
}
```
