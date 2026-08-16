# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: network boundary

## network boundary

### Verify SMTP TLS Certificates and Hostnames in Email Connections

**Use when**

Configuring Django's email backend to send messages securely over SMTP.

**Secure rules**

**Rule 1: Maintain default TLS certificate and hostname verification for SMTP email connections.**

Use standard settings for secure SMTP email delivery by setting `EMAIL_BACKEND` to `django.core.mail.backends.smtp.EmailBackend`, enabling `EMAIL_USE_TLS`, and specifying the correct `EMAIL_PORT`. Avoid overriding the `ssl_context` property to disable certificate or hostname checks.

```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_USE_TLS = True
EMAIL_PORT = 587
```
