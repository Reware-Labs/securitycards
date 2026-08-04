# Security cards

Repository: `https://github.com/automattic/mongoose#9.8.0`
Category: cryptography

## cryptography

### Configure Client-Side Field-Level Encryption and Auto-Encryption Options

**Use when**

Defining schemas with sensitive paths requiring cryptographic protection and initializing database connections with key management configurations.

**Secure rules**

**Rule 1: Declare encryption metadata on schema paths using explicit BSON types and supply `autoEncryption` options during connection initialization.**

Specify cryptographic parameters such as `keyId` and algorithm definitions directly on sensitive schema paths using supported BSON-compatible types, and configure `autoEncryption` options including `kmsProviders` and `keyVaultNamespace` when opening the database connection.

```javascript
const schema = new Schema({
  ssn: {
    type: String,
    encrypt: {
      keyId: [dataKeyUUID],
      algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
    }
  }
}, {
  encryptionType: 'csfle'
});

const connection = createConnection();
const User = connection.model('User', schema);

await connection.openUri(connectionUri, {
  autoEncryption: {
    keyVaultNamespace: 'keyvault.datakeys',
    kmsProviders: {
      local: { key: localKmsKeyBuffer }
    }
  }
});
```
