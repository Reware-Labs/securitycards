# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: security control integrity

## security control integrity

### Preserve Global Filters and Security Rules When Customizing Shiro Web Components

**Use when**

When overriding default Shiro web filters, global configurations, or custom Spring bean definitions in a web application.

**Secure rules**

**Rule 1: Retain critical global security filters such as InvalidRequestFilter when overriding global filter chains.**

When overriding `globalFilters()`, ensure you retain security-critical global filters instead of discarding them. Removing foundational filters disables protections against URI path manipulation and request smuggling across the application.

```java
@Override
public List<FilterConfig<? extends Filter>> globalFilters() {
    List<FilterConfig<? extends Filter>> filters = new ArrayList<>(super.globalFilters());
    filters.add(filterConfig(MY_CUSTOM_GLOBAL_FILTER));
    return filters;
}
```

**Rule 2: Maintain complete security logic and path protection rules when defining custom Shiro web beans.**

Defining a custom bean for any Shiro web component suppresses default bean creation. Ensure custom implementations maintain complete security logic and avoid omitting critical URL path protection rules or filter configurations.

```java
@Bean
public ShiroFilterChainDefinition shiroFilterChainDefinition() {
    DefaultShiroFilterChainDefinition chainDefinition = new DefaultShiroFilterChainDefinition();
    chainDefinition.addPathDefinition("/admin/**", "authc, roles[admin]");
    chainDefinition.addPathDefinition("/**", "authc");
    return chainDefinition;
}
```
