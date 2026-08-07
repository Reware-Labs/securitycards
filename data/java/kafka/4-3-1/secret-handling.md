# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: secret handling

## secret handling

### Externalize Sensitive Credentials and Secrets via Config Providers and Secure Storage

**Use when**

Configuring brokers, clients, connectors, or mirror makers where sensitive credentials like passwords, private keys, and client secrets need to be supplied securely without hardcoding plaintext values in configuration files or code.

**Secure rules**

**Rule 1: Externalize sensitive credentials with ConfigProviders instead of hard-coding them or placing them in JAAS files**

Never commit plaintext passwords, private keys, or client secrets to source code or static `jaas.conf`.
Kafka 4.3 supports `ConfigProvider` indirection so that configuration files reference secrets stored in protected locations (files, directories, environment variables, vaults). Define the provider and use the `${provider:path:key}` placeholder to load the secret at runtime.

```properties
# client.properties
config.providers=file
config.providers.file.class=org.apache.kafka.common.config.provider.FileConfigProvider
config.providers.file.param.allowed.paths=/etc/kafka/creds

ssl.keystore.key=${file:/etc/kafka/creds/keystore.properties:privateKey}
ssl.keystore.certificate.chain=${file:/etc/kafka/creds/keystore.properties:certChain}
ssl.keystore.password=${file:/etc/kafka/creds/keystore.properties:keystorePass}
sasl.oauthbearer.client.credentials.client.secret=${file:/etc/kafka/creds/oauth.properties:clientSecret}
```

**Rule 2: Do not expect sensitive values from describeConfigs**

Use `Admin.describeConfigs` to inspect Kafka resource configurations, but treat entries for which `ConfigEntry.isSensitive()` is true as unavailable. Kafka returns `null` for sensitive values to prevent their disclosure. Check both `isSensitive()` and `value()` before processing a configuration value.

```java
import org.apache.kafka.clients.admin.Admin;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.common.config.ConfigResource;

import java.util.Collections;
import java.util.Map;

public final class ConfigReader {
    public static void printVisibleConfigs(
            Admin admin,
            ConfigResource resource
    ) throws Exception {
        Map<ConfigResource, Config> configs = admin
                .describeConfigs(Collections.singleton(resource))
                .all()
                .get();

        for (ConfigEntry entry : configs.get(resource).entries()) {
            if (!entry.isSensitive() && entry.value() != null) {
                System.out.println(entry.name() + "=" + entry.value());
            }
        }
    }
}
```
