# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: input interpretation safety

## input interpretation safety

### Validate Topic Names to Prevent Interpretation and Metric Collisions

**Use when**

When validating topic names in client applications or via topic policies to ensure unambiguous input interpretation.

**Secure rules**

**Rule 1: Avoid metric-name collisions between topic names that differ only by `.` and `_`**

Before creating a topic, compare the “unified” form of the new name—obtained by replacing `.` with `_`—with the unified forms of all existing topics. If any match is found, pick another name so that JMX metrics remain unambiguous.

```java
import org.apache.kafka.common.internals.Topic;
import java.util.Collection;

public static void ensureDistinctMetrics(String newTopic,
                                         Collection<String> existingTopics) {
    for (String current : existingTopics) {
        if (Topic.hasCollision(newTopic, current)) {   // Kafka 4.3.1 API
            throw new IllegalArgumentException(
                "Topic '" + newTopic + "' collides with existing topic '" +
                current + "' when metrics replace '.' with '_'. Choose a different name.");
        }
    }
}
```
