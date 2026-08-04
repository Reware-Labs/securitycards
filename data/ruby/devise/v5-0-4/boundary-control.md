# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: boundary control

## boundary control

### Sanitize Redirect URLs with store_location_for

**Use when**

When handling post-authentication return destinations from parameters or headers to prevent open redirect vulnerabilities.

**Secure rules**

**Rule 1: Use Devise's store_location_for helper to sanitize and store untrusted return-to paths before redirecting users.**

Pass untrusted return destination strings into `store_location_for` rather than directly redirecting to raw parameter values. Devise automatically sanitizes stored URLs by stripping authority components from protocol-relative URIs and rejecting invalid, opaque, or unsafe schemes.

```ruby
def store_user_location
  store_location_for(:user, params[:redirect_to])
end
```
