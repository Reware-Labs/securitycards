# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: api contract misuse

## api contract misuse

### Pass blind recipients using the dedicated bcc argument

**Use when**

When configuring email messages with blind carbon copy recipients using `EmailMessage`.

**Secure rules**

**Rule 1: Provide blind recipients via the dedicated bcc keyword argument rather than custom headers.**

Do not include a `Bcc` key inside the custom headers dictionary passed to `EmailMessage`. Django 6.0.7 does not reject `Bcc` in custom headers, which can expose blind recipient addresses in the generated message. Always pass blind carbon copy email addresses using the dedicated `bcc` argument.

```python
email = EmailMessage(
    subject='Notification',
    body='Internal update',
    from_email='admin@example.com',
    to=['user@example.com'],
    bcc=['audit@example.com'],
)
```
