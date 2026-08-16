# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`

## Category: access control

### Scope Resource Lookups to Authenticated User Associations

**Use when**

When updating, editing, or deleting user-owned resources in controller actions to enforce ownership checks and prevent IDOR vulnerabilities.

**Secure rules**

**Rule 1: Scope Active Record lookups through the current user's association instead of querying models globally.**

Query models using associations tied to the authenticated user, such as `Current.user.wishlists.find(params[:id])`, rather than performing top-level queries with `Model.find(params[:id])`. This ensures that unprivileged users cannot access, modify, or delete resources belonging to other users.

```ruby
class WishlistsController < ApplicationController
  before_action :set_wishlist, only: %i[ edit update destroy ]

  private
    def set_wishlist
      @wishlist = Current.user.wishlists.find(params[:id])
    end
end
```


## Category: api contract misuse

### Query composite primary key models using correct parameter methods

**Use when**

Querying database models that utilize composite primary keys using Active Record finder methods.

**Secure rules**

**Rule 1: Use `id_value` or explicit parameter collections instead of passing `model.id` arrays to `find_by(id:)` when querying composite primary key models.**

When interacting with composite primary key models, passing `model.id` to `find_by(id:)` causes Active Record to interpret the array as an `IN` query on a single column instead of evaluating the composite key tuple. Use `find_by(id: model.id_value)` to target the correct single column or `find(composite_key_array)` for accurate lookups.

```ruby
# Safe: use id_value to query only the :id column
Customer.find_by(id: customer.id_value)

# Safe: use find for exact composite primary key lookup
Customer.find([5, 10])
```


## Category: authentication

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


## Category: boundary control

### Enforce explicit purpose checks when decrypting and verifying cryptographically signed messages

**Use when**

When handling cryptographically signed or encrypted tokens, messages, or session states across trust boundaries where payloads might be replayed or abused in unauthorized contexts.

**Secure rules**

**Rule 1: Attach a specific purpose and expiration constraints when encrypting and signing messages, and supply the matching purpose during decryption and verification.**

Always specify an explicit `:purpose` option and expiration constraints such as `:expires_in` when generating or encrypting signed messages. When verifying or decrypting, supply the matching `:purpose` to ensure tokens cannot be replayed across different endpoints or features.

```ruby
token = crypt.encrypt_and_sign(user_id, purpose: :login, expires_in: 15.minutes)
user_id = crypt.decrypt_and_verify(token, purpose: :login)
```

**Rule 2: Specify an explicit purpose option when generating and verifying signed messages with MessageVerifier.**

Always pass an explicit `:purpose` option when generating and verifying signed messages using `MessageVerifier`. This ensures signatures cannot be accepted across different feature contexts, protecting against signature replay and context confusion attacks.

```ruby
token = verifier.generate(user.id, purpose: :login)

# Verification succeeds only when matching purpose is supplied
user_id = verifier.verified(token, purpose: :login)
```


## Category: cryptography

### Configure ActiveRecord Encryption Ciphers and Key Derivation Securely

**Use when**

When configuring ActiveRecord Encryption ciphers, key derivation parameters, and handling migration or decryption error workflows.

**Secure rules**

**Rule 1: Use non-deterministic encryption by default and avoid deterministic encryption unless database querying is required.**

Invoke `encrypts :attribute` on models using non-deterministic encryption by default to ensure unique initialization vectors are generated for every operation. Only enable `deterministic: true` when exact-match database queries are strictly necessary.

```ruby
class Article < ApplicationRecord
  encrypts :title
end

class Author < ApplicationRecord
  encrypts :email, deterministic: true
end
```

**Rule 2: Derive keys using ActiveSupport::KeyGenerator with cipher-compatible key lengths and strong digest algorithms.**

Ensure secret keys meet required key lengths for chosen ciphers by using `ActiveSupport::KeyGenerator` or `ActiveRecord::Encryption::KeyGenerator`. Configure strong digest classes such as `OpenSSL::Digest::SHA256`.

```ruby
ActiveRecord::Encryption.config.hash_digest_class = OpenSSL::Digest::SHA256
generator = ActiveRecord::Encryption::KeyGenerator.new
key = generator.generate_random_key
derived_key = generator.derive_key_from(secret_password)
```

**Rule 3: Configure previous encryption schemes for existing ciphertext**

When changing an encrypted attribute’s properties, declare its old properties with `previous`. Rails will try the current scheme and then compatible previous schemes when reading existing ciphertext. If every configured scheme fails, Rails raises `ActiveRecord::Encryption::Errors::Decryption`; the failure is not converted automatically to `nil`.

```ruby
class Article
  encrypts :title, deterministic: true, previous: { deterministic: false }
end
```


### Use Authenticated Message Encryptors and Purpose-Specific Verifiers

**Use when**

When generating cryptographic tokens, signing messages, or encrypting payload data with ActiveSupport message encryptors and verifiers.

**Secure rules**

**Rule 1: Use purpose-specific message verifiers to prevent token reuse across features.**

Pass a distinct, purpose-specific string name when requesting message verifiers via `Rails.application.message_verifier(verifier_name)` to prevent token replay attacks across different application features.

```ruby
token = Rails.application.message_verifier("password_reset").generate(user.id)
user_id = Rails.application.message_verifier("password_reset").verify(token)
```

**Rule 2: Handle ActiveSupport::MessageEncryptor::InvalidMessage exceptions during decryption.**

Rescue `ActiveSupport::MessageEncryptor::InvalidMessage` when decrypting messages to safely handle tampered ciphertexts, mismatched keys, or corrupted authentication tags.

```ruby
begin
  decrypted_payload = encryptor.decrypt_and_verify(user_supplied_message)
rescue ActiveSupport::MessageEncryptor::InvalidMessage
  nil
end
```


## Category: csrf

### Implement CSRF Protection and Authenticity Token Verification

**Use when**

Building web applications, processing form submissions, and configuring state-changing endpoints in Rails controllers or views.

**Secure rules**

**Rule 1: Enable request forgery protection in application controllers**

Use `protect_from_forgery with: :exception` or `config.action_controller.default_protect_from_forgery = true` to protect state-changing requests against cross-site request forgery.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
end

<!-- In non-Rails forms or custom Ajax calls, embed the token -->
<meta name="csrf-token" content="<%= form_authenticity_token %>">
```

**Rule 2: Handle CSRF null session behavior safely for API endpoints**

Configure `protect_from_forgery with: :null_session` to nullify the session and cookie jar for unverified requests.

```ruby
class ApplicationController < ActionController::Base
  # Nullifies session and cookie store for unverified POST/PUT/DELETE requests
  protect_from_forgery with: :null_session
end
```

**Rule 3: Disable form authenticity tokens when posting to external endpoints**

Explicitly set `authenticity_token: false` when constructing forms that submit data to external third-party domain URLs to avoid leaking internal tokens.

```ruby
<%= form_for @invoice, url: "https://external-service.example.com/checkout", authenticity_token: false do |f| %>
  <%= f.text_field :amount %>
  <%= f.submit "Submit Payment" %>
<% end %>
```

**Rule 4: Specify explicit HTTP verbs when using match routes**

Always supply allowed HTTP verbs using the `via:` option when mapping routes with `match` to prevent invoking state-changing actions via GET requests.

```ruby
Always restrict HTTP methods using the via option when defining match routes:

Rails.application.routes.draw do
  match 'openid/login', via: [:get, :post], to: 'openid#login'
end
```

**Rule 5: Use a null session for stateless APIs**

Keep the default CSRF protection for session-oriented browser requests. For an application built on `ActionController::Base` whose API requests are intentionally stateless, use the `:null_session` strategy: Rails allows an unverified request to proceed with an empty, non-persistent session instead of exposing the existing session.

```ruby
class ApplicationController < ActionController::Base
  protect_from_forgery with: :null_session
end
```

**Rule 6: Configure SameSite cookie attributes to mitigate cross site requests**

Set cookie `same_site` attributes using symbols like `:lax`, `:strict`, or `:none` to control cross-origin cookie inclusion.

```ruby
# Per-cookie configuration
cookies[:user_name] = { value: "david", same_site: :strict }

# Dynamic per-request configuration in Rails middleware context
config.action_dispatch.cookies_same_site_protection = ->(request) {
  :strict unless request.user_agent == "legacy_browser"
}
```

**Rule 7: Keep authenticity tokens on state-changing `form_tag` forms**

For forms that submit state-changing requests to your Rails application, keep `form_tag`’s default authenticity token. Do not pass `authenticity_token: false` merely because the form is publicly accessible; malicious sites can submit non-GET requests too.

```erb
<%= form_tag("/posts") do %>
  <%= submit_tag "Save" %>
<% end %>
```

**Rule 8: Require XHR headers for cross-origin JavaScript responses**

Ensure requests demanding JavaScript responses include an explicit `X-Requested-With` header to block unauthorized script inclusion.

```javascript
Always issue AJAX or fetch requests containing the `X-Requested-With` header when retrieving JavaScript endpoints:

fetch('/endpoint.js', {
  headers: {
    'X-Requested-With': 'XMLHttpRequest'
  }
});
```

**Rule 9: Enable automatic CSRF authenticity tokens for non-GET forms**

Use `form_with` for non-GET HTTP methods to automatically embed the hidden authenticity token field.

```ruby
Use form_with for state-changing forms to automatically inject the CSRF authenticity token:

<%= form_with url: "/account/update", method: :post do |form| %>
  <%= form.text_field :username %>
  <%= form.submit "Update" %>
<% end %>
```


## Category: dangerous execution

### Keep Untrusted Input Out of Code Evaluation and Dynamic Dispatch

**Use when**

Handling request parameters that could influence code evaluation, method or class resolution, or template rendering.

**Secure rules**

**Rule 1: Never pass request data to runtime code evaluation.**

Do not send user-supplied values to `eval`, `instance_eval`, `class_eval`, or `binding.eval`. Interpret structured input with an explicit parser or a fixed set of operations rather than executing it as Ruby.

```ruby
# Unsafe: eval(params[:expression])
ALLOWED_OPS = { "add" => ->(a, b) { a + b }, "sub" => ->(a, b) { a - b } }
op = ALLOWED_OPS.fetch(params[:op]) { raise ActionController::BadRequest }
result = op.call(Integer(params[:a]), Integer(params[:b]))
```

**Rule 2: Resolve methods and classes through an allowlist, not from parameters.**

Never call `send`, `public_send`, `constantize`, `safe_constantize`, or `Object.const_get` with a method or class name taken from user input. Map approved identifiers to fixed methods or classes so callers cannot reach arbitrary code.

```ruby
ACTIONS = { "publish" => :publish!, "archive" => :archive! }
method_name = ACTIONS.fetch(params[:action]) { raise ActionController::BadRequest }
article.public_send(method_name)
```

**Rule 3: Render fixed templates and pass untrusted data as locals instead of compiling input.**

Do not build templates from user input with `ERB.new(...).result` or `render inline:`; render predefined templates and supply untrusted values through locals or assigns so they are handled as data rather than executable code.

```ruby
# Unsafe: ERB.new(params[:template]).result(binding)
render :show, locals: { name: params[:name] }
```


## Category: deserialization

### Configure Safe Deserializers and Serializers for Messages, Cryptographic Signatures, and Cookies

**Use when**

When configuring session cookies, message encryptors, message verifiers, or cryptographic serializers to handle untrusted data and prevent arbitrary object instantiation or execution.

**Secure rules**

**Rule 1: Use non-Marshal serializers such as JSON or MessagePack for application cookies.**

Configure `config.action_dispatch.cookies_serializer` to `:json` rather than `:marshal` when setting up session and cookie stores across the application to restrict deserialization to primitive data structures.

```ruby
# config/application.rb
Rails.application.configure do
  config.action_dispatch.use_authenticated_cookie_encryption = true
  config.action_dispatch.cookies_serializer = :json
end
```

**Rule 2: Avoid Ruby Marshal serializers in MessageEncryptor to prevent arbitrary code execution.**

Explicitly pass a non-Marshal serializer option such as `:json` or `:message_pack` when initializing `ActiveSupport::MessageEncryptor` and avoid using `:marshal`, `:json_allow_marshal`, or `:message_pack_allow_marshal`.

```ruby
crypt = ActiveSupport::MessageEncryptor.new(
  secret_key,
  cipher: "aes-256-gcm",
  serializer: :json
)
```

**Rule 3: Use ActiveRecord Encryption MessageSerializer for safe message parsing.**

Use `ActiveRecord::Encryption::MessageSerializer` for parsing serialized message data instead of unsafe JSON parsing methods like `JSON.load` to safely parse payloads without allowing arbitrary class instantiation via `json_class` payload directives.

```ruby
serializer = ActiveRecord::Encryption::MessageSerializer.new
message = ActiveRecord::Encryption::Message.new(payload: "sensitive data")
serialized = serializer.dump(message)

deserialized = serializer.load(serialized)
```

**Rule 4: Configure MessageVerifier to use non-Marshal serializers.**

Instantiate `ActiveSupport::MessageVerifier` using secure non-Marshal serializers such as `:json` or `:message_pack` instead of serializers supporting Ruby Marshal deserialization.

```ruby
verifier = ActiveSupport::MessageVerifier.new(secret, digest: "SHA256", serializer: :json)
```


## Category: escape hatch

### Restrict raw SQL fragments and avoid bypassing ActiveRecord query sanitization

**Use when**

When constructing database queries using raw SQL fragments or low-level ordering and clause methods in ActiveRecord.

**Secure rules**

**Rule 1: Only use Arel.sql for hardcoded, known-safe SQL literals or internal string constants, and never pass unvalidated user input or parameters directly into it.**

Using Arel.sql marks string arguments as trusted SQL literals which bypasses Rails internal raw SQL detection and security checks, creating direct SQL injection vectors. Combine Arel.sql for structural clauses with positional parameters for user input.

```ruby
safe_order_clause = Post.sanitize_sql_for_order([Arel.sql("field(id, ?)"), params[:ids]])
@posts = Post.order(safe_order_clause)
```


## Category: file handling

### Configure and Secure Static File Serving and Delivery

**Use when**

Configuring asset delivery, middleware stacks, and reverse proxy offloading for public static files.

**Secure rules**

**Rule 1: Disable the built-in static file server when an upstream web server or CDN handles assets.**

Set `config.public_file_server.enabled` to false in production environments where a reverse proxy handles asset delivery to reduce the application attack surface and conserve runtime resources.

```ruby
Rails.application.configure do
  config.public_file_server.enabled = false
end
```

**Rule 2: Configure security headers and offload static file delivery to upstream servers.**

When using `ActionDispatch::Static`, define security headers like `X-Content-Type-Options` via `config.public_file_server.headers` and offload file streaming to upstream web servers using `config.action_dispatch.x_sendfile_header`.

```ruby
Rails.application.configure do
  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?
  config.public_file_server.headers = {
    "Cache-Control" => "public, max-age=31536000",
    "X-Content-Type-Options" => "nosniff"
  }
  config.action_dispatch.x_sendfile_header = "X-Accel-Redirect"
end
```


### Prevent Path Traversal When Serving Files via send_file

**Use when**

When handling file download requests where file paths are determined using user-controlled parameters or cookies.

**Secure rules**

**Rule 1: Avoid passing user input directly to `send_file` and instead map input to trusted database records or absolute paths.**

Accepting unvalidated user input to locate files on disk permits path traversal attacks. Always look up records securely via database queries, construct paths using `Rails.root.join`, and verify existence via `File.exist?` before calling `send_file`.

```ruby
class ClientsController < ApplicationController
  def download_pdf
    client = Client.find(params[:id])
    file_path = Rails.root.join("files", "clients", "#{client.id}.pdf")

    if File.exist?(file_path)
      send_file(file_path, filename: "#{client.name}.pdf", type: "application/pdf")
    else
      head :not_found
    end
  end
end
```


## Category: injection

### Use Parameterized Queries and Structured Scopes to Prevent SQL Injection

**Use when**

Building database queries, Common Table Expressions, or condition strings using Active Record methods with user-supplied input.

**Secure rules**

**Rule 1: Use parameterized queries or hash conditions with Active Record query methods**

Never interpolate untrusted or user-supplied parameters directly into SQL condition strings when calling Active Record query methods like `where`. Instead, use parameterized array conditions with positional placeholders, named placeholders, or hash conditions, which ensure parameter values are safely escaped and sanitized by Active Record.

```ruby
User.where("user_name = ? AND password = ?", params[:user_name], params[:password])

# Or using hash conditions:
User.where(user_name: params[:user_name], password: params[:password])
```

**Rule 2: Pass subqueries as ActiveRecord Relation objects or Arel constructs when defining Common Table Expressions**

When defining Common Table Expressions via `with` or `with_recursive`, pass subqueries as `ActiveRecord::Relation` objects or safe `Arel` constructs rather than raw, unsanitized user string inputs to avoid SQL injection vulnerabilities.

```ruby
# Safe: Using ActiveRecord::Relation
Post.with(posts_with_tags: Post.where("tags_count > ?", min_tags))

# Safe: Using Arel.sql only with sanitized/static expressions
Post.with(popular_posts: Arel.sql("SELECT * FROM posts WHERE view_count > 100"))
```

**Rule 3: Use parameterized arrays or hashes with sanitize_sql methods**

Always pass conditions or assignments as parameterized arrays or hashes when using `sanitize_sql_for_conditions`, `sanitize_sql_for_assignment`, or `sanitize_sql_array`. Do not pass plain SQL strings containing interpolated user input, as these methods return plain strings unmodified without performing sanitization.

```ruby
# Safe: Use array positional bind variables
sanitized_conditions = Post.sanitize_sql_for_conditions(["name = ? AND status = ?", params[:name], params[:status]])

# Safe: Use named bind variables in array format
sanitized_conditions = Post.sanitize_sql_for_conditions(["name = :name AND status = :status", name: params[:name], status: params[:status]])

# Safe: Use hash format for assignments
sanitized_assignment = Post.sanitize_sql_for_assignment({ status: params[:status], category: params[:category] })
```


## Category: input contract definition

### Filter controller parameters with Strong Parameters and validate input contracts

**Use when**

When processing incoming HTTP request parameters, API payloads, or locale selections before passing them into model mass-assignment methods or application logic.

**Secure rules**

**Rule 1: Enforce strict parameter expectations and input schema contracts**

Always require and permit incoming HTTP request parameters using `params.expect` or `params.permit` before passing parameter hashes into Active Model mass-assignment methods. Additionally, validate unverified inputs such as locale parameters against explicit allowlists like `I18n.available_locales`.

```ruby
class PeopleController < ApplicationController
  def update
    person = Person.find(params[:id])
    person.update!(person_params)
    redirect_to person
  end

  private
    def person_params
      params.expect(person: [:name, :age])
    end
end
```


## Category: input interpretation safety

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


## Category: interface protocol hardening

### Configure HTTP security headers and transport policies using Rails middleware

**Use when**

Configuring global application security headers, transport security, content security policies, and permissions policies in Rails production or development environments.

**Secure rules**

**Rule 1: Enable force SSL and configure HTTP Strict Transport Security options**

Set `config.force_ssl = true` in application settings to insert `ActionDispatch::SSL` into the middleware stack and enforce HTTPS redirects. Configure `config.ssl_options` with appropriate `hsts` parameters including expiration duration, subdomain inclusion, and preload eligibility. To intentionally revoke an existing HSTS policy from client browsers, set `hsts: false` or specify an expiration of zero.

```ruby
Rails.application.configure do
  config.force_ssl = true
  config.ssl_options = {
    hsts: {
      expires: 1.year,
      subdomains: true,
      preload: true
    }
  }
end
```

**Rule 2: Configure Content Security Policy directives and nonce generators globally and per controller**

Enable and configure CSP rules globally via `Rails.application.config.content_security_policy` using separate symbol or string arguments for directives. Attach per-request nonces using `content_security_policy_nonce_generator` and `content_security_policy_nonce_directives`. Use controller macros to scope or override policies for specific actions.

```ruby
Rails.application.config.content_security_policy do |p|
  p.default_src :self, :https
  p.script_src  :self, :https
end
Rails.application.config.content_security_policy_nonce_generator = ->(request) { SecureRandom.base64(16) }
Rails.application.config.content_security_policy_nonce_directives = %w(script-src)
```

**Rule 3: Configure Rails 8.1.3’s `Feature-Policy` header**

In a non-API Rails application, define a global browser-feature policy with `Rails.application.config.permissions_policy`. Rails then adds `ActionDispatch::PermissionsPolicy::Middleware`, which emits the legacy `Feature-Policy` response header. Despite the middleware’s name, Rails 8.1.3 does not emit the newer `Permissions-Policy` header.

```ruby
Rails.application.config.permissions_policy do |policy|
  policy.camera      :none
  policy.gyroscope   :none
  policy.microphone  :none
  policy.usb         :none
  policy.fullscreen  :self
  policy.payment     :self, "https://secure.example.com"
end
```


### Enforce HTTP Method and Redirection Semantics for Secure Request Dispatching

**Use when**

When managing HTTP request redirection flows and ensuring methods are appropriately handled following state-changing actions.

**Secure rules**

**Rule 1: Use `303 See Other` when a redirect must be followed with GET**

When redirecting after a request whose method must not be repeated at the destination, explicitly use `status: :see_other`. Rails documents that a 303 redirect is followed with GET. Do not rely on the default `302 Found` response to provide the same method-conversion guarantee.

```ruby
redirect_to posts_url, status: :see_other
```


### Secure Route Definitions and Parameter Constraints

**Use when**

Configuring application routes, resource endpoints, and parameter constraints in config/routes.rb.

**Secure rules**

**Rule 1: Enforce explicit HTTP verbs for resource routes and match definitions**

Always explicitly define allowed HTTP verbs using specific verb helpers like `get`, `post`, `patch`, or `delete`, or the `via` option on `match` to prevent unintended request processing and CSRF exposure on state-changing actions.

```ruby
Rails.application.routes.draw do
  get 'profile', to: 'users#show'
  match 'search', to: 'search#index', via: [:get, :post]
end
```

**Rule 2: Restrict dynamic route parameters with explicit regular expressions**

Apply explicit regex constraints using the `constraints:` option on dynamic route segments to reject malformed input, preventing route shadowing and unauthorized parameter processing.

```ruby
Rails.application.routes.draw do
  get '/users/:id', to: 'users#show', constraints: { id: /\d+/ }
end
```

**Rule 3: Limit exposed action routes using only or except options**

Restrict resource routes using the `:only` or `:except` options to expose strictly required controller actions and avoid exposing default public endpoints.

```ruby
resources :articles do
  resources :comments, only: [:index, :new, :create]
end
```


## Category: network boundary

### Configure trusted upstream proxy settings for secure TLS and header propagation

**Use when**

When operating the Rails application behind an upstream proxy, load balancer, or reverse proxy handling SSL termination and network routing boundaries.

**Secure rules**

**Rule 1: Enable `config.assume_ssl` when operating behind an SSL-terminating reverse proxy to ensure secure URL generation and cookie flags.**

Set `config.assume_ssl` to true in your production environment configuration so that Rails correctly identifies requests submitted over HTTPS through upstream proxies. This prevents the generation of unencrypted HTTP redirect URLs or insecure cookies.

```ruby
Rails.application.configure do
  config.assume_ssl = true
end
```


## Category: output encoding

### Prevent XSS by utilizing default HTML auto-escaping and avoiding raw output helpers

**Use when**

Rendering dynamic text, attributes, or user-supplied content within Action View ERB templates.

**Secure rules**

**Rule 1: Rely on standard ERB interpolation for automatic HTML encoding and avoid bypassing auto-escaping with the raw helper or unsafe modifiers.**

Action View automatically escapes HTML output in ERB view templates by default to prevent Cross-Site Scripting. Avoid passing untrusted user input directly to the raw helper or setting escape to false when using text truncation helpers, as both bypass automatic HTML encoding.

```html
<%= @comment.body %>
<%= truncate(user_supplied_text, length: 50) %>
```


### Sanitize Untrusted Markup With an Allowlist When HTML Must Be Rendered

**Use when**

A feature must store and render caller-supplied HTML rather than escaping it as plain text.

**Secure rules**

**Rule 1: Pass caller-supplied HTML through the `sanitize` helper with an explicit allowlist instead of `raw` or `html_safe`.**

When markup has to survive into the response, never mark untrusted strings as HTML-safe directly. Run them through Action View's `sanitize` helper with an explicit tag and attribute allowlist so scripts, event handlers, and unknown attributes are removed while the permitted formatting is kept.

```erb
<%= sanitize(@comment.body, tags: %w[p br strong em a], attributes: %w[href]) %>
```


### Neutralize Control Characters in Untrusted Values Before Logging

**Use when**

Writing request-derived values to `Rails.logger` or any application log.

**Secure rules**

**Rule 1: Strip or replace control characters in untrusted values before writing them to a log.**

Newlines and carriage returns in user-controlled data let an attacker forge or split log entries. Remove control characters before interpolating such values into a log message, in addition to configuring `config.filter_parameters` so sensitive fields never reach the logs.

```ruby
safe_value = params[:username].to_s.gsub(/[[:cntrl:]]/, " ")
Rails.logger.info("login attempt for #{safe_value}")
```


## Category: resource exhaustion

### Configure Explicit Timeouts and Connection Limits for External Services and Databases

**Use when**

When setting up cloud storage configurations, database connection pools, or query caches in Rails applications to prevent thread and resource exhaustion.

**Secure rules**

**Rule 1: Configure client timeouts and retries for Active Storage S3 services**

For an Active Storage entry using `service: S3`, configure sensible `http_open_timeout`, `http_read_timeout`, and `retry_limit` values to limit prolonged AWS client connections and request queuing. These are S3/AWS client options, not generic settings for every Active Storage cloud backend.

```yaml
amazon:
  service: S3
  bucket: <%= ENV.fetch("ACTIVE_STORAGE_S3_BUCKET") %>
  http_open_timeout: 0
  http_read_timeout: 0
  retry_limit: 0
```

**Rule 2: Cap ActiveRecord query cache size in database configuration.**

Specify a concrete integer limit for `query_cache` in your database pool configuration to cap the maximum number of cached query results per connection and prevent excessive memory consumption.

```yaml
production:
  adapter: postgresql
  encoding: unicode
  pool: 5
  query_cache: 100
```


## Category: runtime environment hardening

### Disable Detailed Exception Debugging in Production Environments

**Use when**

Configuring application environments for production deployment to prevent information disclosure.

**Secure rules**

**Rule 1: Set config.consider_all_requests_local to false in production configuration.**

Ensure that `config.consider_all_requests_local` is explicitly set to `false` within `config/environments/production.rb` to prevent Rails from exposing detailed exception backtraces and application runtime parameters to HTTP clients.

```ruby
Rails.application.configure do
  config.consider_all_requests_local = false
end
```


## Category: secret handling

### Filter Sensitive Request Parameters and Log Data to Prevent Exposure

**Use when**

Configuring request parameter logging and handling event notification payloads.

**Secure rules**

**Rule 1: Configure parameter filtering to automatically sanitize sensitive values from logs.**

Configure `config.filter_parameters` in initializers or environment config to automatically sanitize sensitive request parameters from logs, Rack environment configurations, and exception reports.

```ruby
# config/initializers/filter_parameters.rb
Rails.application.config.filter_parameters += [
  :password,
  :secret,
  :token,
  :credit_card,
  :access_token
]
```

**Rule 2: Filter sensitive parameters used by controller notifications**

Add sensitive request-parameter names to `config.filter_parameters`. Rails replaces matching values with `[FILTERED]`, and Action Controller constructs the `:params` and `:path` fields of its processing-notification payloads from the filtered request values.

```ruby
config.filter_parameters << :password
```


### Store Secrets and Keys Securely Using Encrypted Credentials and Environment Variables

**Use when**

Configuring application secrets, encryption keys, and service credentials in Rails.

**Secure rules**

**Rule 1: Store application secrets and encryption keys using encrypted credentials files or runtime environment variables.**

Use Rails encrypted credentials via `bin/rails credentials:edit` or pass keys through environment variables instead of hardcoding raw secret strings or encryption keys in source code.

```ruby
config.active_record.encryption.primary_key = ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"]
config.active_record.encryption.deterministic_key = ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"]
config.active_record.encryption.key_derivation_salt = ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"]
```

**Rule 2: Inject the production master key using runtime environment variables or container secret stores.**

Pass `RAILS_MASTER_KEY` through runtime environment variables or container secret stores rather than embedding the master key directly in Dockerfiles or image builds.

```bash
docker run --rm -it \
  -v app-storage:/rails/storage \
  -p 3000:3000 \
  --env RAILS_MASTER_KEY=$RAILS_MASTER_KEY \
  app
```


## Category: security control integrity

### Enforce database-level referential integrity and uniqueness constraints

**Use when**

Developing database migrations and defining ActiveRecord associations where model-level validations are insufficient to prevent race conditions and bypasses.

**Secure rules**

**Rule 1: Specify foreign key constraints in table migrations for associations.**

Explicitly include `foreign_key: true` when defining table associations in migrations so that referential integrity is enforced at the database layer rather than relying exclusively on model-level validations.

```ruby
class CreateBooks < ActiveRecord::Migration[8.1]
  def change
    create_table :books do |t|
      t.belongs_to :author, foreign_key: true
      t.datetime :published_at
      t.timestamps
    end
  end
end
```

**Rule 2: Add unique database indexes for sensitive unique identifier columns.**

Enforce database-level uniqueness constraints using unique indexes in migrations for sensitive identifier columns like emails or usernames to protect against race conditions.

```ruby
create_table :users do |t|
  t.string :name, index: true
  t.string :email, index: { unique: true, name: "unique_emails" }
end
```


### Prevent unintended writes during read-only database operations

**Use when**

Switching ActiveRecord connection roles to reading and executing read-only code blocks where write operations must be blocked.

**Secure rules**

**Rule 1: Set prevent_writes: true when switching connection roles to reading.**

Pass `prevent_writes: true` when manually switching connection roles via `ActiveRecord::Base.connected_to` to enforce application-level blocking of write operations and prevent accidental state changes.

```ruby
ActiveRecord::Base.connected_to(role: :reading, prevent_writes: true) do
  Person.all
end
```


## Category: session management

### Secure and Rotate Session State During Authentication and Configuration

**Use when**

When managing session cookies, enforcing expiration limits, and handling user authentication state transitions in Rails.

**Secure rules**

**Rule 1: Reset sessions on privilege changes to prevent session fixation**

Always call `reset_session` during authentication boundaries such as user login or privilege changes to invalidate existing session state and re-initialize session identifiers.

```ruby
class SessionsController < ApplicationController
  def create
    if user = User.authenticate(params[:email], params[:password])
      reset_session
      session[:user_id] = user.id
    end
  end
end
```

**Rule 2: Use CookieStore attributes to limit cookie exposure without treating them as XSS prevention**

For an HTTPS application, configure the session cookie with `secure`, `httponly`, and an appropriate `same_site` value. `secure` limits cookie transmission to HTTPS, `httponly` prevents JavaScript from reading the cookie through `document.cookie`, and `same_site` restricts when the cookie is sent in cross-site contexts. These attributes reduce cookie exposure but do not prevent XSS; address XSS by filtering malicious input and escaping output.

```ruby
Rails.application.config.session_store :cookie_store,
  key: "_app_session",
  secure: true,
  httponly: true,
  same_site: :lax
```

**Rule 3: Reset Controller Sessions to Clear Session Data**

Invoke `reset_session` on user logout or privilege changes to fully wipe session state from both the controller and HTTP request contexts.

```ruby
class SessionsController < ApplicationController
  def destroy
    reset_session
    redirect_to root_path, notice: "Logged out successfully"
  end
end
```
