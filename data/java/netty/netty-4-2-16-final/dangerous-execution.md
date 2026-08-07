# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: dangerous execution

## dangerous execution

### Secure Dynamic Class Resolution and Native Library Loading

**Use when**

Configuring class resolution for dynamic loading or setting up native library working directories in Netty applications.

**Secure rules**

**Rule 1: Allowlist classes when using Netty Java deserialization**

Avoid Netty’s deprecated Java-serialization codecs where possible. When they must be used, configure a `jdk.serialFilter` allowlist that permits only the classes expected by the application before accepting serialized objects. Supplying a particular `ClassLoader` to a `ClassResolver` does not replace deserialization filtering.

**Rule 2: Configure a secure native working directory for dynamic JNI library extraction**

When Netty dynamically extracts and loads JNI dynamic libraries, configure the native working directory using `io.netty.native.workdir` to point to a secure location accessible only by the application execution context. Avoid defaulting to world-writable temporary directories where local users could tamper with binaries prior to dynamic loading.

```java
System.setProperty("io.netty.native.workdir", "/var/run/app/private_native_libs");
NativeLibraryLoader.loadFirstAvailable(loader, "netty_transport_native_epoll");
```

**Rule 3: Retain automatic deletion of extracted native libraries after loading**

Leave `io.netty.native.deleteLibAfterLoading` unset or set it to `true`. Netty enables this behavior by default, deletes an extracted native-library file after loading to free resources, and schedules deletion at JVM exit when immediate deletion is disabled or unsuccessful.

```shell
java -Dio.netty.native.deleteLibAfterLoading=true -jar application.jar
```
