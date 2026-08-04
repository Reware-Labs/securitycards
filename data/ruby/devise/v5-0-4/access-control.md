# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: access control

## access control

### Enforce Role and Scope Authentication Filters on Controllers and Routes

**Use when**

Protecting administrative or sensitive controller actions and routing endpoints from unauthorized access.

**Secure rules**

**Rule 1: Protect controller endpoints by declaring scope-specific authentication filters.**

Declare before_action filters using `authenticate_<mapping>!` or `authenticate_<group>!` to instruct Warden to authenticate the request context and interrupt unauthorized access prior to controller execution.

```ruby
class Admin::DashboardController < ApplicationController
  before_action :authenticate_admin!

  def index
    @metrics = Metrics.fetch_admin_summary
  end
end
```

**Rule 2: Enforce authentication and role constraints at the routing layer.**

Use Devise routing helpers such as `authenticate` and `authenticated` in your Rails routing configuration to enforce authentication and role-based access control directly at the routing boundary.

```ruby
authenticate :user do
  resources :private_documents
end
```

**Rule 3: Isolate authentication scopes to prevent session cross-contamination.**

Configure `config.sign_out_all_scopes` in `config/initializers/devise.rb` based on whether signing out of one scope should terminate all active user and admin sessions.

```ruby
Devise.setup do |config|
  config.sign_out_all_scopes = true
end
```
