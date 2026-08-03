# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: deserialization

## deserialization

### Disable Unserialization During Decryption for Non-Object Payloads

**Use when**

When decrypting raw strings, cookies, or non-object values using `decrypt()` or `Encrypter` to prevent automatic PHP object instantiation.

**Secure rules**

**Rule 1: Explicitly disable unserialization when handling non-object payloads in decryption methods.**

When decrypting raw strings, tokens, or non-object values, developers should explicitly pass `unserialize: false` or utilize `decryptString()` to prevent PHP `unserialize()` from automatically processing decrypted payloads into instantiated objects. This avoids object injection gadget chains when handling arbitrary data.

```php
$encrypter = new \Illuminate\Encryption\Encrypter($key, 'aes-256-gcm');

// Safe string encryption and decryption without unserialization
$ciphertext = $encrypter->encryptString('sensitive-user-token');
$decryptedToken = $encrypter->decryptString($ciphertext);
```
