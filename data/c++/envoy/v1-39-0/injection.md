# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: injection

## injection

### Percent-encode parameters in AWS STS AssumeRole query strings

**Use when**

When constructing query strings for AWS STS AssumeRole requests from user-configurable parameters.

**Secure rules**

**Rule 1: Always percent-encode parameter values when building AWS STS AssumeRole request paths.**

Prevent parameter injection and query string structure manipulation by applying `Envoy::Http::Utility::PercentEncoding::encode` to all parameters such as `role_arn`, `role_session_name`, and `external_id` before embedding them into query strings.

```cpp
std::string path = fmt::format("/?Version=2011-06-15&Action=AssumeRole&RoleArn={}&RoleSessionName={}",
                              Envoy::Http::Utility::PercentEncoding::encode(role_arn),
                              Envoy::Http::Utility::PercentEncoding::encode(role_session_name));
if (!external_id.empty()) {
  path += fmt::format("&ExternalId={}", Envoy::Http::Utility::PercentEncoding::encode(external_id));
}
```
