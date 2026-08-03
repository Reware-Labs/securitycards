# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: csrf

## csrf

### Implement CSRF Protection and Authenticity Token Verification

**Use when**

Building web applications, processing form submissions, and configuring state-changing endpoints in Rails controllers or views.

**Secure rules**

**Rule 1: Enable request forgery protection in application controllers**

Use `protect_from_forgery with: :exception` or `config.action_controller.default_protect_from_forgery = true` to protect state-changing requests against cross-site request forgery.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
end

<!-- In non-Rails forms or custom Ajax calls, embed the token -->
<meta name="csrf-token" content="<%= form_authenticity_token %>">
```

**Rule 2: Handle CSRF null session behavior safely for API endpoints**

Configure `protect_from_forgery with: :null_session` to nullify the session and cookie jar for unverified requests.

```ruby
class ApplicationController < ActionController::Base
  # Nullifies session and cookie store for unverified POST/PUT/DELETE requests
  protect_from_forgery with: :null_session
end
```

**Rule 3: Disable form authenticity tokens when posting to external endpoints**

Explicitly set `authenticity_token: false` when constructing forms that submit data to external third-party domain URLs to avoid leaking internal tokens.

```ruby
<%= form_for @invoice, url: "https://external-service.example.com/checkout", authenticity_token: false do |f| %>
  <%= f.text_field :amount %>
  <%= f.submit "Submit Payment" %>
<% end %>
```

**Rule 4: Specify explicit HTTP verbs when using match routes**

Always supply allowed HTTP verbs using the `via:` option when mapping routes with `match` to prevent invoking state-changing actions via GET requests.

```ruby
Always restrict HTTP methods using the via option when defining match routes:

Rails.application.routes.draw do
  match 'openid/login', via: [:get, :post], to: 'openid#login'
end
```

**Rule 5: Use a null session for stateless APIs**

Keep the default CSRF protection for session-oriented browser requests. For an application built on `ActionController::Base` whose API requests are intentionally stateless, use the `:null_session` strategy: Rails allows an unverified request to proceed with an empty, non-persistent session instead of exposing the existing session.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session
end
```

**Rule 6: Configure SameSite cookie attributes to mitigate cross site requests**

Set cookie `same_site` attributes using symbols like `:lax`, `:strict`, or `:none` to control cross-origin cookie inclusion.

```ruby
# Per-cookie configuration
cookies[:user_name] = { value: "david", same_site: :strict }

# Dynamic per-request configuration in Rails middleware context
config.action_dispatch.cookies_same_site_protection = ->(request) {
  :strict unless request.user_agent == "legacy_browser"
}
```

**Rule 7: Keep authenticity tokens on state-changing `form_tag` forms**

For forms that submit state-changing requests to your Rails application, keep `form_tag`’s default authenticity token. Do not pass `authenticity_token: false` merely because the form is publicly accessible; malicious sites can submit non-GET requests too.

```erb
<%= form_tag("/posts") do %>
  <%= submit_tag "Save" %>
<% end %>
```

**Rule 8: Require XHR headers for cross-origin JavaScript responses**

Ensure requests demanding JavaScript responses include an explicit `X-Requested-With` header to block unauthorized script inclusion.

```javascript
Always issue AJAX or fetch requests containing the `X-Requested-With` header when retrieving JavaScript endpoints:

fetch('/endpoint.js', {
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});
```

**Rule 9: Enable automatic CSRF authenticity tokens for non-GET forms**

Use `form_with` for non-GET HTTP methods to automatically embed the hidden authenticity token field.

```ruby
Use form_with for state-changing forms to automatically inject the CSRF authenticity token:

<%= form_with url: "/account/update", method: :post do |form| %>
  <%= form.text_field :username %>
  <%= form.submit "Update" %>
<% end %>
```
