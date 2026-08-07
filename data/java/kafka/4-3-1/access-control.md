# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: access control

## access control

### Configure Explicit Access Control Lists and Authorizer Settings

**Use when**

When administering cluster security settings, defining topic or group access permissions, and configuring broker authorization mechanisms in Kafka.

**Secure rules**

**Rule 1: Configure the Kafka authorizer to enforce granular access control lists and maintain a fail-closed posture.**

Set `authorizer.class.name` to `org.apache.kafka.metadata.authorizer.StandardAuthorizer` in KRaft mode and ensure `allow.everyone.if.no.acl.found` is set to `false` to prevent unconfigured resources from being accessed by default.

```properties
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
allow.everyone.if.no.acl.found=false
super.users=User:admin
```

**Rule 2: Define explicit ACL bindings with specific principal types, resource patterns, and granular operations.**

Construct explicit `AclBinding` instances specifying resource types, restricted operations, and exact principal identifiers rather than using wildcard permissions or overly broad privileges.

```java
ResourcePattern pattern = new ResourcePattern(ResourceType.TOPIC, "orders-topic", PatternType.LITERAL);
AccessControlEntry entry = new AccessControlEntry("User:order-processor", "*", AclOperation.READ, AclPermissionType.ALLOW);
AclBinding binding = new AclBinding(pattern, entry);
adminClient.createAcls(Collections.singleton(binding)).all().get();
```


### Handle Authorization Exceptions and Inspect Authorized Operations

**Use when**

When executing administrative, produce, or consume operations in client applications that may encounter permission rejections or require permission introspection.

**Secure rules**

**Rule 1: Catch and handle granular authorization exceptions during cluster and resource management operations.**

Explicitly catch authorization-related execution exceptions such as `TopicAuthorizationException`, `ClusterAuthorizationException`, and `GroupAuthorizationException` when invoking administrative or data retrieval APIs to log security events and prevent unhandled application crashes.

```java
try {
    adminClient.deleteTopics(Collections.singleton("sensitive-topic")).all().get();
} catch (ExecutionException e) {
    if (e.getCause() instanceof TopicAuthorizationException) {
        TopicAuthorizationException authError = (TopicAuthorizationException) e.getCause();
        logger.error("Principal unauthorized to access topics: {}", authError.unauthorizedTopics());
    } else if (e.getCause() instanceof ClusterAuthorizationException) {
        logger.error("Principal lacks cluster-level authorization");
    }
}
```

**Rule 2: Request authorized operations explicitly when describing resource metadata.**

Call `includeAuthorizedOperations(true)` on options classes such as `DescribeTopicsOptions` when permission introspection is required to avoid receiving a `null` authorized operations response.

```java
DescribeTopicsOptions options = new DescribeTopicsOptions().includeAuthorizedOperations(true);
Map<String, TopicDescription> topicDescriptions = admin.describeTopics(List.of("my-topic"), options).allTopicNames().get();
Set<AclOperation> ops = topicDescriptions.get("my-topic").authorizedOperations();
if (ops != null && ops.contains(AclOperation.DELETE)) {
    // User is authorized to perform deletion
}
```


### Isolate Multi-Tenant Apache Kafka Resources and Prevent Cross-Tenant Access

**Use when**

Configuring access control lists, authorizers, prefixed resource patterns, and topic namespaces to isolate multiple tenants within a shared Apache Kafka cluster.

**Secure rules**

**Rule 1: Enforce granular resource-level ACL checks and scoping via prefixed resource patterns for multi-tenant Kafka operations.**

Validate tenant authorization against specific resource patterns and application identifiers before executing administrative operations or returning metadata. Restrict application principals to resources prefixed with their specific application ID to prevent cross-tenant access to changelog topics, repartition topics, and state stores.

```scala
val action = new Action(
  AclOperation.DESCRIBE_CONFIGS,
  new ResourcePattern(ResourceType.TOPIC, "tenant-a-topic", PatternType.LITERAL),
  1, true, true
)
authorizer.authorize(requestContext, util.List.of(action))
```

**Rule 2: Restrict controller management endpoints and administrative operations to authorized principals.**

Configure explicit authorizer plugins and super-user parameters to ensure non-administrative tenant principals are unauthorized to execute cluster-level operations, broker registrations, partition state alterations, or controller fetch operations.

```properties
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
super.users=User:CN=systemtest
```

**Rule 3: Disable automatic topic creation and enforce custom topic naming policies to prevent cross-tenant leakage.**

Set `auto.create.topics.enable=false` in broker configurations and specify a custom topic policy implementation via `create.topic.policy.class.name` to ensure tenants cannot implicitly create or access topics outside their assigned prefix boundary.

**Rule 4: Bind ACLs explicitly to specific user principals and tenant-scoped resource prefixes without wide wildcards.**

Avoid wildcard principals and host bindings to prevent unintended cross-tenant access. Structure tenant namespaces with disjoint, non-overlapping prefixes so that broader DENY rules do not inadvertently block legitimate ALLOW permissions on sub-resources.

```scala
val tenant1User = new KafkaPrincipal(KafkaPrincipal.USER_TYPE, "tenant1-app")
val tenant1Topic = new ResourcePattern(ResourceType.TOPIC, "tenant1.", PatternType.PREFIXED)
val allowRead = new AccessControlEntry(tenant1User.toString, "192.168.1.10", AclOperation.READ, AclPermissionType.ALLOW)
authorizer.createAcls(requestContext, List(new AclBinding(tenant1Topic, allowRead)).asJava)
```
