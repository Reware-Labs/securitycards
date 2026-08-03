# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: configuration source integrity

## configuration source integrity

### Use Trusted Local File Paths for Dynamic Module Certificate Validators

**Use when**

Configuring dynamic module TLS certificate validators or shared library paths where configuration source integrity must be maintained.

**Secure rules**

**Rule 1: Specify dynamic module source libraries using trusted local filesystem paths or registered module names.**

Ensure that dynamic module shared library paths reference local trusted files using `module.local.filename` or `dynamic_module_config.name`, as remote fetching of dynamic module shared libraries is unsupported and can lead to context creation errors or insecure module loading.

```yaml
typed_config:
  "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.cert_validator.dynamic_modules.v3.DynamicModuleCertValidatorConfig
  dynamic_module_config:
    module:
      local:
        filename: /etc/envoy/modules/libcert_validator.so
  validator_name: custom_validator
```
