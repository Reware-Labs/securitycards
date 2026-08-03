# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: deserialization

## deserialization

### Explicitly Configure Message Converters to Restrict Deserialized Formats

**Use when**

When configuring HTTP message converters in Spring MVC to control allowed payload formats and prevent unintended deserialization.

**Secure rules**

**Rule 1: Explicitly declare and register allowed HTTP message converters instead of relying on automatic classpath detection.**

Disable default message converter registration by setting `register-defaults="false"` and explicitly specify safe converters such as `MappingJackson2HttpMessageConverter` to control allowed payload formats and object mappers.

```xml
<mvc:annotation-driven>
    <mvc:message-converters register-defaults="false">
        <bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter"/>
    </mvc:message-converters>
</mvc:annotation-driven>
```
