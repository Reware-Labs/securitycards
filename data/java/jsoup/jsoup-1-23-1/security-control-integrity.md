# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: security control integrity

## security control integrity

### Configure Safelist instances completely before sharing across concurrent threads

**Use when**

When configuring and sharing Safelist and Cleaner instances across multiple concurrent threads in jsoup applications.

**Secure rules**

**Rule 1: Fully initialize Safelist instances prior to sharing or passing them to cleaner components, and use deep copies to isolate concurrent modifications.**

Safelist objects in jsoup are mutable. To ensure security control integrity across threads, applications must finish configuring a `Safelist` prior to sharing it or passing it to `Cleaner` instances, and must never mutate it while active. To derive a custom variant safely from a shared safelist, always use the deep copy constructor.

```java
Safelist baseSafelist = Safelist.relaxed();

Safelist threadSafelist = new Safelist(baseSafelist)
    .addAttributes("div", "class");

Cleaner cleaner = new Cleaner(threadSafelist);
```
