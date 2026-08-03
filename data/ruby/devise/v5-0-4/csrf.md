# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: csrf

## csrf

### Configure CSRF token cleanup, request protection, and secure methods in Devise

**Use when**

When configuring authentication, routes, and request forgery protection in a Devise-powered Rails application.

**Secure rules**

**Rule 1: Keep CSRF token cleanup enabled upon authentication**

Ensure `config.clean_up_csrf_token_on_authentication` is set to true in your Devise initializer so that pre-session CSRF tokens do not persist across authentication boundaries.

```ruby
Devise.setup do |config|
  config.clean_up_csrf_token_on_authentication = true
end
```

**Rule 2: Restrict sign out HTTP methods to prevent CSRF logouts**

Use the `sign_out_via` option in `devise_for` to restrict sign-out actions to restrictive HTTP methods like `:delete` or `:post` and avoid enabling `:get` for sign-out routes.

```ruby
devise_for :users, sign_out_via: [:delete, :post]
```

**Rule 3: Call super when overriding handle_unverified_request in controllers**

When overriding Rails' `handle_unverified_request` in `ApplicationController`, always call `super` to ensure Devise executes its session cleanup logic and skips storage upon CSRF failure.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  protected

  def handle_unverified_request
    super
  end
end
```

**Rule 4: Enforce POST requests for OmniAuth initiation**

Restrict OmniAuth authentication requests to HTTP POST methods in your initializer and use POST forms or `button_to` helpers rather than standard `link_to` tags for provider links.

```ruby
OmniAuth.config.allowed_request_methods = [:post]

<%= button_to "Sign in with Facebook", user_facebook_omniauth_authorize_path, method: :post, data: { turbo: false } %>
```
