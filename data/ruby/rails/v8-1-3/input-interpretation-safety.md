# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: input interpretation safety

## input interpretation safety

### Canonicalize and Normalize Attribute Values Before Querying or Parsing Input

**Use when**

You are writing queries with raw SQL fragments or parsing input parameters where values must be canonicalized or normalized to ensure unambiguous interpretation.

**Secure rules**

**Rule 1: Explicitly invoke normalization before passing attribute values to raw SQL array fragments.**

When using `ActiveRecord::Base.normalizes` to transform attribute values, hash-based queries automatically apply normalization, but raw SQL array fragments bypass it. Explicitly invoke `normalize_value_for` to normalize values before querying with raw SQL array fragments.

```ruby
class User < ActiveRecord::Base
  normalizes :email, with: -> email { email.strip.downcase }
end

normalized_email = User.normalize_value_for(:email, params[:email])
User.where(["email = ?", normalized_email])
```

**Rule 2: Parse and validate composite string parameters when models override to_param.**

When models override `to_param` to generate parameterized URL slugs, controller code must account for parameters containing composite string values rather than raw integer primary keys. Parse or validate these parameters properly before querying models or relying on integer assumptions.

```ruby
class UsersController < ApplicationController
  def show
    user_id = params[:id].to_i
    @user = User.find(user_id)
  end
end
```
