# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: cryptography

## cryptography

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
