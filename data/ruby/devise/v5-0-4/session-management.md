# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: session management

## session management

### Manage session state and credential updates securely with Devise

**Use when**

When managing user sign-in state, session invalidation on logout, password updates, or session timeouts in a Devise application.

**Secure rules**

**Rule 1: Rotate session identifiers and refresh CSRF tokens upon user authentication.**

Devise automatically regenerates the session identifier and refreshes the CSRF token upon user authentication. Ensure Rails request forgery protection is enabled in your application controllers so session fixation and token reuse vulnerabilities are prevented during sign-in.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
end
```

**Rule 2: Invalidate persistent authentication state and remember-me tokens upon explicit sign-out.**

Maintain `config.expire_all_remember_me_on_sign_out = true` to invalidate persistent remember-me tokens when users sign out. Use Devise's `sign_out` helper to clear authentication state rather than manually clearing session keys to ensure Warden session proxy state and active scope authentications are purged.

```ruby
Devise.setup do |config|
  config.expire_all_remember_me_on_sign_out = true
end

class CustomSessionsController < Devise::SessionsController
  def destroy
    sign_out(current_user)
    redirect_to root_path
  end
end
```

**Rule 3: Refresh session authentication state using bypass_sign_in when updating credentials.**

When updating active user credentials such as password changes, use `bypass_sign_in(resource)` to refresh the user session directly without invoking full authentication callbacks or attempting to use deprecated bypass options.

```ruby
if @user.update_with_password(user_params)
  bypass_sign_in(@user)
  redirect_to account_path, notice: 'Profile updated'
end
```

**Rule 4: Configure session timeout limits and expiration boundaries.**

Set an appropriate inactivity window via `config.timeout_in` and explicitly define `config.sign_out_all_scopes` based on multi-role security needs to prevent prolonged inactive sessions from increasing the risk of session hijacking.

```ruby
Devise.setup do |config|
  config.timeout_in = 30.minutes
  config.sign_out_all_scopes = true
end
```
