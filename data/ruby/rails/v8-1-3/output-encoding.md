# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: output encoding

## output encoding

### Prevent XSS by utilizing default HTML auto-escaping and avoiding raw output helpers

**Use when**

Rendering dynamic text, attributes, or user-supplied content within Action View ERB templates.

**Secure rules**

**Rule 1: Rely on standard ERB interpolation for automatic HTML encoding and avoid bypassing auto-escaping with the raw helper or unsafe modifiers.**

Action View automatically escapes HTML output in ERB view templates by default to prevent Cross-Site Scripting. Avoid passing untrusted user input directly to the raw helper or setting escape to false when using text truncation helpers, as both bypass automatic HTML encoding.

```html
<%= @comment.body %>
<%= truncate(user_supplied_text, length: 50) %>
```


### Sanitize Untrusted Markup With an Allowlist When HTML Must Be Rendered

**Use when**

A feature must store and render caller-supplied HTML rather than escaping it as plain text.

**Secure rules**

**Rule 1: Pass caller-supplied HTML through the `sanitize` helper with an explicit allowlist instead of `raw` or `html_safe`.**

When markup has to survive into the response, never mark untrusted strings as HTML-safe directly. Run them through Action View's `sanitize` helper with an explicit tag and attribute allowlist so scripts, event handlers, and unknown attributes are removed while the permitted formatting is kept.

```erb
<%= sanitize(@comment.body, tags: %w[p br strong em a], attributes: %w[href]) %>
```


### Neutralize Control Characters in Untrusted Values Before Logging

**Use when**

Writing request-derived values to `Rails.logger` or any application log.

**Secure rules**

**Rule 1: Strip or replace control characters in untrusted values before writing them to a log.**

Newlines and carriage returns in user-controlled data let an attacker forge or split log entries. Remove control characters before interpolating such values into a log message, in addition to configuring `config.filter_parameters` so sensitive fields never reach the logs.

```ruby
safe_value = params[:username].to_s.gsub(/[[:cntrl:]]/, " ")
Rails.logger.info("login attempt for #{safe_value}")
```
