# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: input contract definition

## input contract definition

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
