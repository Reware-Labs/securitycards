# Security cards

Repository: `https://github.com/rails/rails#v8.1.3`
Category: network boundary

## network boundary

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
