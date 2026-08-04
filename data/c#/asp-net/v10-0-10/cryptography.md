# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: cryptography

## cryptography

### Configure Authenticated Encryption and Cryptographic Algorithms in ASP.NET Core Data Protection

**Use when**

Configuring cryptographic algorithms, encryption mechanisms, and exception handling for data protection and payload encryption.

**Secure rules**

**Rule 1: Configure Data Protection with approved algorithms and let the framework handle AAD**

Use `UseCryptographicAlgorithms` to select FIPS-approved ciphers.

* **AES-CBC with HMAC** (confidentiality + integrity) – pick a matching `ValidationAlgorithm`.
* **AES-GCM** (built-in authentication) – omit `ValidationAlgorithm`; the property is ignored.

```csharp
// AES-256-CBC with explicit HMAC-SHA-256 validation
builder.Services.AddDataProtection()
    .UseCryptographicAlgorithms(
        new AuthenticatedEncryptorConfiguration
        {
            EncryptionAlgorithm  = EncryptionAlgorithm.AES_256_CBC,
            ValidationAlgorithm  = ValidationAlgorithm.HMACSHA256
        });

// — or — AES-256-GCM (validation built in; no ValidationAlgorithm needed)
builder.Services.AddDataProtection()
    .UseCryptographicAlgorithms(
        new AuthenticatedEncryptorConfiguration
        {
            EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM
        });
// Later: normal protect / unprotect flow.
// Data Protection automatically supplies and checks its own AAD.
var protector = app.Services.GetRequiredService<IDataProtectionProvider>().CreateProtector("sample-purpose");

byte[] ciphertext = protector.Protect("secret"u8.ToArray());
byte[] plaintext  = protector.Unprotect(ciphertext);
```

**Rule 2: Verify the MAC before decrypting and expose only a generic `CryptographicException`**

Always calculate and validate the message-authentication code (HMAC) over the IV and ciphertext — using constant-time comparison — *before* a CBC-mode decryption is attempted. If either the integrity check or the decryption fails, throw a single, generic `CryptographicException` so callers cannot distinguish between padding and authentication errors, blocking padding-oracle attacks.

```csharp
using System;
using System.Security.Cryptography;

byte[] DecryptAuthenticatedPayload(
    byte[] cipherText, byte[] iv, byte[] actualTag,
    ReadOnlySpan<byte> encKey, ReadOnlySpan<byte> macKey)
{
    try
    {
        // 1.  Compute expected HMAC(tag) over IV || ciphertext.
        using var hmac = new HMACSHA256(macKey.ToArray());
        byte[] expectedTag = hmac.ComputeHash(
            Combine(iv, cipherText)); // Combine concatenates the arrays.

        // 2.  Reject tampered data *before* decryption.
        if (!CryptographicOperations.FixedTimeEquals(expectedTag, actualTag))
        {
            throw new CryptographicException("Authentication tag mismatch.");
        }

        // 3.  Proceed to decrypt.
        using var aes = Aes.Create();
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using ICryptoTransform decryptor = aes.CreateDecryptor(encKey.ToArray(), iv);
        return decryptor.TransformFinalBlock(cipherText, 0, cipherText.Length);
    }
    catch (Exception)
    {
        // Return a generic failure to avoid oracle disclosures.
        throw new CryptographicException("The payload could not be decrypted or authenticated.");
    }
}
```

**Rule 3: Ensure custom algorithm implementations provide public parameterless constructors and valid key sizes.**

When configuring managed or custom authenticated encryption types, ensure custom `SymmetricAlgorithm` and `KeyedHashAlgorithm` subclasses maintain a public parameterless constructor and use key sizes of at least 128 bits to prevent deserialization failures and weak cryptographic security.

```csharp
builder.Services.AddDataProtection()
    .UseCustomCryptographicAlgorithms(new ManagedAuthenticatedEncryptorConfiguration
    {
        EncryptionAlgorithmType = typeof(System.Security.Cryptography.Aes),
        EncryptionAlgorithmKeySize = 256,
        ValidationAlgorithmType = typeof(System.Security.Cryptography.HMACSHA256)
    });
```


### Restrict Supported WebAuthn Passkey Algorithms

**Use when**

Configuring passkey registration options and security policies in ASP.NET Core Identity.

**Secure rules**

**Rule 1: Configure allowed algorithm predicates for WebAuthn passkey registration.**

Configure the `IdentityPasskeyOptions.IsAllowedAlgorithm` delegate to restrict which public key algorithms are permitted during WebAuthn passkey registration and attestation, ensuring that only strong cryptographic algorithms are accepted.

```csharp
builder.Services.Configure<IdentityPasskeyOptions>(options =>
{
    options.IsAllowedAlgorithm = alg => alg == -7 || alg == -8;
});
```
