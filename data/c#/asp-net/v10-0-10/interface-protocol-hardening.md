# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: interface protocol hardening

## interface protocol hardening

### Restrict Access Token Extraction to Appropriate Transport Protocols

**Use when**

Configuring JWT bearer authentication events to extract access tokens from query string parameters for specific network protocols like WebSockets or Server-Sent Events.

**Secure rules**

**Rule 1: Restrict reading access tokens from query string parameters to WebSockets or Server-Sent Events and enforce explicit route path checking.**

When configuring `JwtBearerEvents.OnMessageReceived`, ensure token extraction from the query string is limited strictly to transport protocols where custom HTTP headers cannot be set, such as WebSockets or Server-Sent Events. Validate the target request path using `StartsWithSegments` to prevent exposing tokens across unauthorized endpoints.

```csharp
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;
        if (!string.IsNullOrEmpty(accessToken) &&
            path.StartsWithSegments("/broadcast") &&
            (context.HttpContext.WebSockets.IsWebSocketRequest || context.Request.Headers["Accept"] == "text/event-stream"))
        {
            context.Token = accessToken;
        }
        return Task.CompletedTask;
    }
};
```


### Secure Inter-Process and Inter-Component Communication Channels and IPC Endpoints

**Use when**

Configuring local named pipes, inter-component streaming endpoints, inter-process communication transports, or message dispatchers in ASP.NET applications.

**Secure rules**

**Rule 1: Secure Windows named-pipe endpoints with ACLs and an explicit impersonation level**

For Kestrel’s named-pipe transport on Windows, restrict server access to the intended SID and keep `CurrentUserOnly` true, then connect with a client impersonation level that prevents the server from acting on the caller’s identity.

```csharp
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;

// ---------- Server configuration ----------
var pipeName = "myapp_pipe";

// Grant the current user full access; no one else.
var sid = WindowsIdentity.GetCurrent().User!;
var security = new PipeSecurity();
security.AddAccessRule(new PipeAccessRule(
    sid,
    PipeAccessRights.ReadWrite | PipeAccessRights.CreateNewInstance,
    AccessControlType.Allow));

builder.WebHost.ConfigureKestrel(k =>
{
    k.ListenNamedPipe(pipeName, opts =>
    {
        opts.CurrentUserOnly = true;   // refuse other users/elevation levels
        opts.PipeSecurity    = security;
    });
});

// ---------- Client connection ----------
using var client = new NamedPipeClientStream(
    serverName: ".",
    pipeName:  pipeName,
    direction: PipeDirection.InOut,
    options:   PipeOptions.Asynchronous | PipeOptions.WriteThrough,
    impersonationLevel: TokenImpersonationLevel.Identification); // server cannot impersonate fully

await client.ConnectAsync();
```

**Rule 2: Verify connection context before handling commands, and configure protocol & buffer limits on raw endpoints**

For IPC or SignalR-style endpoints, ensure a valid context (for example, an attached `PageContext`) exists **before** processing non-bootstrap messages, then constrain the connection with a minimum protocol version and tight application/transport buffer limits to mitigate request tampering and resource-exhaustion attacks.

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Http.Connections;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Raw connection endpoint with strict limits
app.MapConnectionHandler<ChatConnectionHandler>("/chat", options =>
{
    options.MinimumProtocolVersion = 1;          // refuse outdated handshake formats
    options.TransportMaxBufferSize   = 65 * 1024; // back-pressure for outgoing data
    options.ApplicationMaxBufferSize = 65 * 1024; // back-pressure for incoming data
});

app.Run();

// Connection-handler that refuses commands until bootstrap (context attach) succeeded
public sealed class ChatConnectionHandler : ConnectionHandler
{
    public override async Task OnConnectedAsync(ConnectionContext connection)
    {
        if (!connection.Items.TryGetValue("PageContext", out var ctx) || ctx is not PageContext)
        {
            await connection.AbortAsync(new InvalidOperationException(
                "Cannot process IPC messages when no page context is attached."));
            return;
        }

        // …process validated messages…
    }
}
```
