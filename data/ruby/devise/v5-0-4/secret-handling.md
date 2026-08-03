# Security cards

Repository: `https://github.com/heartcombo/devise#v5.0.4`
Category: secret handling

## secret handling

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
