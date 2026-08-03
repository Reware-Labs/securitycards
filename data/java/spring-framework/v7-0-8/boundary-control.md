# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: boundary control

## boundary control

### Validate Request Path Boundaries and Prefix Alignment

**Use when**

Configuring test request builders, mock servlets, and request boundaries where URI paths, context paths, and servlet paths are processed to ensure path-based security controls evaluate correct URI segments.

**Secure rules**

**Rule 1: Ensure explicit context paths and servlet paths strictly match the request URI prefix and follow standard formatting.**

When constructing test requests or request wrappers, format context paths and servlet paths with a leading slash and no trailing slash. Verify that configured paths align accurately with the full request URI so that path-based security matchers and authorization filters evaluate the intended request paths.

```java
MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.get("/travel/main/hotels/42")
        .contextPath("/travel")
        .servletPath("/main");
```
