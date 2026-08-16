# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: cryptography

## cryptography

### Hash passwords slowly and draw tokens from a secure source

**Use when**

Registering users, verifying login credentials, or issuing session identifiers and API tokens.

**Secure rules**

**Rule 1: Store passwords as `bcrypt` or `argon2id` hashes, not plaintext or a fast digest.**

Anyone who obtains the database gets every stored value, and a bare `crypto/sha256` or `crypto/md5` digest barely helps: those are built to be fast, so commodity hardware tests billions of candidates per second. `bcrypt.GenerateFromPassword` applies a work factor and embeds a random salt, and `CompareHashAndPassword` compares in constant time. Bcrypt reads at most 72 bytes and returns `ErrPasswordTooLong` beyond that, so bound the field length; `argon2` suits longer passphrases.

```go
import "golang.org/x/crypto/bcrypt"

func storeUser(db *sql.DB, email, password string) error {
    hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    _, err = db.Exec(
        "INSERT INTO users (email, password_hash) VALUES (?, ?)", email, hash,
    )
    return err
}

func checkLogin(storedHash, supplied string) bool {
    return bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(supplied)) == nil
}
```

**Rule 2: Generate session tokens and identifiers with `crypto/rand`.**

`math/rand` is deterministic: from a handful of observed outputs its state can be recovered and every later token predicted. Session identifiers, reset codes, and API keys need `crypto/rand`, which reads the operating system's entropy source. Draw at least 16 bytes — 32 for long-lived tokens — and encode the raw bytes rather than reducing them to a short alphabet.

```go
import (
    "crypto/rand"
    "encoding/base64"
)

func newSessionToken() (string, error) {
    buf := make([]byte, 32)
    if _, err := rand.Read(buf); err != nil {
        return "", err
    }
    return base64.RawURLEncoding.EncodeToString(buf), nil
}
```

**Rule 3: Compare tokens and signatures in constant time.**

`==` and `bytes.Equal` stop at the first differing byte, so the time taken reveals how much of a guess was right and a remote caller can recover a token byte by byte. Use `subtle.ConstantTimeCompare` for opaque secrets and `hmac.Equal` for message authentication codes. Hashing both sides to a fixed length first also removes the length leak a raw comparison exposes.

```go
import (
    "crypto/sha256"
    "crypto/subtle"
)

func tokensMatch(presented, expected string) bool {
    a := sha256.Sum256([]byte(presented))
    b := sha256.Sum256([]byte(expected))
    return subtle.ConstantTimeCompare(a[:], b[:]) == 1
}
```
