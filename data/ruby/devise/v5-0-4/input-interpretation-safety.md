# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: input interpretation safety

## input interpretation safety

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
