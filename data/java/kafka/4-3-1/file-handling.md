# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: file handling

## file handling

### Restrict Operating System Permissions on Keytab Files

**Use when**

Configuring Kerberos keytab files for authentication in Kafka environments.

**Secure rules**

**Rule 1: Ensure Kerberos keytab files are readable only by the Kafka process user**

Kafka 4.3.1 documentation requires that every keytab referenced in broker‐ or client‐side JAAS configurations be readable by *only* the operating-system account that launches the corresponding Kafka process. Apply restrictive filesystem permissions so no other local user can read or modify the keytab.

```conf
KafkaServer {
    com.sun.security.auth.module.Krb5LoginModule required
    useKeyTab=true
    storeKey=true
    keyTab="/etc/security/keytabs/kafka_server.keytab"
    principal="kafka/kafka1.example.com@EXAMPLE.COM";
};
```
