# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: runtime environment hardening

## runtime environment hardening

### Disable Detailed Exception Debugging in Production Environments

**Use when**

Configuring application environments for production deployment to prevent information disclosure.

**Secure rules**

**Rule 1: Set config.consider_all_requests_local to false in production configuration.**

Ensure that `config.consider_all_requests_local` is explicitly set to `false` within `config/environments/production.rb` to prevent Rails from exposing detailed exception backtraces and application runtime parameters to HTTP clients.

```ruby
Rails.application.configure do
  config.consider_all_requests_local = false
end
```
