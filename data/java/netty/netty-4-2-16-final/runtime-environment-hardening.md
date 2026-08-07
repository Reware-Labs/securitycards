# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: runtime environment hardening

## runtime environment hardening

### Configure Platform Permissions, Privileged Blocks, and Runtime Hardening for Netty Components

**Use when**

Configuring Netty applications in environments enforcing Java SecurityManager restrictions, modular encapsulation, or custom platform permissions.

**Secure rules**

**Rule 1: Execute restricted network socket initialization conditionally under `AccessController.doPrivileged` after verifying security manager presence.**

Check whether `System.getSecurityManager() != null` before wrapping socket operations inside `AccessController.doPrivileged` to prevent unnecessary allocations and avoid capability exceptions.

```java
if (System.getSecurityManager() != null) {
    try {
        ServerSocketChannel ssc = AccessController.doPrivileged(
            new PrivilegedExceptionAction<ServerSocketChannel>() {
                @Override
                public ServerSocketChannel run() throws Exception {
                    ServerSocketChannel channel = ServerSocketChannel.open();
                    channel.socket().bind(null);
                    channel.configureBlocking(false);
                    return channel;
                }
            });
    } catch (PrivilegedActionException e) {
        throw (IOException) e.getCause();
    }
} else {
    ServerSocketChannel channel = ServerSocketChannel.open();
    channel.socket().bind(null);
    channel.configureBlocking(false);
}
```

**Rule 2: Bind worker threads explicitly to a designated `ThreadGroup` using `DefaultThreadFactory`.**

Pass an explicit `ThreadGroup` parameter when instantiating `DefaultThreadFactory` to enforce distinct execution boundaries instead of inheriting the caller thread group dynamically.

```java
ThreadGroup isolatedGroup = new ThreadGroup("isolated-workers");
DefaultThreadFactory factory = new DefaultThreadFactory(
    "worker-pool",
    false,
    Thread.NORM_PRIORITY,
    isolatedGroup
);
Thread worker = factory.newThread(task);
```

**Rule 3: Disable Netty Unsafe capability probes in restricted sandbox runtime environments.**

Set the JVM system property `-Dio.netty.noUnsafe=true` when launching applications in secure environments to prevent dynamic acquisition of `sun.misc.Unsafe` capabilities.

```bash
java -Dio.netty.noUnsafe=true -jar my-netty-application.jar
```

**Rule 4: Restrict native library extraction work directory permissions to a private, secure path.**

Configure the `io.netty.native.workdir` system property to point to a dedicated, process-private directory with restricted filesystem permissions and native execution support.

```bash
java -Dio.netty.native.workdir=/var/run/app/netty-native -jar myapp.jar
```
