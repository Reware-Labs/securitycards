# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: resource exhaustion

## resource exhaustion

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
