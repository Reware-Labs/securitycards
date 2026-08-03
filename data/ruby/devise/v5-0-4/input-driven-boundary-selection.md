# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: input driven boundary selection

## input driven boundary selection

### Sanitize and Revalidate Untrusted Redirect Locations in Custom Failure Apps

**Use when**

When extending or overriding `Devise::FailureApp` to customize post-failure redirection logic and handling untrusted request headers or URL parameters.

**Secure rules**

**Rule 1: Extract relative local paths using path extraction methods rather than passing raw request headers directly to redirection functions.**

When customizing redirection in a custom failure application subclass, avoid trusting unvalidated headers like `request.referrer` or untrusted URL parameters directly. Ensure you extract relative local paths using `extract_path_from_location` or perform explicit target revalidation to prevent open redirect vulnerabilities during session timeouts or authentication failures.

```ruby
class CustomFailureApp < Devise::FailureApp
  protected

  def redirect_url
    if warden_message == :timeout && !request.get?
      extract_path_from_location(request.referrer) || scope_url
    else
      super
    end
  end
end
```
