# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: output encoding

## output encoding

### Use URI template placeholders in RedirectView for automatic URL encoding

**Use when**

When constructing dynamic redirect URLs with RedirectView to prevent open redirect vulnerabilities and URL injection.

**Secure rules**

**Rule 1: Use URI template placeholders instead of manual string concatenation when creating dynamic redirect URLs.**

Construct dynamic redirect URLs with `RedirectView` by using URI template placeholders and supplying dynamic values via the model map rather than performing manual string concatenation. `RedirectView` automatically URL-encodes substituted URI variables.

```java
Map<String, Object> model = new HashMap<>();
model.put("foo", "bar/bar baz");

RedirectView redirectView = new RedirectView("https://example.com/context/{foo}");
redirectView.renderMergedOutputModel(model, request, response);

RedirectView staticView = new RedirectView("/test#{'one'}", true);
staticView.setExpandUriTemplateVariables(false);
```
