# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: session management

## session management

### Secure and Rotate Session State During Authentication and Configuration

**Use when**

When managing session cookies, enforcing expiration limits, and handling user authentication state transitions in Rails.

**Secure rules**

**Rule 1: Reset sessions on privilege changes to prevent session fixation**

Always call `reset_session` during authentication boundaries such as user login or privilege changes to invalidate existing session state and re-initialize session identifiers.

```ruby
class SessionsController < ApplicationController
  def create
    if user = User.authenticate(params[:email], params[:password])
      reset_session
      session[:user_id] = user.id
    end
  end
end
```

**Rule 2: Use CookieStore attributes to limit cookie exposure without treating them as XSS prevention**

For an HTTPS application, configure the session cookie with `secure`, `httponly`, and an appropriate `same_site` value. `secure` limits cookie transmission to HTTPS, `httponly` prevents JavaScript from reading the cookie through `document.cookie`, and `same_site` restricts when the cookie is sent in cross-site contexts. These attributes reduce cookie exposure but do not prevent XSS; address XSS by filtering malicious input and escaping output.

```ruby
Rails.application.config.session_store :cookie_store,
  key: "_app_session",
  secure: true,
  httponly: true,
  same_site: :lax
```

**Rule 3: Reset Controller Sessions to Clear Session Data**

Invoke `reset_session` on user logout or privilege changes to fully wipe session state from both the controller and HTTP request contexts.

```ruby
class SessionsController < ApplicationController
  def destroy
    reset_session
    redirect_to root_path, notice: "Logged out successfully"
  end
end
```
