# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: deserialization

## deserialization

### Enforce strict class allowlisting during custom credential deserialization

**Use when**

Configuring custom row mappers or credential deserializers via `setRowMapper(...)` or `setCredentialsDeserializer(...)` in `JdbcAssertingPartyMetadataRepository`.

**Secure rules**

**Rule 1: Configure an `ObjectInputFilter` with strict allowlisting when implementing custom deserialization for credentials.**

When custom deserialization logic must be provided, ensure that an `ObjectInputFilter` is assigned to the `ObjectInputStream` using strict allowlisting for allowed classes and boundary checks to prevent insecure Java deserialization.

```java
public class SecureCredentialDeserializer implements Deserializer<Collection<Saml2X509Credential>> {
    @Override
    public Collection<Saml2X509Credential> deserialize(InputStream in) throws IOException {
        ObjectInputStream oin = new ObjectInputStream(in);
        ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
            "org.springframework.security.saml2.core.Saml2X509Credential;" +
            "org.springframework.security.saml2.core.Saml2X509Credential$Saml2X509CredentialType;" +
            "java.util.LinkedHashSet;!*");
        oin.setObjectInputFilter(filter);
        try {
            return (Collection<Saml2X509Credential>) oin.readObject();
        } catch (ClassNotFoundException ex) {
            throw new IOException("Deserialization failed", ex);
        }
    }
}
```
