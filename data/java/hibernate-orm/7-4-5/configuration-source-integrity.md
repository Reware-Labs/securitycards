# Security cards

Repository: `https://github.com/hibernate/hibernate-orm#7.4.5`
Category: configuration source integrity

## configuration source integrity

### Validate dynamic event listener configurations from trusted sources

**Use when**

Configuring event listeners or initializing the SessionFactory in Hibernate.

**Secure rules**

**Rule 1: Register fixed event listener classes programmatically instead of accepting externally supplied class names**

When event listener selection must not be externally configurable, register the application’s known listener class through an `Integrator` and `EventListenerRegistry` instead of constructing `hibernate.event.listener.*` property values from external input.

```java
public final class ApplicationEventIntegrator implements Integrator {
    @Override
    public void integrate(
            Metadata metadata,
            BootstrapContext bootstrapContext,
            SessionFactoryImplementor sessionFactory) {
        sessionFactory.getEventListenerRegistry().appendListeners(
                EventType.AUTO_FLUSH,
                CustomAutoFlushListener.class
        );
    }
}
```
