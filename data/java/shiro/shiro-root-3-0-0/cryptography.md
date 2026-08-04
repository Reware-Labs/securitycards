# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: cryptography

## cryptography

### Configure Persistent Cipher Keys and Flush Cipher Streams

**Use when**

When managing remember-me encryption keys and utilizing stream-based cipher operations.

**Secure rules**

**Rule 1: Explicitly configure a strong, persistent symmetric cipher key on `AbstractRememberMeManager`.**

Avoid relying on default instance-level generated keys by configuring a persistent cipher key using `setCipherKey` so that remembered identity tokens can be decrypted across application restarts.

```java
byte[] secretCipherKey = getSecretKeyFromVault();
AbstractRememberMeManager rememberMeManager = (AbstractRememberMeManager) securityManager.getRememberMeManager();
rememberMeManager.setCipherKey(secretCipherKey);
```

**Rule 2: Explicitly flush and close both input and output streams after stream-based cipher operations.**

CipherService stream methods do not automatically flush or close streams upon completion, so developers must manage streams explicitly to prevent truncated outputs or resource exhaustion.

```java
try (InputStream in = Files.newInputStream(inputPath);
     OutputStream out = Files.newOutputStream(outputPath)) {
    cipherService.encrypt(in, out, keyBytes);
    out.flush();
} catch (CryptoException e) {
    // Handle cryptographic error
}
```


### Configure Strong Cryptographic Hash Algorithms and Password Services

**Use when**

When configuring password hashing, credential matchers, and hash services for user authentication.

**Secure rules**

**Rule 1: Configure HashedCredentialsMatcher to use strong cryptographic hash algorithms such as SHA-256 or higher.**

Avoid legacy algorithms like MD5 and SHA-1 which are vulnerable to collisions and fast brute-forcing. Initialize `HashedCredentialsMatcher` with a strong algorithm name and appropriate hash iterations.

```java
HashedCredentialsMatcher matcher = new HashedCredentialsMatcher(Sha256Hash.ALGORITHM_NAME);
matcher.setHashIterations(1024);
```

**Rule 2: Use ParsableHashFormat to maintain backward compatibility for saved password hashes.**

When customizing the HashFormat in `DefaultPasswordService`, ensure the configured format implements `ParsableHashFormat` such as `Shiro2CryptFormat` so saved password hashes encode their algorithm, parameters, and salt.

```java
DefaultPasswordService passwordService = new DefaultPasswordService();
passwordService.setHashFormat(new Shiro2CryptFormat());
```

**Rule 3: Use Shiro1CryptFormat for lossless cryptographic hash storage.**

Ensure applications handle full Base64-encoded digest and salt tokens when storing hashed credentials using `Shiro1CryptFormat` to allow lossless reconstruction of `Hash` objects.

```java
Shiro1CryptFormat format = new Shiro1CryptFormat();
String formattedHash = format.format(hash);
Hash restoredHash = format.parse(formattedHash);
```


### Generate and Manage Cryptographically Secure Salts and Initialization Vectors

**Use when**

When performing encryption operations, cipher services, and salting credentials in custom realms.

**Secure rules**

**Rule 1: Maintain auto-generated initialization vectors and avoid ECB mode for block cipher services.**

Keep initialization vector generation enabled by default using `AesCipherService` and avoid switching to Electronic Codebook mode to prevent exposure of ciphertext patterns.

```java
DefaultBlockCipherService cipherService = new AesCipherService();
byte[] encrypted = cipherService.encrypt(plainText, key).getBytes();
```

**Rule 2: Use cryptographically strong random salts for password and credential hashing.**

Always generate a cryptographically strong random salt for each user using `SecureRandomNumberGenerator` rather than using predictable values such as usernames or static strings.

```java
SecureRandomNumberGenerator rng = new SecureRandomNumberGenerator();
ByteSource salt = rng.nextBytes();
String hashedPassword = new Sha256Hash(plainPassword, salt, 1024).toBase64();
```

**Rule 3: Explicitly configure cipher services with byte-aligned initialization vector sizes and strong secure random generators.**

Specify initialization vector sizes in bits as a positive multiple of 8, and supply an explicit strong `SecureRandom` instance if the default provider is insufficient.

```java
JcaCipherService cipherService = new AesCipherService();
cipherService.setInitializationVectorSize(128);
SecureRandom secureRandom = SecureRandom.getInstanceStrong();
cipherService.setSecureRandom(secureRandom);
```
