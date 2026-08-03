# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: authentication

## authentication

### Configure Account Confirmation and Token Settings

**Use when**

Setting up account confirmation rules, reconfirmation requirements, and token expiration periods.

**Secure rules**

**Rule 1: Require email reconfirmation on address changes.**

Keep `config.reconfirmable = true` enabled when using the `:confirmable` module to require users to confirm email address updates via a token sent to the new email.

```ruby
Devise.setup do |config|
  config.reconfirmable = true
end
```

**Rule 2: Configure confirmation expiration periods to limit token validity.**

Set `config.confirm_within` and `config.allow_unconfirmed_access_for` in Devise configuration to enforce strict time limits on account confirmation tokens and unconfirmed account access.

```ruby
Devise.setup do |config|
  config.confirm_within = 3.days
  config.allow_unconfirmed_access_for = 0.days
end
```


### Prevent Account Enumeration and Restrict Parameter Authentication

**Use when**

Configuring public authentication endpoints, login flows, and account recovery mechanisms.

**Secure rules**

**Rule 1: Enable paranoid mode to prevent user enumeration.**

Enable paranoid mode in Devise configuration when user enumeration prevention is required for authentication and recovery flows.

```ruby
Devise.setup do |config|
  config.paranoid = true
end
```

**Rule 2: Restrict parameter-based authentication to dedicated request handlers.**

Only call `allow_params_authentication!` inside dedicated request handlers where parameter-based authentication is explicitly required, and avoid triggering it globally or during GET requests.

```ruby
class Api::V1::SessionsController < ApplicationController
  def create
    allow_params_authentication!
    user = warden.authenticate!(scope: :user)
    render json: { status: 'authenticated', user_id: user.id }
  end
end
```


### Verify Passwords and Credentials Securely

**Use when**

Implementing custom authentication logic, strategy extensions, or credential verification routines.

**Secure rules**

**Rule 1: Use model-level password verification instead of strategy-level checks.**

Do not rely on strategy-level methods such as `valid_password?` to verify user credentials, as they only check whether a non-empty password string was supplied. Always perform password verification using the model-level `resource.valid_password?(password)` method.

```ruby
if user && user.valid_password?(params[:user][:password])
  # Password matches the stored hash
end
```

**Rule 2: Compare password digests using constant-time comparison.**

When writing custom authentication logic or manual password validation routines, use `Devise::Encryptor.compare` rather than standard string equality operators to avoid timing side channels.

```ruby
is_valid = Devise::Encryptor.compare(User, user.encrypted_password, submitted_password)
if is_valid
  # Password is verified safely
end
```
