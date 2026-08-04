# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: interface protocol hardening

## interface protocol hardening

### Configure HTTP security headers and transport policies using Rails middleware

**Use when**

Configuring global application security headers, transport security, content security policies, and permissions policies in Rails production or development environments.

**Secure rules**

**Rule 1: Enable force SSL and configure HTTP Strict Transport Security options**

Set `config.force_ssl = true` in application settings to insert `ActionDispatch::SSL` into the middleware stack and enforce HTTPS redirects. Configure `config.ssl_options` with appropriate `hsts` parameters including expiration duration, subdomain inclusion, and preload eligibility. To intentionally revoke an existing HSTS policy from client browsers, set `hsts: false` or specify an expiration of zero.

```ruby
Rails.application.configure do
  config.force_ssl = true
  config.ssl_options = {
    hsts: {
      expires: 1.year,
      subdomains: true,
      preload: true
    }
  }
end
```

**Rule 2: Configure Content Security Policy directives and nonce generators globally and per controller**

Enable and configure CSP rules globally via `Rails.application.config.content_security_policy` using separate symbol or string arguments for directives. Attach per-request nonces using `content_security_policy_nonce_generator` and `content_security_policy_nonce_directives`. Use controller macros to scope or override policies for specific actions.

```ruby
Rails.application.config.content_security_policy do |p|
  p.default_src :self, :https
  p.script_src  :self, :https
end
Rails.application.config.content_security_policy_nonce_generator = ->(request) { SecureRandom.base64(16) }
Rails.application.config.content_security_policy_nonce_directives = %w(script-src)
```

**Rule 3: Configure Rails 8.1.3’s `Feature-Policy` header**

In a non-API Rails application, define a global browser-feature policy with `Rails.application.config.permissions_policy`. Rails then adds `ActionDispatch::PermissionsPolicy::Middleware`, which emits the legacy `Feature-Policy` response header. Despite the middleware’s name, Rails 8.1.3 does not emit the newer `Permissions-Policy` header.

```ruby
Rails.application.config.permissions_policy do |policy|
  policy.camera      :none
  policy.gyroscope   :none
  policy.microphone  :none
  policy.usb         :none
  policy.fullscreen  :self
  policy.payment     :self, "https://secure.example.com"
end
```


### Enforce HTTP Method and Redirection Semantics for Secure Request Dispatching

**Use when**

When managing HTTP request redirection flows and ensuring methods are appropriately handled following state-changing actions.

**Secure rules**

**Rule 1: Use `303 See Other` when a redirect must be followed with GET**

When redirecting after a request whose method must not be repeated at the destination, explicitly use `status: :see_other`. Rails documents that a 303 redirect is followed with GET. Do not rely on the default `302 Found` response to provide the same method-conversion guarantee.

```ruby
redirect_to posts_url, status: :see_other
```


### Secure Route Definitions and Parameter Constraints

**Use when**

Configuring application routes, resource endpoints, and parameter constraints in config/routes.rb.

**Secure rules**

**Rule 1: Enforce explicit HTTP verbs for resource routes and match definitions**

Always explicitly define allowed HTTP verbs using specific verb helpers like `get`, `post`, `patch`, or `delete`, or the `via` option on `match` to prevent unintended request processing and CSRF exposure on state-changing actions.

```ruby
Rails.application.routes.draw do
  get 'profile', to: 'users#show'
  match 'search', to: 'search#index', via: [:get, :post]
end
```

**Rule 2: Restrict dynamic route parameters with explicit regular expressions**

Apply explicit regex constraints using the `constraints:` option on dynamic route segments to reject malformed input, preventing route shadowing and unauthorized parameter processing.

```ruby
Rails.application.routes.draw do
  get '/users/:id', to: 'users#show', constraints: { id: /\d+/ }
end
```

**Rule 3: Limit exposed action routes using only or except options**

Restrict resource routes using the `:only` or `:except` options to expose strictly required controller actions and avoid exposing default public endpoints.

```ruby
resources :articles do
  resources :comments, only: [:index, :new, :create]
end
```
