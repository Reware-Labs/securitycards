# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: authentication

## authentication

### Authenticate HTTP requests securely using built-in controllers and constant-time comparisons

**Use when**

Implementing controller authentication callbacks or handling HTTP token and basic authentication headers.

**Secure rules**

**Rule 1: Use constant-time comparison when verifying authentication tokens**

Compare credentials using `ActiveSupport::SecurityUtils.secure_compare` rather than standard string equality operators to protect against timing attacks.

```ruby
class ApplicationController < ActionController::Base
  private
    def authenticate
      authenticate_or_request_with_http_token do |token, options|
        ActiveSupport::SecurityUtils.secure_compare(token, Rails.application.credentials.api_token)
      end
    end
end
```

**Rule 2: Use HTTP token authentication helpers for header extraction**

Use ActionController's built-in `authenticate_or_request_with_http_token` or `authenticate_with_http_token` helpers to safely extract authentication credentials and scheme parameters from HTTP authorization headers.

```ruby
class ApiController < ActionController::Base
  before_action :authenticate

  private
    def authenticate
      authenticate_or_request_with_http_token("Application Realm") do |token, options|
        ActiveSupport::SecurityUtils.secure_compare(token, API_KEY)
      end
    end
end
```


### Configure password verification and secure token generation in user models

**Use when**

Building or modifying user models that handle password authentication, password hashing, and purpose-bound token generation.

**Secure rules**

**Rule 1: Use `has_secure_password` for password authentication and reset tokens**

In an Active Record user model with a `password_digest` attribute, call `has_secure_password`. Rails uses bcrypt for password storage and authentication, adds presence, confirmation, and 72-byte maximum validations, and configures a password-reset token that expires after 15 minutes by default. Define any application-specific minimum-length and complexity validations separately because Rails does not supply them.

```ruby
class User < ApplicationRecord
  has_secure_password
end
```

**Rule 2: Generate purpose-bound, expiring tokens tied to model state**

Define each token purpose with `generates_token_for`, set `expires_in`, and return a non-sensitive model-derived value from the block when tokens should become invalid after that value changes. Generate tokens with `generate_token_for` and resolve them with `find_by_token_for`. Token lookup does not consume a valid token, so do not treat these tokens as inherently single-use.

```ruby
class User < ActiveRecord::Base
  has_secure_password

  generates_token_for :password_reset, expires_in: 15.minutes do
    password_salt&.last(10)
  end
end
```
