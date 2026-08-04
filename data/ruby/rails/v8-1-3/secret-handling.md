# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: secret handling

## secret handling

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
