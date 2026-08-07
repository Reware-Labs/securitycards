# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: deserialization

## deserialization

### Restrict Accepted Serializers and Content Types to Safe Formats

**Use when**

Configuring Celery workers, custom message consumers, and client applications to deserialize task messages and results securely.

**Secure rules**

**Rule 1: Restrict accepted content types to safe formats such as JSON and avoid untrusted message payloads using Python pickle.**

Configure Celery to explicitly require and accept only safe serialization formats by setting `accept_content` and task serializers to secure formats like `json`. Avoid using `application/x-python-serialize` or allowing unvalidated formats.

```python
app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json']
)
```

**Rule 2: Explicitly restrict accepted content types when defining custom message consumers.**

When instantiating `Consumer` objects inside custom consumer bootsteps, use the `accept` parameter to restrict message serialization to safe formats such as `json` and prevent processing of arbitrary or dangerous payloads.

```python
from celery import bootsteps
from kombu import Consumer, Exchange, Queue

my_queue = Queue('custom', Exchange('custom'), 'routing_key')

class MyConsumerStep(bootsteps.ConsumerStep):
    def get_consumers(self, channel):
        return [Consumer(channel,
                         queues=[my_queue],
                         callbacks=[self.handle_message],
                         accept=['json'])]

    def handle_message(self, body, message):
        message.ack()
```
