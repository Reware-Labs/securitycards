# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: network boundary

## network boundary

### Isolate controller bootstrap endpoints from broker client endpoints

**Use when**

Configuring administrative or management connections to Kafka KRaft cluster controllers to ensure control-plane endpoints remain segregated from data-plane client traffic.

**Secure rules**

**Rule 1: Configure AdminClientConfig.BOOTSTRAP_CONTROLLERS_CONFIG exclusively when administering controllers and remove standard bootstrap servers.**

When targeting cluster controllers directly for administrative operations, maintain strict isolation between broker data-plane endpoints and controller quorum administrative endpoints. Configure `AdminClientConfig.BOOTSTRAP_CONTROLLERS_CONFIG` exclusively and ensure standard `CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG` is removed so that control-plane metadata quorums are not exposed to unprivileged data-plane network clients.

```java
Map<String, Object> props = new HashMap<>();
props.put(AdminClientConfig.BOOTSTRAP_CONTROLLERS_CONFIG, "controller1:9093");
props.remove(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG);
try (Admin admin = Admin.create(props)) {
    // Execute controller management operations
}
```
