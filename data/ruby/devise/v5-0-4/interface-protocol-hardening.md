# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: interface protocol hardening

## interface protocol hardening

### Disable Unexpected Extension Formats on Authentication Routes

**Use when**

Configuring `devise_for` routes for web resources that are strictly intended for HTML views to prevent format confusion and restrict accepted content types.

**Secure rules**

**Rule 1: Pass `format: false` to `devise_for` to omit format extensions from generated authentication routes**

When routes for an authentication scope should not match paths that include a format extension (for example `.json`), pass `format: false`. This prevents the generated routes from including the `(.:format)` segment.

```ruby
Rails.application.routes.draw do
  devise_for :admins, format: false
end
```
