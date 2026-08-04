# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`

## Category: access control

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


## Category: authentication

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


## Category: boundary control

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


## Category: cryptography

### Configure password hashing and secure token comparison

**Use when**

Configuring credential hashing parameters and verifying authentication or reset tokens securely in Devise.

**Secure rules**

**Rule 1: Set sufficient bcrypt stretch factors in production environments**

Configure `config.stretches` with an adequate work factor cost in non-test environments to prevent rapid offline password cracking.

```ruby
Devise.setup do |config|
  config.stretches = Rails.env.test? ? 1 : 12
end
```

**Rule 2: Use constant-time comparison for token verification**

Use `Devise.secure_compare` when validating sensitive tokens or user-supplied secrets to mitigate timing side-channel attacks.

```ruby
is_valid = Devise.secure_compare(user.authentication_token, provided_token)
```


## Category: csrf

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


## Category: input contract definition

### Configure Explicit Password Length Bounds to Enforce Credential Input Contracts

**Use when**

Setting up Devise configuration options in initializers to restrict password input lengths and enforce credential input contracts.

**Secure rules**

**Rule 1: Explicitly configure password length bounds in Devise initialization settings to reject weak or excessively long credentials.**

Use `config.password_length` in your Devise initializer to explicitly enforce minimum and maximum password boundaries, ensuring malformed or out-of-contract credentials are rejected during input processing.

```ruby
Devise.setup do |config|
  # Enforce a minimum password length of 12 and a maximum of 128
  config.password_length = 12..128
end
```

**Rule 2: Validate custom email input formats against Devise email regex rules.**

Validate custom email input fields against `Devise.email_regexp` before attempting authentication or database persistence to ensure proper string formatting and reject malformed inputs.

```ruby
validates :email, format: { with: Devise.email_regexp }
```


## Category: input driven boundary selection

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


## Category: input interpretation safety

### Normalize and Sanitize Authentication Inputs and Parameters

**Use when**

Configuring identity normalization rules, performing database authentication lookups, or validating confirmation tokens and parameters in Devise models.

**Secure rules**

**Rule 1: Configure case-insensitive and whitespace-stripped keys for uniform identity lookup**

Set `case_insensitive_keys` and `strip_whitespace_keys` in your Devise initializer to automatically normalize unique identity fields like email.

```ruby
Devise.setup do |config|
  config.case_insensitive_keys = [:email]
  config.strip_whitespace_keys = [:email]
end
```

**Rule 2: Sanitize and permit conditions hashes before calling find_for_database_authentication manually**

Ensure that any conditions hashes passed directly into `find_for_database_authentication` are strictly limited to allowed authentication keys.

```ruby
safe_conditions = params.require(:user).permit(:email, :username).to_h
user = User.find_for_database_authentication(safe_conditions)
```

**Rule 3: Process confirmation parameters using confirm_by_token**

Use `confirm_by_token` to safely validate confirmation tokens and handle nil, blank, corrupted, or already-used tokens without throwing unhandled exceptions.

```ruby
user = User.confirm_by_token(params[:confirmation_token])
if user.errors.empty?
  # User successfully confirmed
else
  # Handle invalid, blank, or expired token
  render :new
end
```


## Category: interface protocol hardening

### Disable Unexpected Extension Formats on Authentication Routes

**Use when**

Configuring `devise_for` routes for web resources that are strictly intended for HTML views to prevent format confusion and restrict accepted content types.

**Secure rules**

**Rule 1: Pass `format: false` to `devise_for` to omit format extensions from generated authentication routes**

When routes for an authentication scope should not match paths that include a format extension (for example `.json`), pass `format: false`. This prevents the generated routes from including the `(.:format)` segment.

```ruby
Rails.application.routes.draw do
  devise_for :admins, format: false
end
```


## Category: resource exhaustion

### Enforce Password Length Limits to Prevent Hashing Resource Exhaustion

**Use when**

Configuring user models and authentication validations with Devise to bound input size for CPU-intensive hashing operations.

**Secure rules**

**Rule 1: Retain upper length limits on passwords by including Devise's validatable module or maintaining explicit length validations.**

Devise's `:validatable` module automatically enforces password length boundaries with a hard upper limit of 72 characters by default to protect against excessive CPU overhead during BCrypt hashing. Developers must include `:validatable` in user models or explicitly validate password length to ensure inputs do not exceed safe limits.

```ruby
class User < ApplicationRecord
  devise :database_authenticatable, :validatable
end
```


## Category: secret handling

### Protect sensitive credentials and tokens in Devise models, API responses, and mailers

**Use when**

When managing authentication credentials, API responses, token serialization, password clearing, and secret key configuration in Devise applications.

**Secure rules**

**Rule 1: Omit sensitive attributes from API responses**

Ensure sensitive internal attributes like confirmation tokens, reset password tokens, or password hashes are never serialized into JSON response payloads by explicitly scoping fields in custom API serializers rather than returning raw model attributes.

```ruby
class Users::RegistrationsController < Devise::RegistrationsController
  def create
    build_resource(sign_up_params)
    resource.save
    if resource.persisted?
      render json: resource.as_json(only: [:id, :email]), status: :created
    else
      render json: { errors: resource.errors }, status: :unprocessable_content
    end
  end
end
```

**Rule 2: Retain default exclusions during model serialization**

When serializing authenticatable models or rendering them as JSON or XML, ensure custom serialization code retains default exclusions or explicitly filters sensitive attributes rather than bypassing Devise filters with force_except.

```ruby
class User < ApplicationRecord
  devise :database_authenticatable

  def serializable_hash(options = nil)
    super((options || {}).merge(except: [:internal_notes]))
  end
end
```

**Rule 3: Clear plain text passwords from memory**

Call `clean_up_passwords(resource)` in custom controller actions after processing user submissions containing plain text passwords, especially prior to re-rendering forms after validation failures.

```ruby
def create
  self.resource = build_resource(sign_up_params)
  if resource.save
    sign_in(resource_name, resource)
    respond_with resource, location: after_sign_up_path_for(resource)
  else
    clean_up_passwords(resource)
    respond_with resource
  end
end
```

**Rule 4: Safely handle authentication tokens in custom mailers**

When customizing `Devise::Mailer` or overriding mailer actions, developers must retain the `@token` instance variable assignment for template rendering and avoid logging, persisting, or leaking these raw tokens.

```ruby
class CustomDeviseMailer < Devise::Mailer
  def reset_password_instructions(record, token, opts = {})
    @token = token
    devise_mail(record, :reset_password_instructions, opts)
  end
end
```

**Rule 5: Store cryptographic digests of tokens in the database**

Use `Devise.token_generator.digest` when comparing incoming user-supplied raw tokens against database digests instead of storing raw tokens in plain text.

```ruby
raw_token = params[:reset_password_token]
hashed_token = Devise.token_generator.digest(User, :reset_password_token, raw_token)
user = User.find_by(reset_password_token: hashed_token)
```


## Category: security control integrity

### Use Integration Tests to Verify Warden Authentication Callbacks

**Use when**

Testing authentication behaviors, security hooks, session lifecycles, and Warden callbacks instead of relying solely on isolated controller tests.

**Secure rules**

**Rule 1: Avoid relying solely on controller test helpers for security callback verification**

Devise controller test helpers such as `Devise::Test::ControllerHelpers#sign_in` and `#sign_out` bypass Warden authentication and logout callbacks by injecting stubbed user data. Ensure that all security controls, lockout rules, session tracking, and Warden hooks are fully tested using integration or system tests where actual Warden callbacks execute.

```ruby
class AuthenticationTest < ActionDispatch::IntegrationTest
  test 'user sign in triggers warden callbacks and trackable' do
    post user_session_path, params: { user: { email: 'alice@example.com', password: 'password' } }
    assert_redirected_to root_path
  end
end
```


## Category: session management

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
